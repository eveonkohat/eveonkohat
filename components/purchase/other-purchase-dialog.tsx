"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Package } from "lucide-react"
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
import { createOtherPurchase } from "@/lib/actions/purchases"
import { formatCurrency } from "@/lib/utils/format"
import type { Account, Party } from "@/types/database"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Save Other Purchase
    </Button>
  )
}

export function OtherPurchaseDialog({
  parties,
  accounts,
}: {
  parties: Party[]
  accounts: Account[]
}) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [paid, setPaid] = useState(0)

  const total = useMemo(() => quantity * unitPrice, [quantity, unitPrice])
  const balance = Math.max(total - paid, 0)
  const today = new Date().toISOString().slice(0, 10)

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createOtherPurchase(formData)
    if (!result.success) return { error: result.error }
    toast.success("Other purchase recorded")
    setOpen(false)
    setQuantity(1)
    setUnitPrice(0)
    setPaid(0)
    return {}
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Package className="size-4" />
          Other Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Other Purchase</DialogTitle>
          <DialogDescription>General items / POS purchase entry.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Purchase Date</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="party_id">Party / Supplier</Label>
              <Select name="party_id">
                <SelectTrigger id="party_id" className="w-full">
                  <SelectValue placeholder="Walk-in / Cash" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item_name">Item Name</Label>
            <Input id="item_name" name="item_name" required placeholder="e.g. Engine Oil, Spare Parts, Tools…" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price (PKR)</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <div className="flex h-9 items-center rounded-md bg-muted px-3 font-semibold text-success">
                {formatCurrency(total)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid_amount">Paid Amount (PKR)</Label>
              <Input
                id="paid_amount"
                name="paid_amount"
                type="number"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Balance</Label>
              <div className="flex h-9 items-center rounded-md bg-muted px-3 font-semibold">
                {formatCurrency(balance)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_account_id">Payment Account</Label>
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

          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Input id="description" name="description" placeholder="Optional notes…" />
          </div>

          {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
