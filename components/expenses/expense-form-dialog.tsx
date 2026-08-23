"use client"

import { useActionState, useState } from "react"
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
import { createExpense } from "@/lib/actions/expenses"
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_NAMES } from "@/lib/constants/expenses"
import type { Account } from "@/types/database"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" disabled={pending} className="w-full">
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Pay Expense Amount
    </Button>
  )
}

export function ExpenseFormDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState("")
  const today = new Date().toISOString().slice(0, 10)
  const subCategories = category ? EXPENSE_CATEGORIES[category] ?? [] : []

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createExpense(formData)
    if (!result.success) return { error: result.error }
    toast.success("Expense recorded")
    setOpen(false)
    setCategory("")
    return {}
  }, {})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-primary hover:bg-white/90">
          <Plus className="size-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Track, review and print business expenses.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Expense Category</Label>
              <Select name="category" value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORY_NAMES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_category">Sub-Category</Label>
              <Select name="sub_category" disabled={!category}>
                <SelectTrigger id="sub_category" className="w-full">
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" placeholder="e.g. 5000" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description / Details</Label>
            <Input id="description" name="description" placeholder="e.g. Monthly electricity bill paid…" />
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
