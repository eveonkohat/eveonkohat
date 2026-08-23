import type { Metadata } from "next"
import { getSessionContext } from "@/lib/data/session"
import { getExpenses } from "@/lib/data/expenses"
import { getAccounts } from "@/lib/data/accounts"
import { PageBanner } from "@/components/shared/page-banner"
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog"
import { ExpensesTable } from "@/components/expenses/expenses-table"

export const metadata: Metadata = { title: "Expenses" }

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; from?: string; to?: string }>
}) {
  const {
    search,
    from = startOfMonthISO(),
    to = new Date().toISOString().slice(0, 10),
  } = await searchParams
  const { tenant } = await getSessionContext()

  const [expenses, accounts] = await Promise.all([
    getExpenses(tenant.id, { search, from, to }),
    getAccounts(tenant.id),
  ])

  return (
    <div>
      <PageBanner
        eyebrow="Expense Management"
        title="Expenses"
        description="Track, review and print business expenses."
        action={<ExpenseFormDialog accounts={accounts} />}
      />
      <ExpensesTable expenses={expenses} from={from} to={to} />
    </div>
  )
}
