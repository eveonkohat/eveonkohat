"use server"

import { revalidatePath } from "next/cache"
import { requireTenant } from "./require-tenant"
import { postLedgerEntry } from "./ledger"
import {
  scooterPurchaseSchema,
  otherPurchaseSchema,
  purchaseReturnSchema,
} from "@/lib/validations/purchases"
import type { ActionResult } from "./require-tenant"

export async function createScooterPurchase(formData: FormData): Promise<ActionResult> {
  const parsed = scooterPurchaseSchema.safeParse({
    vehicle_type: formData.get("vehicle_type"),
    make: formData.get("make"),
    model: formData.get("model"),
    color: formData.get("color"),
    year: formData.get("year") || undefined,
    date: formData.get("date"),
    purchase_price: formData.get("purchase_price"),
    tax_per_unit: formData.get("tax_per_unit"),
    carriage_per_unit: formData.get("carriage_per_unit"),
    quantity: formData.get("quantity"),
    party_id: formData.get("party_id") || undefined,
    chassis_no: formData.get("chassis_no") || undefined,
    engine_no: formData.get("engine_no") || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const d = parsed.data
  const unitCost = d.purchase_price + d.tax_per_unit + d.carriage_per_unit
  const totalAmount = unitCost * d.quantity

  const { data: purchase, error } = await supabase
    .from("purchases")
    .insert({
      tenant_id: tenantId,
      party_id: d.party_id || null,
      date: d.date,
      vehicle_type: d.vehicle_type,
      make: d.make,
      model: d.model,
      color: d.color || null,
      year: d.year ?? null,
      purchase_price: d.purchase_price,
      tax_per_unit: d.tax_per_unit,
      carriage_per_unit: d.carriage_per_unit,
      quantity: d.quantity,
      total_amount: totalAmount,
      paid_amount: 0,
      balance: totalAmount,
      status: "in-stock",
    })
    .select("id")
    .single()

  if (error || !purchase) {
    return { success: false, error: error?.message ?? "Could not create purchase" }
  }

  const scooterRows = Array.from({ length: d.quantity }, () => ({
    tenant_id: tenantId,
    purchase_id: purchase.id,
    make: d.make,
    model: d.model,
    year: d.year ?? null,
    color: d.color || null,
    vehicle_type: d.vehicle_type,
    chassis_no: d.quantity === 1 ? d.chassis_no || null : null,
    engine_no: d.quantity === 1 ? d.engine_no || null : null,
    purchase_price: unitCost,
    status: "in_stock" as const,
  }))

  const { error: scootersError } = await supabase.from("scooters").insert(scooterRows)
  if (scootersError) {
    return { success: false, error: scootersError.message }
  }

  if (d.party_id && totalAmount > 0) {
    await supabase.rpc("adjust_party_balance", {
      p_tenant_id: tenantId,
      p_party_id: d.party_id,
      p_delta: totalAmount,
    })
  }

  revalidatePath("/purchase")
  revalidatePath("/stock")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function createOtherPurchase(formData: FormData): Promise<ActionResult> {
  const parsed = otherPurchaseSchema.safeParse({
    date: formData.get("date"),
    party_id: formData.get("party_id") || undefined,
    item_name: formData.get("item_name"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    paid_amount: formData.get("paid_amount"),
    payment_account_id: formData.get("payment_account_id") || undefined,
    description: formData.get("description"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const d = parsed.data
  const totalAmount = d.unit_price * d.quantity
  const balance = Math.max(totalAmount - d.paid_amount, 0)

  const { error } = await supabase.from("other_items").insert({
    tenant_id: tenantId,
    party_id: d.party_id || null,
    date: d.date,
    item_name: d.item_name,
    quantity: d.quantity,
    quantity_remaining: d.quantity,
    unit_price: d.unit_price,
    total_amount: totalAmount,
    paid_amount: d.paid_amount,
    balance,
    payment_account_id: d.payment_account_id || null,
    description: d.description || null,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (d.paid_amount > 0 && d.payment_account_id) {
    await postLedgerEntry(supabase, {
      tenantId,
      accountId: d.payment_account_id,
      direction: "out",
      amount: d.paid_amount,
      category: "Purchase",
      description: `Purchase: ${d.item_name}`,
      sourceType: "purchase",
    })
  }

  if (d.party_id && balance > 0) {
    await supabase.rpc("adjust_party_balance", {
      p_tenant_id: tenantId,
      p_party_id: d.party_id,
      p_delta: balance,
    })
  }

  revalidatePath("/purchase")
  revalidatePath("/stock")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function createPurchaseReturn(formData: FormData): Promise<ActionResult> {
  const parsed = purchaseReturnSchema.safeParse({
    scooter_id: formData.get("scooter_id"),
    return_date: formData.get("return_date"),
    agreed_return_amount: formData.get("agreed_return_amount"),
    notes: formData.get("notes"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const d = parsed.data

  const { data: scooter } = await supabase
    .from("scooters")
    .select("purchase_id")
    .eq("id", d.scooter_id)
    .eq("tenant_id", tenantId)
    .single()

  const { error: returnError } = await supabase.from("purchase_returns").insert({
    tenant_id: tenantId,
    scooter_id: d.scooter_id,
    return_date: d.return_date,
    agreed_return_amount: d.agreed_return_amount,
    notes: d.notes || null,
  })

  if (returnError) {
    return { success: false, error: returnError.message }
  }

  const { error: scooterError } = await supabase
    .from("scooters")
    .update({ status: "returned" })
    .eq("id", d.scooter_id)
    .eq("tenant_id", tenantId)

  if (scooterError) {
    return { success: false, error: scooterError.message }
  }

  if (scooter?.purchase_id && d.agreed_return_amount > 0) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("party_id")
      .eq("id", scooter.purchase_id)
      .single()

    if (purchase?.party_id) {
      await supabase.rpc("adjust_party_balance", {
        p_tenant_id: tenantId,
        p_party_id: purchase.party_id,
        p_delta: -d.agreed_return_amount,
      })
    }
  }

  revalidatePath("/purchase")
  revalidatePath("/stock")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deletePurchase(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()

  const { error: scootersError } = await supabase
    .from("scooters")
    .delete()
    .eq("purchase_id", id)
    .eq("tenant_id", tenantId)
    .eq("status", "in_stock")

  if (scootersError) return { success: false, error: scootersError.message }

  const { error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/purchase")
  revalidatePath("/stock")
  return { success: true }
}

export async function deleteOtherPurchase(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()
  const { error } = await supabase
    .from("other_items")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/purchase")
  revalidatePath("/stock")
  return { success: true }
}
