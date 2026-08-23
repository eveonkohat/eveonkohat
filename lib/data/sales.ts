import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getBikeSales(tenantId: string, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("bike_sales")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_cnic.ilike.%${search}%,customer_phone.ilike.%${search}%`
    )
  }

  const { data: sales } = await query
  if (!sales || sales.length === 0) return []

  const bikeIds = [...new Set(sales.map((s) => s.bike_id).filter(Boolean))] as string[]
  const bikes = bikeIds.length
    ? (await supabase.from("bikes").select("id, make, model, chassis_no, engine_no").in("id", bikeIds)).data ?? []
    : []
  const bikeById = new Map(bikes.map((b) => [b.id, b]))

  return sales.map((s) => ({ ...s, bike: s.bike_id ? bikeById.get(s.bike_id) : undefined }))
}

export async function getPosSales(tenantId: string, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("pos_sales")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`)
  }

  const { data } = await query
  return data ?? []
}

export async function getSellableBikes(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("bikes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "in_stock")
    .order("created_at", { ascending: false })
  return data ?? []
}
