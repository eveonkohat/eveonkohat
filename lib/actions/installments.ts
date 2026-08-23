"use server"

import { revalidatePath } from "next/cache"
import { requireTenant } from "./require-tenant"
import { postLedgerEntry } from "./ledger"
import {
  installmentCustomerSchema,
  installmentSaleSchema,
  installmentPaymentSchema,
  installmentTermSchema,
} from "@/lib/validations/installments"
import type { ActionResult } from "./require-tenant"

function fd(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function createInstallmentCustomer(formData: FormData): Promise<ActionResult> {
  const parsed = installmentCustomerSchema.safeParse({
    name: fd(formData, "name"),
    father_name: fd(formData, "father_name"),
    cnic: fd(formData, "cnic"),
    phone: fd(formData, "phone"),
    address: fd(formData, "address"),
    guarantor_name: fd(formData, "guarantor_name"),
    guarantor_cnic: fd(formData, "guarantor_cnic"),
    guarantor_phone: fd(formData, "guarantor_phone"),
    registration_date: fd(formData, "registration_date"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const { error } = await supabase.from("installment_customers").insert({
    tenant_id: tenantId,
    ...parsed.data,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath("/installments")
  return { success: true }
}

export async function deleteInstallmentCustomer(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()
  const { error } = await supabase
    .from("installment_customers")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }
  revalidatePath("/installments")
  return { success: true }
}

export async function createInstallmentSale(formData: FormData): Promise<ActionResult> {
  const parsed = installmentSaleSchema.safeParse({
    customer_id: fd(formData, "customer_id"),
    scooter_id: fd(formData, "scooter_id"),
    item_description: fd(formData, "item_description"),
    sale_date: fd(formData, "sale_date"),
    total_amount: fd(formData, "total_amount"),
    down_payment: fd(formData, "down_payment"),
    term_months: fd(formData, "term_months"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const d = parsed.data
  const financedAmount = Math.max(d.total_amount - d.down_payment, 0)
  const perInstallment = d.term_months > 0 ? Math.round((financedAmount / d.term_months) * 100) / 100 : 0
  const paidAmount = d.down_payment
  const balance = Math.max(d.total_amount - paidAmount, 0)
  const status = balance === 0 ? "completed" : "active"

  let itemDescription = d.item_description ?? null
  if (d.scooter_id) {
    const { data: scooter } = await supabase
      .from("scooters")
      .select("make, model")
      .eq("id", d.scooter_id)
      .eq("tenant_id", tenantId)
      .single()
    if (scooter) itemDescription = `${scooter.make} ${scooter.model}`
  }

  const { error } = await supabase.from("installment_sales").insert({
    tenant_id: tenantId,
    customer_id: d.customer_id,
    scooter_id: d.scooter_id || null,
    item_description: itemDescription,
    sale_date: d.sale_date,
    total_amount: d.total_amount,
    down_payment: d.down_payment,
    term_months: d.term_months,
    per_installment: perInstallment,
    paid_amount: paidAmount,
    balance,
    status,
  })

  if (error) return { success: false, error: error.message }

  if (d.scooter_id) {
    await supabase
      .from("scooters")
      .update({ status: "sold", sold_price: d.total_amount })
      .eq("id", d.scooter_id)
      .eq("tenant_id", tenantId)
  }

  revalidatePath("/installments")
  revalidatePath("/stock")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteInstallmentSale(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()

  const { data: sale } = await supabase
    .from("installment_sales")
    .select("scooter_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single()

  const { error } = await supabase
    .from("installment_sales")
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

  revalidatePath("/installments")
  revalidatePath("/stock")
  return { success: true }
}

export async function recordInstallmentPayment(formData: FormData): Promise<ActionResult> {
  const parsed = installmentPaymentSchema.safeParse({
    installment_sale_id: fd(formData, "installment_sale_id"),
    amount: fd(formData, "amount"),
    payment_date: fd(formData, "payment_date"),
    account_id: fd(formData, "account_id"),
    notes: fd(formData, "notes"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const d = parsed.data

  const { data: sale } = await supabase
    .from("installment_sales")
    .select("id, customer_id, total_amount, paid_amount")
    .eq("id", d.installment_sale_id)
    .eq("tenant_id", tenantId)
    .single()

  if (!sale) return { success: false, error: "Installment plan not found" }

  const { error: paymentError } = await supabase.from("installment_payments").insert({
    tenant_id: tenantId,
    installment_sale_id: d.installment_sale_id,
    amount: d.amount,
    payment_date: d.payment_date,
    account_id: d.account_id || null,
    notes: d.notes || null,
  })

  if (paymentError) return { success: false, error: paymentError.message }

  const newPaid = Number(sale.paid_amount) + d.amount
  const newBalance = Math.max(Number(sale.total_amount) - newPaid, 0)

  await supabase
    .from("installment_sales")
    .update({
      paid_amount: newPaid,
      balance: newBalance,
      status: newBalance === 0 ? "completed" : "active",
    })
    .eq("id", d.installment_sale_id)
    .eq("tenant_id", tenantId)

  if (d.account_id) {
    await postLedgerEntry(supabase, {
      tenantId,
      accountId: d.account_id,
      direction: "in",
      amount: d.amount,
      category: "Installment Payment",
      description: "Installment payment received",
      sourceType: "installment_payment",
      sourceId: d.installment_sale_id,
    })
  }

  revalidatePath("/installments")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function createInstallmentTerm(formData: FormData): Promise<ActionResult> {
  const parsed = installmentTermSchema.safeParse({
    title: fd(formData, "title"),
    terms_text: fd(formData, "terms_text"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const { error } = await supabase.from("installment_terms").insert({
    tenant_id: tenantId,
    ...parsed.data,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath("/installments")
  return { success: true }
}

export async function deleteInstallmentTerm(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()
  const { error } = await supabase
    .from("installment_terms")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }
  revalidatePath("/installments")
  return { success: true }
}
