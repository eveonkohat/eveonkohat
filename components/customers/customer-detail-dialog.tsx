"use client"

import { useState } from "react"
import { Eye, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button"
import { AddPaymentDialog } from "./add-payment-dialog"
import { deleteScooterSalePayment } from "@/lib/actions/sales"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { Account, Scooter } from "@/types/database"
import type { CustomerSaleWithHistory } from "@/lib/data/customers"

export function CustomerDetailDialog({
  sale,
  accounts,
  canOverride,
}: {
  sale: CustomerSaleWithHistory
  accounts: Account[]
  canOverride: boolean
}) {
  const [open, setOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const scooter = sale.scooter as Scooter | undefined

  return (
    <>
      <Button variant="outline" size="icon" title="View details" onClick={() => setOpen(true)}>
        <Eye className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{sale.customer_name}</DialogTitle>
            <DialogDescription>Customer profile, sale details, and payment history.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Customer Details</p>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{sale.customer_phone || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">CNIC / ID</dt>
                    <dd className="font-medium">{sale.customer_cnic || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Sale Date</dt>
                    <dd className="font-medium">{formatDate(sale.date)}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Scooter Details</p>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Model</dt>
                    <dd className="font-medium">{scooter ? `${scooter.make} ${scooter.model}` : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Chassis No.</dt>
                    <dd className="font-medium">{scooter?.chassis_no || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Motor No.</dt>
                    <dd className="font-medium">{scooter?.engine_no || "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Price</p>
                <p className="text-lg font-bold">{formatCurrency(sale.total_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold text-success">{formatCurrency(sale.received_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(sale.balance)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={sale.payment_status} />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Payment History</p>
                {sale.balance > 0 ? (
                  <Button size="sm" onClick={() => setPaymentOpen(true)}>
                    <Wallet className="size-4" />
                    Add Payment
                  </Button>
                ) : null}
              </div>
              {sale.payments.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Remaining After</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.payment_date)}</TableCell>
                          <TableCell className="text-right font-semibold text-success">
                            {formatCurrency(p.amount)}
                          </TableCell>
                          <TableCell>{p.payment_method}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.notes || "—"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.remaining_after)}</TableCell>
                          <TableCell className="text-right">
                            <ConfirmDeleteButton
                              title="Delete this payment?"
                              description="Totals and outstanding balance will be recalculated."
                              action={deleteScooterSalePayment.bind(null, p.id)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddPaymentDialog
        saleId={sale.id}
        remainingBalance={Number(sale.balance)}
        accounts={accounts}
        canOverride={canOverride}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        trigger={null}
      />
    </>
  )
}
