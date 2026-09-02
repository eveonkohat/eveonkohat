"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, ShoppingCart } from "lucide-react"
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
import { createScooterSale } from "@/lib/actions/sales"
import { PAYMENT_METHODS } from "@/lib/validations/sales"
import { formatCurrency } from "@/lib/utils/format"
import type { Account, Scooter } from "@/types/database"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Save Sale
    </Button>
  )
}

export function ScooterSaleDialog({
  scooters,
  accounts,
  canOverride,
}: {
  scooters: Scooter[]
  accounts: Account[]
  canOverride: boolean
}) {
  const [open, setOpen] = useState(false)
  const [scooterId, setScooterId] = useState("")
  const [total, setTotal] = useState(0)
  const [received, setReceived] = useState(0)
  const scooter = scooters.find((b) => b.id === scooterId)
  const today = new Date().toISOString().slice(0, 10)
  const balance = Math.max(total - received, 0)

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createScooterSale(formData)
    if (!result.success) return { error: result.error }
    toast.success("Sale recorded")
    setOpen(false)
    setScooterId("")
    setTotal(0)
    setReceived(0)
    return {}
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ShoppingCart className="size-4" />
          Scooter Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Scooter Sale</DialogTitle>
          <DialogDescription>Sell a scooter from your current stock.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="scooter_id">Select Scooter</Label>
            <Select
              name="scooter_id"
              value={scooterId}
              onValueChange={(v) => {
                setScooterId(v)
                const selected = scooters.find((b) => b.id === v)
                if (selected) setTotal(Number(selected.purchase_price))
              }}
            >
              <SelectTrigger id="scooter_id" className="w-full">
                <SelectValue placeholder="Search available scooters…" />
              </SelectTrigger>
              <SelectContent>
                {scooters.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.make} {b.model} {b.color ? `— ${b.color}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {scooter ? (
              <p className="text-xs text-muted-foreground">
                Chassis: {scooter.chassis_no || "—"} · Motor: {scooter.engine_no || "—"}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input id="customer_name" name="customer_name" required placeholder="Customer name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone Number</Label>
              <Input id="customer_phone" name="customer_phone" placeholder="03xx-xxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_cnic">CNIC</Label>
              <Input id="customer_cnic" name="customer_cnic" placeholder="xxxxx-xxxxxxx-x" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="received_amount">Received Amount (PKR)</Label>
              <Input
                id="received_amount"
                name="received_amount"
                type="number"
                step="0.01"
                value={received}
                onChange={(e) => setReceived(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Balance</Label>
              <div className="flex h-9 items-center rounded-md bg-muted px-3 font-semibold text-destructive">
                {formatCurrency(balance)}
              </div>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input id="notes" name="notes" placeholder="Additional notes…" />
          </div>

          {received > total && total > 0 ? (
            canOverride ? (
              <label className="flex items-center gap-2 text-sm text-warning-foreground">
                <Checkbox name="allow_overpayment" value="on" />
                Received amount exceeds total price — allow this overpayment
              </label>
            ) : (
              <p className="text-sm font-medium text-destructive">
                Received amount cannot exceed the total price.
              </p>
            )
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
