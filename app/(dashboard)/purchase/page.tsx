import type { Metadata } from "next"
import { getSessionContext } from "@/lib/data/session"
import { getPurchases, getOtherPurchases, getAvailableBikesForReturn } from "@/lib/data/purchases"
import { getParties } from "@/lib/data/parties"
import { getAccounts } from "@/lib/data/accounts"
import { PageBanner } from "@/components/shared/page-banner"
import { PurchaseTables } from "@/components/purchase/purchase-tables"
import { BikePurchaseDialog } from "@/components/purchase/bike-purchase-dialog"
import { OtherPurchaseDialog } from "@/components/purchase/other-purchase-dialog"
import { PurchaseReturnDialog } from "@/components/purchase/purchase-return-dialog"

export const metadata: Metadata = { title: "Purchase" }

export default async function PurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const { tenant } = await getSessionContext()

  const [bikePurchases, otherPurchases, parties, accounts, returnableBikes] = await Promise.all([
    getPurchases(tenant.id, search),
    getOtherPurchases(tenant.id, search),
    getParties(tenant.id),
    getAccounts(tenant.id),
    getAvailableBikesForReturn(tenant.id),
  ])

  return (
    <div>
      <PageBanner
        eyebrow="Stock Purchases"
        title="Purchase Orders"
        description="View and manage all stock acquisition records."
        action={
          <>
            <PurchaseReturnDialog bikes={returnableBikes} />
            <BikePurchaseDialog parties={parties} />
            <OtherPurchaseDialog parties={parties} accounts={accounts} />
          </>
        }
      />

      <PurchaseTables bikePurchases={bikePurchases} otherPurchases={otherPurchases} />
    </div>
  )
}
