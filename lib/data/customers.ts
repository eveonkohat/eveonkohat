import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { ScooterSalePayment } from "@/types/database"

export type CustomerStatusFilter = "all" | "received" | "partial" | "pending" | "outstanding"

export type PaymentHistoryEntry = ScooterSalePayment & { remaining_after: number }

export async function getCustomers(tenantId: string, opts?: { search?: string; status?: CustomerStatusFilter }) {
  const supabase = await createClient()
  const status = opts?.status ?? "all"

  let query = supabase
    .from("scooter_sales")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })

  if (status === "outstanding") {
    query = query.gt("balance", 0)
  } else if (status !== "all") {
    query = query.eq("payment_status", status)
  }

  const { data: sales } = await query
  if (!sales || sales.length === 0) return []

  const scooterIds = [...new Set(sales.map((s) => s.scooter_id).filter(Boolean))] as string[]
  const scooters = scooterIds.length
    ? (await supabase.from("scooters").select("id, make, model, color, chassis_no, engine_no").in("id", scooterIds)).data ?? []
    : []
  const scooterById = new Map(scooters.map((b) => [b.id, b]))

  const saleIds = sales.map((s) => s.id)
  const { data: allPayments } = await supabase
    .from("scooter_sale_payments")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("scooter_sale_id", saleIds)
    .order("payment_date", { ascending: true })
    .order("created_at", { ascending: true })

  const paymentsBySale = new Map<string, ScooterSalePayment[]>()
  for (const p of allPayments ?? []) {
    const list = paymentsBySale.get(p.scooter_sale_id) ?? []
    list.push(p)
    paymentsBySale.set(p.scooter_sale_id, list)
  }

  let rows = sales.map((s) => {
    let runningTotal = 0
    const payments: PaymentHistoryEntry[] = (paymentsBySale.get(s.id) ?? []).map((p) => {
      runningTotal += Number(p.amount)
      return { ...p, remaining_after: Math.max(Number(s.total_amount) - runningTotal, 0) }
    })
    return { ...s, scooter: s.scooter_id ? scooterById.get(s.scooter_id) : undefined, payments }
  })

  const search = opts?.search?.trim().toLowerCase()
  if (search) {
    rows = rows.filter((r) => {
      const scooterLabel = r.scooter ? `${r.scooter.make} ${r.scooter.model}`.toLowerCase() : ""
      return (
        r.customer_name.toLowerCase().includes(search) ||
        r.customer_cnic?.toLowerCase().includes(search) ||
        r.customer_phone?.toLowerCase().includes(search) ||
        scooterLabel.includes(search)
      )
    })
  }

  return rows
}

export type CustomerSaleWithHistory = Awaited<ReturnType<typeof getCustomers>>[number]

export async function getCustomersDashboardStats(tenantId: string) {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from("scooter_sales")
    .select("total_amount, received_amount, balance, payment_status")
    .eq("tenant_id", tenantId)

  const rows = sales ?? []

  return {
    totalScootersSold: rows.length,
    totalSales: rows.reduce((sum, s) => sum + Number(s.total_amount), 0),
    totalReceived: rows.reduce((sum, s) => sum + Number(s.received_amount), 0),
    totalOutstanding: rows.reduce((sum, s) => sum + Number(s.balance), 0),
    fullyPaidCount: rows.filter((s) => s.payment_status === "received").length,
    partiallyPaidCount: rows.filter((s) => s.payment_status === "partial").length,
    unpaidCount: rows.filter((s) => s.payment_status === "pending").length,
  }
}
