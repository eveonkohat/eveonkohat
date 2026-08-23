import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getTeamMembers(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })
  return data ?? []
}
