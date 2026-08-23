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
import { RecordDetailsDialog } from "@/components/shared/record-details-dialog"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { deleteOtherPurchase, deletePurchase } from "@/lib/actions/purchases"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { ShoppingBasket, Package } from "lucide-react"
import type { OtherItem, Purchase } from "@/types/database"

type PurchaseWithParty = Purchase & { party_name: string }
type OtherItemWithParty = OtherItem & { party_name: string }

export function PurchaseTables({
  bikePurchases,
  otherPurchases,
}: {
  bikePurchases: PurchaseWithParty[]
  otherPurchases: OtherItemWithParty[]
}) {
  return (
    <Tabs defaultValue="bike">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="bike">
            <ShoppingBasket className="size-4" />
            Bike Purchase
            <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{bikePurchases.length}</span>
          </TabsTrigger>
          <TabsTrigger value="other">
            <Package className="size-4" />
            Other Purchase
            <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{otherPurchases.length}</span>
          </TabsTrigger>
        </TabsList>
        <SearchInput placeholder="Search by supplier, make, model, chassis…" className="max-w-sm" />
      </div>

      <TabsContent value="bike" className="mt-4">
        <Card className="overflow-hidden py-0">
          {bikePurchases.length === 0 ? (
            <EmptyState
              icon={ShoppingBasket}
              title="No bike purchases yet"
              description="Add a bike purchase to bring stock into your inventory."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Bike</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty Purchased</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Invoice Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bikePurchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.date)}</TableCell>
                      <TableCell>{p.party_name}</TableCell>
                      <TableCell className="font-medium">{p.make}</TableCell>
                      <TableCell>{p.model}</TableCell>
                      <TableCell>{p.vehicle_type}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {p.quantity} Units
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">Ledger</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(p.total_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <RecordDetailsDialog
                            title={`${p.make} ${p.model} — Purchase Order`}
                            rows={[
                              { label: "Order Code", value: p.order_code },
                              { label: "Date", value: formatDate(p.date) },
                              { label: "Supplier", value: p.party_name },
                              { label: "Vehicle Type", value: p.vehicle_type },
                              { label: "Color", value: p.color ?? "—" },
                              { label: "Quantity", value: `${p.quantity} unit(s)` },
                              { label: "Purchase Price / Unit", value: formatCurrency(p.purchase_price) },
                              { label: "Tax / Unit", value: formatCurrency(p.tax_per_unit) },
                              { label: "Carriage / Unit", value: formatCurrency(p.carriage_per_unit) },
                              { label: "Total Amount", value: formatCurrency(p.total_amount) },
                            ]}
                          />
                          <ConfirmDeleteButton
                            title="Delete this purchase record?"
                            description="This removes the purchase order. Bike units already created stay in stock."
                            action={deletePurchase.bind(null, p.id)}
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

      <TabsContent value="other" className="mt-4">
        <Card className="overflow-hidden py-0">
          {otherPurchases.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No other purchases yet"
              description="Record spare parts, tools, or general purchases here."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherPurchases.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.party_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total_amount)}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(item.paid_amount)}</TableCell>
                      <TableCell className="text-right text-destructive">
                        {formatCurrency(item.balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={item.balance > 0 ? "partial" : "paid"} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <ConfirmDeleteButton
                            title="Delete this purchase?"
                            description={`This removes ${item.item_name} from purchase history.`}
                            action={deleteOtherPurchase.bind(null, item.id)}
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
