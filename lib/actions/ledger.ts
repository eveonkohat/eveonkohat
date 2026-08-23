import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export async function postLedgerEntry(
  supabase: SupabaseClient<Database>,
  params: {
    tenantId: string
    accountId: string | null | undefined
    direction: "in" | "out"
    amount: number
    category: string
    description?: string
    sourceType: "sale" | "purchase" | "expense" | "installment_payment" | "transfer" | "other_income" | "manual"
    sourceId?: string
  }
) {
  if (!params.accountId || params.amount <= 0) return

  await supabase.rpc("post_ledger_entry", {
    p_tenant_id: params.tenantId,
    p_account_id: params.accountId,
    p_direction: params.direction,
    p_amount: params.amount,
    p_category: params.category,
    p_description: params.description ?? null,
    p_source_type: params.sourceType,
    p_source_id: params.sourceId ?? null,
  })
}
