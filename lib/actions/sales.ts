"use server"

import { revalidatePath } from "next/cache"
import { requireTenant } from "./require-tenant"
import { postLedgerEntry } from "./ledger"
import { scooterSaleSchema, scooterSalePaymentSchema, posSaleSchema } from "@/lib/validations/sales"
import type { ActionResult } from "./require-tenant"
import type { PosSaleItem } from "@/types/database"

function computePaymentStatus(totalAmount: number, paidAmount: number): "received" | "partial" | "pending" {
  if (paidAmount <= 0) return "pending"
  return paidAmount >= totalAmount ? "received" : "partial"
}

export async function createScooterSale(formData: FormData): Promise<ActionResult> {
  const parsed = scooterSaleSchema.safeParse({
    scooter_id: formData.get("scooter_id"),
    customer_name: formData.get("customer_name"),
    customer_cnic: formData.get("customer_cnic"),
    customer_phone: formData.get("customer_phone"),
    date: formData.get("date"),
    total_amount: formData.get("total_amount"),
    received_amount: formData.get("received_amount"),
    payment_method: formData.get("payment_method") || "Cash",
    payment_account_id: formData.get("payment_account_id") || undefined,
    notes: formData.get("notes"),
    allow_overpayment: formData.get("allow_overpayment") === "on",
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId, role } = await requireTenant()
  const d = parsed.data

  if (d.received_amount > d.total_amount && !(d.allow_overpayment && role === "tenant-owner")) {
    return { success: false, error: "Received amount cannot exceed the total price. Ask the showroom owner to allow overpayment if this is intentional." }
  }

  const balance = Math.max(d.total_amount - d.received_amount, 0)
  const paymentStatus = computePaymentStatus(d.total_amount, d.received_amount)

  const { data: scooter } = await supabase
    .from("scooters")
    .select("status")
    .eq("id", d.scooter_id)
    .eq("tenant_id", tenantId)
    .single()

  if (!scooter || scooter.status !== "in_stock") {
    return { success: false, error: "This scooter is no longer available for sale" }
  }

  const { data: sale, error } = await supabase
    .from("scooter_sales")
    .insert({
      tenant_id: tenantId,
      scooter_id: d.scooter_id,
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
    .from("scooters")
    .update({ status: "sold", sold_price: d.total_amount })
    .eq("id", d.scooter_id)
    .eq("tenant_id", tenantId)

  if (d.received_amount > 0) {
    await supabase.from("scooter_sale_payments").insert({
      tenant_id: tenantId,
      scooter_sale_id: sale.id,
      payment_date: d.date,
      amount: d.received_amount,
      payment_method: d.payment_method,
      account_id: d.payment_account_id || null,
      notes: "Initial payment at sale",
    })
  }

  if (d.received_amount > 0 && d.payment_account_id) {
    await postLedgerEntry(supabase, {
      tenantId,
      accountId: d.payment_account_id,
      direction: "in",
      amount: d.received_amount,
      category: "Scooter Sale",
      description: `Sale to ${d.customer_name}`,
      sourceType: "sale",
      sourceId: sale.id,
    })
  }

  revalidatePath("/sale")
  revalidatePath("/customers")
  revalidatePath("/stock")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function recordScooterSalePayment(formData: FormData): Promise<ActionResult> {
  const parsed = scooterSalePaymentSchema.safeParse({
    scooter_sale_id: formData.get("scooter_sale_id"),
    amount: formData.get("amount"),
    payment_date: formData.get("payment_date"),
    payment_method: formData.get("payment_method") || "Cash",
    account_id: formData.get("account_id") || undefined,
    notes: formData.get("notes"),
    allow_overpayment: formData.get("allow_overpayment") === "on",
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId, role } = await requireTenant()
  const d = parsed.data

  const { data: sale } = await supabase
    .from("scooter_sales")
    .select("id, total_amount, received_amount, customer_name")
    .eq("id", d.scooter_sale_id)
    .eq("tenant_id", tenantId)
    .single()

  if (!sale) return { success: false, error: "Sale not found" }

  const newPaid = Number(sale.received_amount) + d.amount

  if (newPaid > Number(sale.total_amount) && !(d.allow_overpayment && role === "tenant-owner")) {
    return { success: false, error: "This payment would exceed the total price. Ask the showroom owner to allow overpayment if this is intentional." }
  }

  const { error: paymentError } = await supabase.from("scooter_sale_payments").insert({
    tenant_id: tenantId,
    scooter_sale_id: d.scooter_sale_id,
    payment_date: d.payment_date,
    amount: d.amount,
    payment_method: d.payment_method,
    account_id: d.account_id || null,
    notes: d.notes || null,
  })

  if (paymentError) return { success: false, error: paymentError.message }

  const newBalance = Math.max(Number(sale.total_amount) - newPaid, 0)

  await supabase
    .from("scooter_sales")
    .update({
      received_amount: newPaid,
      balance: newBalance,
      payment_status: computePaymentStatus(Number(sale.total_amount), newPaid),
    })
    .eq("id", d.scooter_sale_id)
    .eq("tenant_id", tenantId)

  if (d.account_id) {
    await postLedgerEntry(supabase, {
      tenantId,
      accountId: d.account_id,
      direction: "in",
      amount: d.amount,
      category: "Scooter Sale Payment",
      description: `Payment from ${sale.customer_name}`,
      sourceType: "sale",
      sourceId: d.scooter_sale_id,
    })
  }

  revalidatePath("/sale")
  revalidatePath("/customers")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteScooterSalePayment(paymentId: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()

  const { data: payment } = await supabase
    .from("scooter_sale_payments")
    .select("scooter_sale_id, amount")
    .eq("id", paymentId)
    .eq("tenant_id", tenantId)
    .single()

  if (!payment) return { success: false, error: "Payment not found" }

  const { error: deleteError } = await supabase
    .from("scooter_sale_payments")
    .delete()
    .eq("id", paymentId)
    .eq("tenant_id", tenantId)

  if (deleteError) return { success: false, error: deleteError.message }

  const { data: sale } = await supabase
    .from("scooter_sales")
    .select("total_amount")
    .eq("id", payment.scooter_sale_id)
    .eq("tenant_id", tenantId)
    .single()

  if (sale) {
    const { data: remaining } = await supabase
      .from("scooter_sale_payments")
      .select("amount")
      .eq("scooter_sale_id", payment.scooter_sale_id)
      .eq("tenant_id", tenantId)

    const newPaid = (remaining ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
    const newBalance = Math.max(Number(sale.total_amount) - newPaid, 0)

    await supabase
      .from("scooter_sales")
      .update({
        received_amount: newPaid,
        balance: newBalance,
        payment_status: computePaymentStatus(Number(sale.total_amount), newPaid),
      })
      .eq("id", payment.scooter_sale_id)
      .eq("tenant_id", tenantId)
  }

  revalidatePath("/sale")
  revalidatePath("/customers")
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

export async function deleteScooterSale(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()

  const { data: sale } = await supabase
    .from("scooter_sales")
    .select("scooter_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single()

  const { error } = await supabase
    .from("scooter_sales")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }

  if (sale?.scooter_id) {
    await supabase
      .from("scooters")
      .update({ status: "in_stock", sold_price: null })
      .eq("id", sale.scooter_id)
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
