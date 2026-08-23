import "server-only"
import { createClient } from "@/lib/supabase/server"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getDashboardData(tenantId: string) {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const weekStart = startOfWeek(now)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const [
    bikesRes,
    otherItemsRes,
    bikeSalesRes,
    posSalesRes,
    purchasesRes,
    purchaseOtherRes,
    accountsRes,
    expensesRes,
    installmentSalesRes,
    partiesRes,
  ] = await Promise.all([
    supabase
      .from("bikes")
      .select("id, model, make, status, purchase_price, created_at")
      .eq("tenant_id", tenantId),
    supabase
      .from("other_items")
      .select("id, item_name, quantity_remaining, unit_price")
      .eq("tenant_id", tenantId),
    supabase
      .from("bike_sales")
      .select("id, bike_id, total_amount, date")
      .eq("tenant_id", tenantId)
      .gte("date", yearStart.toISOString().slice(0, 10)),
    supabase
      .from("pos_sales")
      .select("id, grand_total, date")
      .eq("tenant_id", tenantId)
      .gte("date", yearStart.toISOString().slice(0, 10)),
    supabase
      .from("purchases")
      .select("id, total_amount, date")
      .eq("tenant_id", tenantId)
      .gte("date", monthStart.toISOString().slice(0, 10)),
    supabase
      .from("other_items")
      .select("id, total_amount, date")
      .eq("tenant_id", tenantId)
      .gte("date", monthStart.toISOString().slice(0, 10)),
    supabase.from("accounts").select("id, type, current_balance").eq("tenant_id", tenantId),
    supabase
      .from("expenses")
      .select("id, amount, date")
      .eq("tenant_id", tenantId)
      .gte("date", monthStart.toISOString().slice(0, 10)),
    supabase
      .from("installment_sales")
      .select("id, balance, status")
      .eq("tenant_id", tenantId),
    supabase.from("purchases").select("balance").eq("tenant_id", tenantId),
  ])

  const bikes = bikesRes.data ?? []
  const otherItems = otherItemsRes.data ?? []
  const bikeSales = bikeSalesRes.data ?? []
  const posSales = posSalesRes.data ?? []
  const accounts = accountsRes.data ?? []
  const installmentSales = installmentSalesRes.data ?? []
  const partiesPurchases = partiesRes.data ?? []

  const monthKey = (d: string) => d.slice(0, 7)
  const thisMonthKey = monthStart.toISOString().slice(0, 7)

  const salesThisMonth =
    bikeSales
      .filter((s) => monthKey(s.date) === thisMonthKey)
      .reduce((sum, s) => sum + Number(s.total_amount), 0) +
    posSales
      .filter((s) => monthKey(s.date) === thisMonthKey)
      .reduce((sum, s) => sum + Number(s.grand_total), 0)

  const purchaseThisMonth =
    (purchasesRes.data ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0) +
    (purchaseOtherRes.data ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

  const totalInventory = bikes.filter((b) => b.status === "in_stock").length
  const stockValue =
    bikes
      .filter((b) => b.status === "in_stock")
      .reduce((sum, b) => sum + Number(b.purchase_price), 0) +
    otherItems.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity_remaining, 0)

  const cashInHand = accounts
    .filter((a) => a.type === "cash")
    .reduce((sum, a) => sum + Number(a.current_balance), 0)

  const expenseThisMonth = (expensesRes.data ?? [])
    .filter((e) => monthKey(e.date) === thisMonthKey)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const totalReceivable = installmentSales
    .filter((s) => s.status !== "completed")
    .reduce((sum, s) => sum + Number(s.balance), 0)

  const totalPayable = partiesPurchases.reduce((sum, p) => sum + Number(p.balance), 0)

  // Weekly sales (current week, Mon-Sun)
  const salesWeekly = WEEKDAYS.map((day, i) => {
    const dayStart = new Date(weekStart)
    dayStart.setDate(dayStart.getDate() + i)
    const key = dayStart.toISOString().slice(0, 10)
    const amount =
      bikeSales.filter((s) => s.date === key).reduce((sum, s) => sum + Number(s.total_amount), 0) +
      posSales.filter((s) => s.date === key).reduce((sum, s) => sum + Number(s.grand_total), 0)
    return { label: day, value: amount }
  })

  // Monthly sales (this year)
  const salesMonthly = MONTHS.map((label, i) => {
    const key = `${now.getFullYear()}-${String(i + 1).padStart(2, "0")}`
    const amount =
      bikeSales.filter((s) => monthKey(s.date) === key).reduce((sum, s) => sum + Number(s.total_amount), 0) +
      posSales.filter((s) => monthKey(s.date) === key).reduce((sum, s) => sum + Number(s.grand_total), 0)
    return { label, value: amount }
  })

  const bikeCostById = new Map(bikes.map((b) => [b.id, Number(b.purchase_price)]))

  const profitOf = (s: { bike_id: string | null; total_amount: number }) => {
    const cost = s.bike_id ? (bikeCostById.get(s.bike_id) ?? 0) : 0
    return Number(s.total_amount) - cost
  }

  const profitWeekly = WEEKDAYS.map((day, i) => {
    const dayStart = new Date(weekStart)
    dayStart.setDate(dayStart.getDate() + i)
    const key = dayStart.toISOString().slice(0, 10)
    const value = bikeSales
      .filter((s) => s.date === key)
      .reduce((sum, s) => sum + profitOf(s), 0)
    return { label: day, value }
  })

  const profitMonthly = MONTHS.map((label, i) => {
    const key = `${now.getFullYear()}-${String(i + 1).padStart(2, "0")}`
    const value = bikeSales
      .filter((s) => monthKey(s.date) === key)
      .reduce((sum, s) => sum + profitOf(s), 0)
    return { label, value }
  })

  // Low stock: bikes grouped by model with <=2 units in_stock
  const stockByModel = new Map<string, number>()
  for (const b of bikes) {
    if (b.status !== "in_stock") continue
    const key = `${b.make} ${b.model}`
    stockByModel.set(key, (stockByModel.get(key) ?? 0) + 1)
  }
  const lowStock = Array.from(stockByModel.entries())
    .filter(([, count]) => count <= 2)
    .sort((a, b) => a[1] - b[1])
    .map(([model, count]) => ({ model, count }))

  // Top selling: bikes grouped by model, sold count
  const soldByModel = new Map<string, number>()
  for (const b of bikes) {
    if (b.status !== "sold") continue
    const key = `${b.make} ${b.model}`
    soldByModel.set(key, (soldByModel.get(key) ?? 0) + 1)
  }
  const topSelling = Array.from(soldByModel.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([model, count]) => ({ model, count }))

  return {
    kpis: {
      salesThisMonth,
      purchaseThisMonth,
      totalInventory,
      stockValue,
      cashInHand,
      expenseThisMonth,
      totalReceivable,
      totalPayable,
    },
    salesWeekly,
    salesMonthly,
    profitWeekly,
    profitMonthly,
    lowStock,
    topSelling,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
