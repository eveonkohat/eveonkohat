"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { createInstallmentSale } from "@/lib/actions/installments"
import { formatCurrency } from "@/lib/utils/format"
import type { Scooter, InstallmentCustomer } from "@/types/database"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Save Installment Sale
    </Button>
  )
}

export function InstallmentSaleDialog({
  customers,
  scooters,
}: {
  customers: InstallmentCustomer[]
  scooters: Scooter[]
}) {
  const [open, setOpen] = useState(false)
  const [total, setTotal] = useState(0)
  const [down, setDown] = useState(0)
  const [months, setMonths] = useState(12)
  const today = new Date().toISOString().slice(0, 10)

  const perInstallment = useMemo(() => {
    const financed = Math.max(total - down, 0)
    return months > 0 ? Math.round((financed / months) * 100) / 100 : 0
  }, [total, down, months])

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createInstallmentSale(formData)
    if (!result.success) return { error: result.error }
    toast.success("Installment sale created")
    setOpen(false)
    setTotal(0)
    setDown(0)
    setMonths(12)
    return {}
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Installment Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Installment Sale</DialogTitle>
          <DialogDescription>Create a new installment plan for a customer.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customer_id">Customer</Label>
              <Select name="customer_id">
                <SelectTrigger id="customer_id" className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.customer_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="scooter_id">Scooter (Optional)</Label>
              <Select name="scooter_id">
                <SelectTrigger id="scooter_id" className="w-full">
                  <SelectValue placeholder="Select a scooter from stock" />
                </SelectTrigger>
                <SelectContent>
                  {scooters.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.make} {b.model} {b.color ? `— ${b.color}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item_description">Item Description (if no scooter selected)</Label>
              <Input id="item_description" name="item_description" placeholder="e.g. Evee S1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_date">Sale Date</Label>
              <Input id="sale_date" name="sale_date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term_months">Term (Months)</Label>
              <Input
                id="term_months"
                name="term_months"
                type="number"
                min={1}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount (PKR)</Label>
              <Input
                id="total_amount"
                name="total_amount"
                type="number"
                step="0.01"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="down_payment">Down Payment (PKR)</Label>
              <Input
                id="down_payment"
                name="down_payment"
                type="number"
                step="0.01"
                value={down}
                onChange={(e) => setDown(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
            <span className="text-sm font-medium">Per Installment</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(perInstallment)}/mo</span>
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
