"use server"

import { revalidatePath } from "next/cache"
import { requireTenant } from "./require-tenant"
import { postLedgerEntry } from "./ledger"
import { expenseSchema } from "@/lib/validations/expenses"
import type { ActionResult } from "./require-tenant"

export async function createExpense(formData: FormData): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse({
    category: formData.get("category"),
    sub_category: formData.get("sub_category"),
    date: formData.get("date"),
    payment_account_id: formData.get("payment_account_id") || undefined,
    amount: formData.get("amount"),
    description: formData.get("description"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()
  const d = parsed.data

  const { error } = await supabase.from("expenses").insert({
    tenant_id: tenantId,
    category: d.category,
    sub_category: d.sub_category || null,
    date: d.date,
    payment_account_id: d.payment_account_id || null,
    amount: d.amount,
    description: d.description || null,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (d.payment_account_id) {
    await postLedgerEntry(supabase, {
      tenantId,
      accountId: d.payment_account_id,
      direction: "out",
      amount: d.amount,
      category: d.category,
      description: d.description || d.sub_category,
      sourceType: "expense",
    })
  }

  revalidatePath("/expenses")
  revalidatePath("/dashboard")
  revalidatePath("/pl")
  return { success: true }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/expenses")
  revalidatePath("/dashboard")
  return { success: true }
}
