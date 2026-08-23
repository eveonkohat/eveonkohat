import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getScooterSales(tenantId: string, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("scooter_sales")
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

  const scooterIds = [...new Set(sales.map((s) => s.scooter_id).filter(Boolean))] as string[]
  const scooters = scooterIds.length
    ? (await supabase.from("scooters").select("id, make, model, chassis_no, engine_no").in("id", scooterIds)).data ?? []
    : []
  const scooterById = new Map(scooters.map((b) => [b.id, b]))

  return sales.map((s) => ({ ...s, scooter: s.scooter_id ? scooterById.get(s.scooter_id) : undefined }))
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

export async function getSellableScooters(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("scooters")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "in_stock")
    .order("created_at", { ascending: false })
  return data ?? []
}
