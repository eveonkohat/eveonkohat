import type { Metadata } from "next"
import { ShoppingCart, Scale, Receipt, TrendingUp } from "lucide-react"
import { getSessionContext } from "@/lib/data/session"
import { getProfitAndLoss } from "@/lib/data/profit-loss"
import { StatCard } from "@/components/dashboard/stat-card"
import { PeriodSelector } from "@/components/pl/period-selector"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/format"

export const metadata: Metadata = { title: "P & L" }

export default async function ProfitAndLossPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; month?: string; year?: string }>
}) {
  const now = new Date()
  const { period = "monthly", month = String(now.getMonth() + 1), year = String(now.getFullYear()) } =
    await searchParams
  const { tenant } = await getSessionContext()

  const monthNum = Number(month)
  const yearNum = Number(year)
  const pl = await getProfitAndLoss(tenant.id, yearNum, period === "monthly" ? monthNum : undefined)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profit &amp; Loss</h1>
        <PeriodSelector period={period === "yearly" ? "yearly" : "monthly"} month={monthNum} year={yearNum} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(pl.totalRevenue)} icon={ShoppingCart} tone="success" />
        <StatCard label="Cost of Goods Sold" value={formatCurrency(pl.cogs)} icon={Scale} tone="warning" />
        <StatCard label="Total Expenses" value={formatCurrency(pl.totalExpenses)} icon={Receipt} tone="destructive" />
        <StatCard
          label="Net Profit / Loss"
          value={formatCurrency(pl.netProfit)}
          icon={TrendingUp}
          tone={pl.netProfit >= 0 ? "success" : "destructive"}
        />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-6 pt-2">
          <h2 className="text-lg font-bold">P&amp;L Statement</h2>

          <Section title="Revenue">
            <Row label="Sales Revenue" value={pl.salesRevenue} />
            <Row label="Other Income" value={pl.otherIncome} />
            <Row label="Total Revenue" value={pl.totalRevenue} bold success />
          </Section>

          <Section title="Cost of Sales">
            <Row label="Opening Stock" value={pl.openingStock} />
            <Row label="Purchases" value={pl.purchasesTotal} />
            <Row label="Closing Stock" value={pl.closingStock} />
            <Row label="Cost of Goods Sold (COGS)" value={pl.cogs} bold destructive />
          </Section>

          <Row label="Gross Profit / Loss" value={pl.grossProfit} bold big success={pl.grossProfit >= 0} destructive={pl.grossProfit < 0} />

          <Section title="Expenses">
            {pl.expenseCategoryTotals.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No expenses recorded for this period.</p>
            ) : (
              pl.expenseCategoryTotals.map(([category, amount]) => (
                <Row key={category} label={category} value={amount} />
              ))
            )}
            <Row label="Total Expenses" value={pl.totalExpenses} bold destructive />
          </Section>

          <Row
            label="Net Profit / Loss"
            value={pl.netProfit}
            bold
            big
            success={pl.netProfit >= 0}
            destructive={pl.netProfit < 0}
          />

          <div className="rounded-lg bg-success/10 px-4 py-4 text-center">
            <p className="text-sm text-muted-foreground">Profit Margin</p>
            <p className="mt-1 text-2xl font-bold text-success">{pl.profitMargin.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 font-bold">{title}</h3>
      <div className="divide-y">{children}</div>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
  big,
  success,
  destructive,
}: {
  label: string
  value: number
  bold?: boolean
  big?: boolean
  success?: boolean
  destructive?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "font-bold" : ""} ${big ? "text-lg" : "text-sm"}`}>
      <span className={label.startsWith("Total") || label.startsWith("Net") || label.startsWith("Gross") ? "" : "pl-3 text-muted-foreground"}>
        {label}
      </span>
      <span className={success ? "text-success" : destructive ? "text-destructive" : ""}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
