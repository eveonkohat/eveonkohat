"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Package, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createPosSale } from "@/lib/actions/sales"
import { formatCurrency } from "@/lib/utils/format"
import type { Account, PosSaleItem } from "@/types/database"

type FormState = { error?: string }
type Row = PosSaleItem & { key: number }

let rowKey = 0
const emptyRow = (): Row => ({ key: rowKey++, description: "", qty: 1, uom: "Unit", rate: 0, amount: 0 })

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Save Invoice
    </Button>
  )
}

export function PosSaleDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([emptyRow()])
  const [received, setReceived] = useState(0)
  const today = new Date().toISOString().slice(0, 10)

  const grandTotal = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows])
  const balance = Math.max(grandTotal - received, 0)

  const updateRow = (key: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r
        const next = { ...r, ...patch }
        next.amount = next.qty * next.rate
        return next
      })
    )
  }

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    formData.set(
      "items",
      JSON.stringify(
        rows
          .filter((r) => r.description)
          .map((r) => ({ description: r.description, qty: r.qty, uom: r.uom, rate: r.rate, amount: r.amount }))
      )
    )
    formData.set("grand_total", String(grandTotal))
    const result = await createPosSale(formData)
    if (!result.success) return { error: result.error }
    toast.success("Invoice saved")
    setOpen(false)
    setRows([emptyRow()])
    setReceived(0)
    return {}
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Package className="size-4" />
          POS Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New POS Invoice</DialogTitle>
          <DialogDescription>Create a new sale invoice.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input id="customer_name" name="customer_name" defaultValue="Cash Customer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone Number</Label>
              <Input id="customer_phone" name="customer_phone" placeholder="Phone Number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Invoice Date</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Items</h3>
              <Button type="button" size="sm" variant="secondary" onClick={() => setRows((r) => [...r, emptyRow()])}>
                <Plus className="size-4" />
                Add Stock
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="p-2 text-left">Sr</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">UOM</th>
                    <th className="p-2 text-left">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.key} className="border-t">
                      <td className="p-2 text-muted-foreground">{idx + 1}</td>
                      <td className="p-2">
                        <Input
                          value={row.description}
                          onChange={(e) => updateRow(row.key, { description: e.target.value })}
                          placeholder="Search stock items…"
                          className="min-w-40"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          className="w-20"
                          value={row.qty}
                          onChange={(e) => updateRow(row.key, { qty: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="w-20"
                          value={row.uom}
                          onChange={(e) => updateRow(row.key, { uom: e.target.value })}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          className="w-24"
                          value={row.rate}
                          onChange={(e) => updateRow(row.key, { rate: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="p-2 text-right font-medium">{formatCurrency(row.amount)}</td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                          disabled={rows.length === 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms_and_conditions">Terms &amp; Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  name="terms_and_conditions"
                  rows={3}
                  defaultValue={"1. Goods once sold are not returnable.\n2. Warranty is valid as per manufacturer's policy."}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_notes">Invoice Notes (Optional)</Label>
                <Input id="invoice_notes" name="invoice_notes" placeholder="e.g. Spare parts sale…" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <span className="text-sm font-medium">Grand Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="received_amount">Received Amount</Label>
                <Input
                  id="received_amount"
                  name="received_amount"
                  type="number"
                  step="0.01"
                  value={received}
                  onChange={(e) => setReceived(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-success/10 px-4 py-3">
                <span className="text-sm font-medium">Balance</span>
                <span className="text-lg font-bold text-success">{formatCurrency(balance)}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_account_id">Payment Mode / Account</Label>
                <Select name="payment_account_id">
                  <SelectTrigger id="payment_account_id" className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
