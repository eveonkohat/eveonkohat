"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { recordScooterSalePayment } from "@/lib/actions/sales"
import { PAYMENT_METHODS } from "@/lib/validations/sales"
import { formatCurrency } from "@/lib/utils/format"
import type { Account } from "@/types/database"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Save Payment
    </Button>
  )
}

export function AddPaymentDialog({
  saleId,
  remainingBalance,
  accounts,
  canOverride,
  open,
  onOpenChange,
  trigger,
}: {
  saleId: string
  remainingBalance: number
  accounts: Account[]
  canOverride: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen
  const today = new Date().toISOString().slice(0, 10)

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await recordScooterSalePayment(formData)
    if (!result.success) return { error: result.error }
    toast.success("Payment recorded")
    setDialogOpen(false)
    return {}
  }, {})

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger !== undefined ? (
        trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="text-success hover:text-success" title="Add payment">
            <Wallet className="size-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Remaining balance: <span className="font-semibold text-destructive">{formatCurrency(remainingBalance)}</span>
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="scooter_sale_id" value={saleId} />

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (PKR)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={remainingBalance > 0 ? remainingBalance : undefined}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input id="payment_date" name="payment_date" type="date" defaultValue={today} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select name="payment_method" defaultValue="Cash">
              <SelectTrigger id="payment_method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_id">Received In (Optional)</Label>
            <Select name="account_id">
              <SelectTrigger id="account_id" className="w-full">
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
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input id="notes" name="notes" placeholder="e.g. Partial payment" />
          </div>

          {canOverride ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="allow_overpayment" value="on" />
              Allow this payment to exceed the total price
            </label>
          ) : null}

          {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
