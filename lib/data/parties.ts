import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getParties(tenantId: string, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("parties")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,contact_person.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`
    )
  }

  const { data } = await query
  return data ?? []
}
