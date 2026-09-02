"use client"

import { Users } from "lucide-react"
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
import { StatusBadge } from "@/components/shared/status-badge"
import { CustomerDetailDialog } from "./customer-detail-dialog"
import { AddPaymentDialog } from "./add-payment-dialog"
import { deleteScooterSale } from "@/lib/actions/sales"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { Account } from "@/types/database"
import type { CustomerSaleWithHistory } from "@/lib/data/customers"

export function CustomersTable({
  sales,
  accounts,
  canOverride,
}: {
  sales: CustomerSaleWithHistory[]
  accounts: Account[]
  canOverride: boolean
}) {
  return (
    <Card className="overflow-hidden py-0">
      {sales.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Scooter sales with customer details will show up here." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Scooter</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <p className="font-medium">{sale.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{sale.customer_cnic || "—"}</p>
                  </TableCell>
                  <TableCell>{sale.customer_phone || "—"}</TableCell>
                  <TableCell>{sale.scooter ? `${sale.scooter.make} ${sale.scooter.model}` : "—"}</TableCell>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(sale.total_amount)}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(sale.received_amount)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(sale.balance)}</TableCell>
                  <TableCell>
                    <StatusBadge status={sale.payment_status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <CustomerDetailDialog sale={sale} accounts={accounts} canOverride={canOverride} />
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
                        description="The scooter will be returned to available stock and all payment history removed."
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
  )
}
