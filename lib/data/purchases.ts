import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getPurchases(tenantId: string, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("purchases")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })

  if (search) {
    query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%`)
  }

  const { data: purchases } = await query
  if (!purchases || purchases.length === 0) return []

  const partyIds = [...new Set(purchases.map((p) => p.party_id).filter(Boolean))] as string[]
  const parties = partyIds.length
    ? (await supabase.from("parties").select("id, name").in("id", partyIds)).data ?? []
    : []
  const partyNameById = new Map(parties.map((p) => [p.id, p.name]))

  return purchases.map((p) => ({
    ...p,
    party_name: p.party_id ? (partyNameById.get(p.party_id) ?? "Unknown") : "Walk-in / Cash",
  }))
}

export async function getOtherPurchases(tenantId: string, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("other_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })

  if (search) {
    query = query.ilike("item_name", `%${search}%`)
  }

  const { data: items } = await query
  if (!items || items.length === 0) return []

  const partyIds = [...new Set(items.map((p) => p.party_id).filter(Boolean))] as string[]
  const parties = partyIds.length
    ? (await supabase.from("parties").select("id, name").in("id", partyIds)).data ?? []
    : []
  const partyNameById = new Map(parties.map((p) => [p.id, p.name]))

  return items.map((i) => ({
    ...i,
    party_name: i.party_id ? (partyNameById.get(i.party_id) ?? "Unknown") : "Walk-in / Cash",
  }))
}

export async function getAvailableScootersForReturn(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("scooters")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "in_stock")
    .order("created_at", { ascending: false })
  return data ?? []
}
