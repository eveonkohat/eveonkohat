import type { Metadata } from "next"
import { Bike, Wallet, CheckCircle2, AlertCircle, XCircle, Receipt } from "lucide-react"
import { getSessionContext } from "@/lib/data/session"
import { getCustomers, getCustomersDashboardStats, type CustomerStatusFilter } from "@/lib/data/customers"
import { getAccounts } from "@/lib/data/accounts"
import { PageBanner } from "@/components/shared/page-banner"
import { StatCard } from "@/components/dashboard/stat-card"
import { SearchInput } from "@/components/shared/search-input"
import { StatusFilter } from "@/components/customers/status-filter"
import { CustomersTable } from "@/components/customers/customers-table"
import { formatCurrency, formatNumber } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Customers" }

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: CustomerStatusFilter }>
}) {
  const { search, status } = await searchParams
  const { tenant, profile } = await getSessionContext()
  const canOverride = profile.role === "tenant-owner"

  const [stats, sales, accounts] = await Promise.all([
    getCustomersDashboardStats(tenant.id),
    getCustomers(tenant.id, { search, status }),
    getAccounts(tenant.id),
  ])

  return (
    <div>
      <PageBanner
        eyebrow="Customer & Payment Management"
        title="Customers"
        description="Every scooter sale, its customer, and its complete payment history in one place."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scooters Sold" value={formatNumber(stats.totalScootersSold)} icon={Bike} />
        <StatCard label="Total Sales" value={formatCurrency(stats.totalSales)} icon={Receipt} />
        <StatCard label="Total Received" value={formatCurrency(stats.totalReceived)} icon={CheckCircle2} tone="success" />
        <StatCard label="Total Outstanding" value={formatCurrency(stats.totalOutstanding)} icon={Wallet} tone="warning" />
        <StatCard label="Fully Paid Customers" value={formatNumber(stats.fullyPaidCount)} icon={CheckCircle2} tone="success" />
        <StatCard label="Customers With Debt" value={formatNumber(stats.partiallyPaidCount)} icon={AlertCircle} tone="warning" />
        <StatCard label="Unpaid Customers" value={formatNumber(stats.unpaidCount)} icon={XCircle} tone="destructive" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilter />
        <SearchInput placeholder="Search by customer, phone or scooter model…" className="max-w-sm" />
      </div>

      <CustomersTable sales={sales} accounts={accounts} canOverride={canOverride} />
    </div>
  )
}
