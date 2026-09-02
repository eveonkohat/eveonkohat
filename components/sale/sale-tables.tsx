"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { AddPaymentDialog } from "@/components/customers/add-payment-dialog"
import { deleteScooterSale, deletePosSale } from "@/lib/actions/sales"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { ShoppingCart, Package } from "lucide-react"
import type { Account, Scooter, ScooterSale, PosSale } from "@/types/database"

type ScooterSaleWithScooter = ScooterSale & { scooter?: Pick<Scooter, "id" | "make" | "model" | "chassis_no" | "engine_no"> }

export function SaleTables({
  scooterSales,
  posSales,
  accounts,
  canOverride,
}: {
  scooterSales: ScooterSaleWithScooter[]
  posSales: PosSale[]
  accounts: Account[]
  canOverride: boolean
}) {
  return (
    <Tabs defaultValue="scooter">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="scooter">
            <ShoppingCart className="size-4" />
            Scooter Sale
            <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{scooterSales.length}</span>
          </TabsTrigger>
          <TabsTrigger value="pos">
            <Package className="size-4" />
            POS Sale
            <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{posSales.length}</span>
          </TabsTrigger>
        </TabsList>
        <SearchInput placeholder="Search customer, CNIC, phone or item…" className="max-w-sm" />
      </div>

      <TabsContent value="scooter" className="mt-4">
        <Card className="overflow-hidden py-0">
          {scooterSales.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No scooter sales yet" description="Sold scooters will show up here." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer Detail</TableHead>
                    <TableHead>Item Detail</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scooterSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {formatDate(sale.date)}
                        <p className="font-mono text-xs text-muted-foreground">#{sale.order_code}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{sale.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.customer_cnic} · {sale.customer_phone}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {sale.scooter ? `${sale.scooter.make} ${sale.scooter.model}` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Chassis: {sale.scooter?.chassis_no || "—"} · Motor: {sale.scooter?.engine_no || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(sale.total_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.received_amount)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(sale.balance)}</TableCell>
                      <TableCell>
                        <StatusBadge status={sale.payment_status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {sale.balance > 0 ? (
                            <AddPaymentDialog
                              saleId={sale.id}
                              remainingBalance={Number(sale.balance)}
                              accounts={accounts}
                              canOverride={canOverride}
                            />
                          ) : null}
                          <ConfirmDeleteButton
                            title="Delete this sale?"
                            description="The scooter will be returned to available stock."
                            action={deleteScooterSale.bind(null, sale.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </TabsContent>

      <TabsContent value="pos" className="mt-4">
        <Card className="overflow-hidden py-0">
          {posSales.length === 0 ? (
            <EmptyState icon={Package} title="No POS sale records found" description="Create a POS invoice to see it listed here." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer Detail</TableHead>
                    <TableHead>Item Detail</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {formatDate(sale.date)}
                        <p className="font-mono text-xs text-muted-foreground">#{sale.order_code}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{sale.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{sale.customer_phone}</p>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        {sale.items.map((i) => i.description).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(sale.grand_total)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.received_amount)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(sale.balance)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <ConfirmDeleteButton
                            title="Delete this invoice?"
                            action={deletePosSale.bind(null, sale.id)}
                          />
                        </div>
                      </TableCell>
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
