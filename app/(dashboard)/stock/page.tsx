import type { Metadata } from "next"
import { getSessionContext } from "@/lib/data/session"
import { getScooters, getOtherStockItems } from "@/lib/data/stock"
import { StockTables } from "@/components/stock/stock-tables"

export const metadata: Metadata = { title: "Stock" }

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; type?: string }>
}) {
  const { search, status = "all", type = "all" } = await searchParams
  const { tenant } = await getSessionContext()

  const [scooters, otherItems] = await Promise.all([
    getScooters(tenant.id, { search, status, vehicleType: type }),
    getOtherStockItems(tenant.id, search),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Stock</h1>
      <StockTables scooters={scooters} otherItems={otherItems} status={status} vehicleType={type} />
    </div>
  )
}
