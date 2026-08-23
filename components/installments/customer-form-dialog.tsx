"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createInstallmentCustomer } from "@/lib/actions/installments"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Save Customer
    </Button>
  )
}

export function CustomerFormDialog() {
  const [open, setOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createInstallmentCustomer(formData)
    if (!result.success) return { error: result.error }
    toast.success("Customer registered")
    setOpen(false)
    return {}
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus className="size-4" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>Registration, guarantor and contact details.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_name">Father / Husband Name</Label>
              <Input id="father_name" name="father_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnic">CNIC</Label>
              <Input id="cnic" name="cnic" placeholder="xxxxx-xxxxxxx-x" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_date">Registration Date</Label>
            <Input id="registration_date" name="registration_date" type="date" defaultValue={today} required />
          </div>

          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Guarantor</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="guarantor_name">Name</Label>
              <Input id="guarantor_name" name="guarantor_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guarantor_cnic">CNIC</Label>
              <Input id="guarantor_cnic" name="guarantor_cnic" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guarantor_phone">Phone</Label>
              <Input id="guarantor_phone" name="guarantor_phone" />
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
