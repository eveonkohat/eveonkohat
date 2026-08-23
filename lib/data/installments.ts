import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getInstallmentCustomers(tenantId: string, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("installment_customers")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,cnic.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data: customers } = await query
  if (!customers) return []

  const { data: sales } = await supabase
    .from("installment_sales")
    .select("customer_id, balance")
    .eq("tenant_id", tenantId)

  const balanceByCustomer = new Map<string, number>()
  const purchaseCountByCustomer = new Map<string, number>()
  for (const s of sales ?? []) {
    balanceByCustomer.set(s.customer_id, (balanceByCustomer.get(s.customer_id) ?? 0) + Number(s.balance))
    purchaseCountByCustomer.set(s.customer_id, (purchaseCountByCustomer.get(s.customer_id) ?? 0) + 1)
  }

  return customers.map((c) => ({
    ...c,
    balance_amount: balanceByCustomer.get(c.id) ?? 0,
    purchase_count: purchaseCountByCustomer.get(c.id) ?? 0,
  }))
}

export async function getInstallmentSales(tenantId: string, search?: string) {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from("installment_sales")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sale_date", { ascending: false })

  if (!sales || sales.length === 0) return []

  const customerIds = [...new Set(sales.map((s) => s.customer_id))]
  const { data: customers } = await supabase
    .from("installment_customers")
    .select("id, name, cnic, phone")
    .in("id", customerIds)
  const customerById = new Map((customers ?? []).map((c) => [c.id, c]))

  const enriched = sales.map((s) => ({ ...s, customer: customerById.get(s.customer_id) }))

  if (!search) return enriched

  const term = search.toLowerCase()
  return enriched.filter(
    (s) =>
      s.customer?.name.toLowerCase().includes(term) ||
      s.customer?.cnic?.toLowerCase().includes(term) ||
      s.customer?.phone?.toLowerCase().includes(term) ||
      s.item_description?.toLowerCase().includes(term)
  )
}

export async function getInstallmentTerms(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("installment_terms")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function getInstallmentDashboardStats(tenantId: string) {
  const supabase = await createClient()
  const [customersRes, salesRes] = await Promise.all([
    supabase.from("installment_customers").select("id").eq("tenant_id", tenantId),
    supabase.from("installment_sales").select("*").eq("tenant_id", tenantId),
  ])

  const sales = salesRes.data ?? []
  const totalPortfolio = sales.reduce((sum, s) => sum + Number(s.total_amount), 0)
  const totalCollected = sales.reduce((sum, s) => sum + Number(s.paid_amount), 0)
  const outstanding = sales.reduce((sum, s) => sum + Number(s.balance), 0)
  const overdue = sales.filter((s) => s.status === "overdue")
  const activeCount = sales.filter((s) => s.status === "active").length

  return {
    customerCount: customersRes.data?.length ?? 0,
    activeCount,
    totalPortfolio,
    totalCollected,
    collectedPct: totalPortfolio > 0 ? (totalCollected / totalPortfolio) * 100 : 0,
    outstanding,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, s) => sum + Number(s.balance), 0),
  }
}
