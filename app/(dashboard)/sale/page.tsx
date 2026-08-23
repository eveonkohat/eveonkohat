import type { Metadata } from "next"
import { getSessionContext } from "@/lib/data/session"
import { getScooterSales, getPosSales, getSellableScooters } from "@/lib/data/sales"
import { getAccounts } from "@/lib/data/accounts"
import { PageBanner } from "@/components/shared/page-banner"
import { SaleTables } from "@/components/sale/sale-tables"
import { ScooterSaleDialog } from "@/components/sale/scooter-sale-dialog"
import { PosSaleDialog } from "@/components/sale/pos-sale-dialog"

export const metadata: Metadata = { title: "Sale" }

export default async function SalePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const { tenant } = await getSessionContext()

  const [scooterSales, posSales, sellableScooters, accounts] = await Promise.all([
    getScooterSales(tenant.id, search),
    getPosSales(tenant.id, search),
    getSellableScooters(tenant.id),
    getAccounts(tenant.id),
  ])

  return (
    <div>
      <PageBanner
        eyebrow="Cash Sales"
        title="Sale Orders"
        description="View and manage every cash sale order."
        action={
          <>
            <ScooterSaleDialog scooters={sellableScooters} accounts={accounts} />
            <PosSaleDialog accounts={accounts} />
          </>
        }
      />
      <SaleTables scooterSales={scooterSales} posSales={posSales} />
    </div>
  )
}
