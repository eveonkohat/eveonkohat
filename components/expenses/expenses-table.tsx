"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button"
import { SearchInput } from "@/components/shared/search-input"
import { PrintButton } from "@/components/shared/print-button"
import { deleteExpense } from "@/lib/actions/expenses"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Receipt } from "lucide-react"
import type { Expense } from "@/types/database"

type ExpenseWithAccount = Expense & { account_name: string }

export function ExpensesTable({
  expenses,
  from,
  to,
}: {
  expenses: ExpenseWithAccount[]
  from: string
  to: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput placeholder="Search by category, account or description…" className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setParam("from", e.target.value)} className="w-auto" />
          <Input type="date" value={to} onChange={(e) => setParam("to", e.target.value)} className="w-auto" />
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Selected Total</span>
            <span className="font-semibold text-destructive">{formatCurrency(total)}</span>
          </div>
          <PrintButton />
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        {expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses found" description="Expenses recorded in this range will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub-Category</TableHead>
                  <TableHead>Payment Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell className="font-medium">{e.category}</TableCell>
                    <TableCell>{e.sub_category || "—"}</TableCell>
                    <TableCell>{e.account_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{e.description || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {formatCurrency(e.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <ConfirmDeleteButton
                          title="Delete this expense?"
                          action={deleteExpense.bind(null, e.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
