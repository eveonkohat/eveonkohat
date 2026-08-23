"use client"

import { useTransition } from "react"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { factoryResetTenant } from "@/lib/actions/settings"

const CONSEQUENCES = [
  "All cash balances, bank accounts, and transactions will be permanently deleted.",
  "Your entire vehicle stock (inventory) will be completely cleared.",
  "All sales invoices, purchase invoices, and return records will be deleted.",
  "Customer ledgers, installment sales, and payment history will be wiped out.",
  "All party accounts and expense records will be deleted (except your administrator login).",
]

export function SystemResetPanel({ canReset }: { canReset: boolean }) {
  const [pending, startTransition] = useTransition()

  const handleReset = () => {
    startTransition(async () => {
      const result = await factoryResetTenant()
      if (result.success) {
        toast.success("Workspace reset to factory defaults")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Trash2 className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-destructive">Danger Zone: Factory Default Reset</h3>
          <p className="text-sm text-muted-foreground">Permanently erase all database records and start from scratch</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-card p-4">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4 text-warning-foreground" />
          What happens when you factory reset?
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {CONSEQUENCES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="mt-5 w-full" disabled={!canReset}>
            <Trash2 className="size-4" />
            Initiate Factory Reset
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes all stock, sales, purchases, parties, expenses, and installment
              data for this showroom. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Yes, reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
