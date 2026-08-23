"use server"

import { revalidatePath } from "next/cache"
import { requireTenant } from "./require-tenant"
import { accountSchema, transferSchema, otherIncomeSchema } from "@/lib/validations/accounts"
import { postLedgerEntry } from "./ledger"
import type { ActionResult } from "./require-tenant"

export async function createAccount(formData: FormData): Promise<ActionResult> {
  const parsed = accountSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    address: formData.get("address"),
    opening_balance: formData.get("opening_balance"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()

  const { error } = await supabase.from("accounts").insert({
    tenant_id: tenantId,
    ...parsed.data,
    current_balance: parsed.data.opening_balance,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/accounts")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/accounts")
  return { success: true }
}

export async function transferFunds(formData: FormData): Promise<ActionResult> {
  const parsed = transferSchema.safeParse({
    from_account_id: formData.get("from_account_id"),
    to_account_id: formData.get("to_account_id"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()

  const { error } = await supabase.rpc("transfer_between_accounts", {
    p_tenant_id: tenantId,
    p_from_account_id: parsed.data.from_account_id,
    p_to_account_id: parsed.data.to_account_id,
    p_amount: parsed.data.amount,
    p_note: parsed.data.note || null,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/accounts")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function recordOtherIncome(formData: FormData): Promise<ActionResult> {
  const parsed = otherIncomeSchema.safeParse({
    date: formData.get("date"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    account_id: formData.get("account_id"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()

  await postLedgerEntry(supabase, {
    tenantId,
    accountId: parsed.data.account_id,
    direction: "in",
    amount: parsed.data.amount,
    category: parsed.data.category,
    description: parsed.data.description,
    sourceType: "other_income",
  })

  revalidatePath("/accounts")
  revalidatePath("/dashboard")
  return { success: true }
}
