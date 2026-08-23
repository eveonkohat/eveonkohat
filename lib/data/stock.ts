import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getBikes(
  tenantId: string,
  filters: { search?: string; status?: string; vehicleType?: string } = {}
) {
  const supabase = await createClient()
  let query = supabase
    .from("bikes")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (filters.search) {
    query = query.or(
      `make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,chassis_no.ilike.%${filters.search}%,color.ilike.%${filters.search}%`
    )
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as "in_stock" | "sold" | "returned")
  }
  if (filters.vehicleType && filters.vehicleType !== "all") {
    query = query.eq("vehicle_type", filters.vehicleType)
  }

  const { data } = await query
  return data ?? []
}

export async function getOtherStockItems(tenantId: string, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("other_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (search) {
    query = query.ilike("item_name", `%${search}%`)
  }

  const { data } = await query
  return data ?? []
}
