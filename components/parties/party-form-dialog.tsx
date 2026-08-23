"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createParty, updateParty } from "@/lib/actions/parties"
import type { Party } from "@/types/database"

type FormState = { error?: string; success?: boolean }

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  )
}

export function PartyFormDialog({ party }: { party?: Party }) {
  const [open, setOpen] = useState(false)
  const isEdit = !!party

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = isEdit ? await updateParty(party!.id, formData) : await createParty(formData)
    if (!result.success) {
      return { error: result.error }
    }
    toast.success(isEdit ? "Party updated" : "Party account registered")
    setOpen(false)
    return { success: true }
  }, {})

  useEffect(() => {
    if (!open) return
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="icon">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Add Party Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Party Account" : "Add Party Account"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this supplier or party's details."
              : "Register a new supplier or party account."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Party / Company Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={party?.name}
                placeholder="Enter party or company name…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                name="contact_person"
                defaultValue={party?.contact_person ?? ""}
                placeholder="Name of point of contact…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={party?.phone ?? ""}
                placeholder="0300-1234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={party?.address ?? ""}
              placeholder="Full address…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening_balance">Opening Balance (PKR)</Label>
            <Input
              id="opening_balance"
              name="opening_balance"
              type="number"
              step="0.01"
              defaultValue={party?.opening_balance ?? 0}
            />
            <p className="text-xs text-muted-foreground">
              Positive = you owe them &nbsp;|&nbsp; Negative = they owe you
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={party?.notes ?? ""}
              placeholder="Any additional information…"
              rows={3}
            />
          </div>

          {state.error ? (
            <p className="text-sm font-medium text-destructive">{state.error}</p>
          ) : null}

          <DialogFooter>
            <SubmitButton label={isEdit ? "Save Changes" : "Register Party Account"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
