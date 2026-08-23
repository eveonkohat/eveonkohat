import type { Metadata } from "next"
import {
  TrendingUp,
  ShoppingCart,
  Layers,
  Scooter,
  Wallet,
  Receipt,
  BarChart3,
  Users,
} from "lucide-react"
import { getSessionContext } from "@/lib/data/session"
import { getDashboardData } from "@/lib/data/dashboard"
import { StatCard } from "@/components/dashboard/stat-card"
import { AnalyticsCard } from "@/components/dashboard/analytics-card"
import { StockInsightsCard } from "@/components/dashboard/stock-insights-card"
import { formatCurrency, formatNumber } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const { tenant } = await getSessionContext()
  const data = await getDashboardData(tenant.id)
  const { kpis } = data

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        {tenant.name} Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sales (This Month)"
          value={formatCurrency(kpis.salesThisMonth)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Purchase (This Month)"
          value={formatCurrency(kpis.purchaseThisMonth)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Total Inventory"
          value={`${formatNumber(kpis.totalInventory)} Items`}
          icon={Layers}
        />
        <StatCard
          label="Stock Value"
          value={formatCurrency(kpis.stockValue)}
          icon={Scooter}
        />
        <StatCard
          label="Cash in Hand"
          value={formatCurrency(kpis.cashInHand)}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Expense (This Month)"
          value={formatCurrency(kpis.expenseThisMonth)}
          icon={Receipt}
          tone="destructive"
        />
        <StatCard
          label="Total Receivable (Installments)"
          value={formatCurrency(kpis.totalReceivable)}
          icon={BarChart3}
        />
        <StatCard
          label="Total Payable"
          value={formatCurrency(kpis.totalPayable)}
          icon={Users}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard
          title="Sales Analytics"
          weekly={data.salesWeekly}
          monthly={data.salesMonthly}
          color="var(--color-chart-1)"
        />
        <AnalyticsCard
          title="Profit Analytics"
          weekly={data.profitWeekly}
          monthly={data.profitMonthly}
          color="var(--color-chart-4)"
        />
      </div>

      <div className="mt-4">
        <StockInsightsCard lowStock={data.lowStock} topSelling={data.topSelling} />
      </div>
    </div>
  )
}
