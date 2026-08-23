"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Scooter as ScooterIcon, Package, Layers } from "lucide-react"
import type { Scooter, OtherItem } from "@/types/database"

export function StockTables({
  scooters,
  otherItems,
  status,
  vehicleType,
}: {
  scooters: Scooter[]
  otherItems: OtherItem[]
  status: string
  vehicleType: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs defaultValue="scooters">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="scooters">
            <ScooterIcon className="size-4" />
            Scooters
            <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{scooters.length}</span>
          </TabsTrigger>
          <TabsTrigger value="other">
            <Package className="size-4" />
            Other Items
            <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{otherItems.length}</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="scooters" className="mt-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput placeholder="Search make, model, chassis, color…" className="flex-1" />
          <div className="flex gap-2">
            <Select defaultValue={vehicleType} onValueChange={(v) => setParam("type", v)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
                <SelectItem value="Petrol">Petrol</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={status} onValueChange={(v) => setParam("status", v)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm whitespace-nowrap">
            <Layers className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Qty</span>
            <span className="font-semibold">{scooters.length} Items</span>
          </div>
        </div>

        <Card className="overflow-hidden py-0">
          {scooters.length === 0 ? (
            <EmptyState
              icon={ScooterIcon}
              title="No scooters found"
              description="Scooters you purchase will appear here as stock."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scooter</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Chassis No.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Purchase Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scooters.map((scooter) => (
                    <TableRow key={scooter.id}>
                      <TableCell className="font-medium">{scooter.make}</TableCell>
                      <TableCell>
                        {scooter.model} {scooter.year ? `(${scooter.year})` : ""}
                      </TableCell>
                      <TableCell>{scooter.vehicle_type}</TableCell>
                      <TableCell>{scooter.color || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{scooter.chassis_no || "N/A"}</TableCell>
                      <TableCell>
                        <StatusBadge status={scooter.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(scooter.purchase_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </TabsContent>

      <TabsContent value="other" className="mt-4 space-y-4">
        <SearchInput placeholder="Search item name…" className="max-w-sm" />
        <Card className="overflow-hidden py-0">
          {otherItems.length === 0 ? (
            <EmptyState icon={Package} title="No other items in stock" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.quantity_remaining} pcs</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total_amount)}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(item.paid_amount)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(item.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  )
}
