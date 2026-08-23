import "server-only"
import { createClient } from "@/lib/supabase/server"

function monthRange(year: number, month?: number) {
  if (month === undefined) {
    return { start: `${year}-01-01`, end: `${year}-12-31` }
  }
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export async function getProfitAndLoss(tenantId: string, year: number, month?: number) {
  const supabase = await createClient()
  const { start, end } = monthRange(year, month)

  const [scooterSalesRes, posSalesRes, purchasesRes, otherPurchasesRes, expensesRes, otherIncomeRes, openingStockRes] =
    await Promise.all([
      supabase
        .from("scooter_sales")
        .select("total_amount")
        .eq("tenant_id", tenantId)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("pos_sales")
        .select("grand_total")
        .eq("tenant_id", tenantId)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("purchases")
        .select("total_amount")
        .eq("tenant_id", tenantId)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("other_items")
        .select("total_amount")
        .eq("tenant_id", tenantId)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("expenses")
        .select("amount, category")
        .eq("tenant_id", tenantId)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("account_transactions")
        .select("amount")
        .eq("tenant_id", tenantId)
        .eq("source_type", "other_income")
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("scooters")
        .select("purchase_price")
        .eq("tenant_id", tenantId)
        .eq("status", "in_stock")
        .lt("created_at", start),
    ])

  const salesRevenue =
    (scooterSalesRes.data ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0) +
    (posSalesRes.data ?? []).reduce((sum, s) => sum + Number(s.grand_total), 0)

  const otherIncome = (otherIncomeRes.data ?? []).reduce((sum, i) => sum + Number(i.amount), 0)
  const totalRevenue = salesRevenue + otherIncome

  const purchasesTotal =
    (purchasesRes.data ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0) +
    (otherPurchasesRes.data ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

  const openingStock = (openingStockRes.data ?? []).reduce((sum, b) => sum + Number(b.purchase_price), 0)

  const { data: closingStockScooters } = await supabase
    .from("scooters")
    .select("purchase_price")
    .eq("tenant_id", tenantId)
    .eq("status", "in_stock")
    .lte("created_at", end)
  const { data: closingStockOther } = await supabase
    .from("other_items")
    .select("unit_price, quantity_remaining")
    .eq("tenant_id", tenantId)
    .lte("date", end)

  const closingStock =
    (closingStockScooters ?? []).reduce((sum, b) => sum + Number(b.purchase_price), 0) +
    (closingStockOther ?? []).reduce((sum, i) => sum + Number(i.unit_price) * i.quantity_remaining, 0)

  const cogs = Math.max(openingStock + purchasesTotal - closingStock, 0)
  const grossProfit = totalRevenue - cogs

  const expenseCategoryTotals = new Map<string, number>()
  for (const e of expensesRes.data ?? []) {
    expenseCategoryTotals.set(e.category, (expenseCategoryTotals.get(e.category) ?? 0) + Number(e.amount))
  }
  const totalExpenses = [...expenseCategoryTotals.values()].reduce((sum, v) => sum + v, 0)

  const netProfit = grossProfit - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    salesRevenue,
    otherIncome,
    totalRevenue,
    openingStock,
    purchasesTotal,
    closingStock,
    cogs,
    grossProfit,
    expenseCategoryTotals: [...expenseCategoryTotals.entries()],
    totalExpenses,
    netProfit,
    profitMargin,
  }
}

export type ProfitAndLoss = Awaited<ReturnType<typeof getProfitAndLoss>>
