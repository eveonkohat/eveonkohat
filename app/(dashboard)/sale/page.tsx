import type { Metadata } from "next"
import { getSessionContext } from "@/lib/data/session"
import { getBikeSales, getPosSales, getSellableBikes } from "@/lib/data/sales"
import { getAccounts } from "@/lib/data/accounts"
import { PageBanner } from "@/components/shared/page-banner"
import { SaleTables } from "@/components/sale/sale-tables"
import { BikeSaleDialog } from "@/components/sale/bike-sale-dialog"
import { PosSaleDialog } from "@/components/sale/pos-sale-dialog"

export const metadata: Metadata = { title: "Sale" }

export default async function SalePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const { tenant } = await getSessionContext()

  const [bikeSales, posSales, sellableBikes, accounts] = await Promise.all([
    getBikeSales(tenant.id, search),
    getPosSales(tenant.id, search),
    getSellableBikes(tenant.id),
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
            <BikeSaleDialog bikes={sellableBikes} accounts={accounts} />
            <PosSaleDialog accounts={accounts} />
          </>
        }
      />
      <SaleTables bikeSales={bikeSales} posSales={posSales} />
    </div>
  )
}
