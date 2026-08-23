import type { Metadata } from "next"
import { getSessionContext } from "@/lib/data/session"
import {
  getInstallmentCustomers,
  getInstallmentSales,
  getInstallmentTerms,
  getInstallmentDashboardStats,
} from "@/lib/data/installments"
import { getAccounts } from "@/lib/data/accounts"
import { getSellableScooters } from "@/lib/data/sales"
import { PageHeader } from "@/components/shared/page-header"
import { InstallmentsTabs } from "@/components/installments/installments-tabs"

export const metadata: Metadata = { title: "Installments" }

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const { tenant } = await getSessionContext()

  const [stats, customers, sales, terms, accounts, scooters] = await Promise.all([
    getInstallmentDashboardStats(tenant.id),
    getInstallmentCustomers(tenant.id, search),
    getInstallmentSales(tenant.id, search),
    getInstallmentTerms(tenant.id),
    getAccounts(tenant.id),
    getSellableScooters(tenant.id),
  ])

  return (
    <div>
      <p className="mb-1 text-xs font-semibold tracking-wide text-primary uppercase">
        Premium SaaS Feature
      </p>
      <PageHeader title="Installment Management System" />
      <InstallmentsTabs
        stats={stats}
        customers={customers}
        sales={sales}
        terms={terms}
        accounts={accounts}
        scooters={scooters}
      />
    </div>
  )
}
