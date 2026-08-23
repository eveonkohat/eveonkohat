"use server"

import { revalidatePath } from "next/cache"
import { requireTenant } from "./require-tenant"
import { postLedgerEntry } from "./ledger"
import { bikeSaleSchema, posSaleSchema } from "@/lib/validations/sales"
import type { ActionResult } from "./require-tenant"
import type { PosSaleItem } from "@/types/database"

export async function createBikeSale(formData: FormData): Promise<ActionResult> {
  const parsed = bikeSaleSchema.safeParse({
    bike_id: formData.get("bike_id"),
    customer_name: formData.get("customer_name"),
    customer_cnic: formData.get("customer_cnic"),
    customer_phone: formData.get("customer_phone"),
    date: formData.get("date"),
    total_amount: formData.get("total_amount"),
    received_amount: formData.get("received_amount"),
    payment_account_id: formData.get("payment_account_id") || undefined,
    notes: formData.get("notes"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const d = parsed.data
  const balance = Math.max(d.total_amount - d.received_amount, 0)
  const paymentStatus = balance === 0 ? "received" : d.received_amount > 0 ? "partial" : "pending"

  const { data: bike } = await supabase
    .from("bikes")
    .select("status")
    .eq("id", d.bike_id)
    .eq("tenant_id", tenantId)
    .single()

  if (!bike || bike.status !== "in_stock") {
    return { success: false, error: "This bike is no longer available for sale" }
  }

  const { data: sale, error } = await supabase
    .from("bike_sales")
    .insert({
      tenant_id: tenantId,
      bike_id: d.bike_id,
      customer_name: d.customer_name,
      customer_cnic: d.customer_cnic || null,
      customer_phone: d.customer_phone || null,
      date: d.date,
      total_amount: d.total_amount,
      received_amount: d.received_amount,
      balance,
      payment_status: paymentStatus,
      payment_account_id: d.payment_account_id || null,
      notes: d.notes || null,
    })
    .select("id")
    .single()

  if (error || !sale) {
    return { success: false, error: error?.message ?? "Could not record sale" }
  }

  await supabase
    .from("bikes")
    .update({ status: "sold", sold_price: d.total_amount })
    .eq("id", d.bike_id)
    .eq("tenant_id", tenantId)

  if (d.received_amount > 0 && d.payment_account_id) {
    await postLedgerEntry(supabase, {
      tenantId,
      accountId: d.payment_account_id,
      direction: "in",
      amount: d.received_amount,
      category: "Bike Sale",
      description: `Sale to ${d.customer_name}`,
      sourceType: "sale",
      sourceId: sale.id,
    })
  }

  revalidatePath("/sale")
  revalidatePath("/stock")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function createPosSale(formData: FormData): Promise<ActionResult> {
  const itemsRaw = formData.get("items")
  let items: PosSaleItem[] = []
  try {
    items = JSON.parse(typeof itemsRaw === "string" ? itemsRaw : "[]")
  } catch {
    return { success: false, error: "Invalid line items" }
  }

  const parsed = posSaleSchema.safeParse({
    customer_name: formData.get("customer_name") || "Cash Customer",
    customer_phone: formData.get("customer_phone"),
    date: formData.get("date"),
    items,
    terms_and_conditions: formData.get("terms_and_conditions"),
    grand_total: formData.get("grand_total"),
    received_amount: formData.get("received_amount"),
    payment_account_id: formData.get("payment_account_id") || undefined,
    invoice_notes: formData.get("invoice_notes"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const d = parsed.data
  const balance = Math.max(d.grand_total - d.received_amount, 0)

  const { data: sale, error } = await supabase
    .from("pos_sales")
    .insert({
      tenant_id: tenantId,
      customer_name: d.customer_name,
      customer_phone: d.customer_phone || null,
      date: d.date,
      items: d.items,
      terms_and_conditions: d.terms_and_conditions || null,
      grand_total: d.grand_total,
      received_amount: d.received_amount,
      balance,
      payment_account_id: d.payment_account_id || null,
      invoice_notes: d.invoice_notes || null,
    })
    .select("id")
    .single()

  if (error || !sale) {
    return { success: false, error: error?.message ?? "Could not record invoice" }
  }

  if (d.received_amount > 0 && d.payment_account_id) {
    await postLedgerEntry(supabase, {
      tenantId,
      accountId: d.payment_account_id,
      direction: "in",
      amount: d.received_amount,
      category: "POS Sale",
      description: `POS invoice for ${d.customer_name}`,
      sourceType: "sale",
      sourceId: sale.id,
    })
  }

  revalidatePath("/sale")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteBikeSale(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()

  const { data: sale } = await supabase
    .from("bike_sales")
    .select("bike_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single()

  const { error } = await supabase
    .from("bike_sales")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }

  if (sale?.bike_id) {
    await supabase
      .from("bikes")
      .update({ status: "in_stock", sold_price: null })
      .eq("id", sale.bike_id)
      .eq("tenant_id", tenantId)
  }

  revalidatePath("/sale")
  revalidatePath("/stock")
  return { success: true }
}

export async function deletePosSale(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()
  const { error } = await supabase
    .from("pos_sales")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/sale")
  return { success: true }
}
