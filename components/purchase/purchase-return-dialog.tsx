"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Undo2 } from "lucide-react"
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
import { createPurchaseReturn } from "@/lib/actions/purchases"
import { formatCurrency } from "@/lib/utils/format"
import type { Scooter } from "@/types/database"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Post Purchase Return
    </Button>
  )
}

export function PurchaseReturnDialog({ scooters }: { scooters: Scooter[] }) {
  const [open, setOpen] = useState(false)
  const [scooterId, setScooterId] = useState("")
  const scooter = scooters.find((b) => b.id === scooterId)
  const today = new Date().toISOString().slice(0, 10)

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createPurchaseReturn(formData)
    if (!result.success) return { error: result.error }
    toast.success("Purchase return posted")
    setOpen(false)
    setScooterId("")
    return {}
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Undo2 className="size-4" />
          Purchase Return
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Purchase Return</DialogTitle>
          <DialogDescription>Return an unsold scooter to its supplier.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scooter_id">Select Scooter from Stock</Label>
              <Select name="scooter_id" value={scooterId} onValueChange={setScooterId}>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_date">Return Date</Label>
              <Input id="return_date" name="return_date" type="date" defaultValue={today} required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Make</Label>
              <Input value={scooter?.make ?? ""} disabled placeholder="Auto-filled" />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={scooter?.model ?? ""} disabled placeholder="Auto-filled" />
            </div>
            <div className="space-y-2">
              <Label>Chassis Number</Label>
              <Input value={scooter?.chassis_no ?? ""} disabled placeholder="Auto-filled" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Original Purchase Price</Label>
              <div className="flex h-9 items-center rounded-md bg-muted px-3 text-sm">
                {formatCurrency(scooter?.purchase_price ?? 0)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agreed_return_amount">Agreed Return Amount (PKR)</Label>
              <Input
                id="agreed_return_amount"
                name="agreed_return_amount"
                type="number"
                step="0.01"
                defaultValue={scooter?.purchase_price ?? 0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Reason for Return</Label>
            <Input id="notes" name="notes" placeholder="Any additional details…" />
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
