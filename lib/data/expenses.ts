import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getExpenses(
  tenantId: string,
  filters: { search?: string; from?: string; to?: string } = {}
) {
  const supabase = await createClient()
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })

  if (filters.search) {
    query = query.or(`category.ilike.%${filters.search}%,sub_category.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  if (filters.from) query = query.gte("date", filters.from)
  if (filters.to) query = query.lte("date", filters.to)

  const { data: expenses } = await query
  if (!expenses || expenses.length === 0) return []

  const accountIds = [...new Set(expenses.map((e) => e.payment_account_id).filter(Boolean))] as string[]
  const accounts = accountIds.length
    ? (await supabase.from("accounts").select("id, name").in("id", accountIds)).data ?? []
    : []
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]))

  return expenses.map((e) => ({
    ...e,
    account_name: e.payment_account_id ? (accountNameById.get(e.payment_account_id) ?? "—") : "—",
  }))
}
