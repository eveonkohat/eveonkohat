import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getAccounts(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })
  return data ?? []
}

export async function getRecentTransactions(tenantId: string, limit = 50) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("account_transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}
