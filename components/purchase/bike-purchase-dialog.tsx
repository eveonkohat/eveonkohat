"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, ShoppingCart } from "lucide-react"
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
import { createBikePurchase } from "@/lib/actions/purchases"
import { formatCurrency } from "@/lib/utils/format"
import type { Party } from "@/types/database"

type FormState = { error?: string }

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  )
}

export function BikePurchaseDialog({ parties }: { parties: Party[] }) {
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState(0)
  const [tax, setTax] = useState(0)
  const [carriage, setCarriage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [partyId, setPartyId] = useState("")

  const total = useMemo(() => (price + tax + carriage) * quantity, [price, tax, carriage, quantity])
  const selectedParty = parties.find((p) => p.id === partyId)
  const today = new Date().toISOString().slice(0, 10)

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createBikePurchase(formData)
    if (!result.success) return { error: result.error }
    toast.success("Purchase added to stock")
    setOpen(false)
    setPrice(0)
    setTax(0)
    setCarriage(0)
    setQuantity(1)
    setPartyId("")
    return {}
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <ShoppingCart className="size-4" />
          Bike Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Purchase</DialogTitle>
          <DialogDescription>Record a new stock acquisition.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select name="vehicle_type" defaultValue="Electric">
                <SelectTrigger id="vehicle_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Company (Make)</Label>
              <Input id="make" name="make" required placeholder="e.g. Evee" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Bike Model</Label>
              <Input id="model" name="model" required placeholder="e.g. S1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" placeholder="e.g. Red" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" name="year" type="number" defaultValue={new Date().getFullYear()} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date of Purchase</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Acquisition Costing</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (Per Unit)</Label>
                <Input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_per_unit">Tax (Per Unit)</Label>
                <Input
                  id="tax_per_unit"
                  name="tax_per_unit"
                  type="number"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carriage_per_unit">Carriage (Per Unit)</Label>
                <Input
                  id="carriage_per_unit"
                  name="carriage_per_unit"
                  type="number"
                  step="0.01"
                  value={carriage}
                  onChange={(e) => setCarriage(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </Button>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    className="text-center"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => setQuantity((q) => q + 1)}>
                    +
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value="In-Stock" disabled />
              </div>
              <div className="space-y-2">
                <Label>Total Billing Amount</Label>
                <div className="flex h-9 items-center rounded-md bg-foreground px-3 font-mono font-semibold text-background">
                  {formatCurrency(total)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Source &amp; Identification</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="party_id">Purchase From</Label>
                <Select name="party_id" value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger id="party_id" className="w-full">
                    <SelectValue placeholder="Select Party" />
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
              <div className="space-y-2">
                <Label>Party Phone Number</Label>
                <Input value={selectedParty?.phone ?? ""} disabled placeholder="Auto-filled after party selection" />
              </div>
              <div className="space-y-2">
                <Label>Address / Location</Label>
                <Input value={selectedParty?.address ?? ""} disabled placeholder="Supplier address…" />
              </div>
            </div>
          </div>

          {quantity === 1 ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold">Engine &amp; Chassis Numbers</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chassis_no">Chassis No. (Unit 1)</Label>
                  <Input id="chassis_no" name="chassis_no" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine_no">Motor No. (Unit 1)</Label>
                  <Input id="engine_no" name="engine_no" />
                </div>
              </div>
            </div>
          ) : null}

          {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <SubmitButton label={`Add ${quantity} Unit${quantity > 1 ? "s" : ""} to Stock`} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
