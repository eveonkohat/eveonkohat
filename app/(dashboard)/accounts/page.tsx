import type { Metadata } from "next"
import { getSessionContext } from "@/lib/data/session"
import { getAccounts, getRecentTransactions } from "@/lib/data/accounts"
import { PageHeader } from "@/components/shared/page-header"
import { AccountsTabs } from "@/components/accounts/accounts-tabs"

export const metadata: Metadata = { title: "Accounts" }

export default async function AccountsPage() {
  const { tenant } = await getSessionContext()
  const [accounts, transactions] = await Promise.all([
    getAccounts(tenant.id),
    getRecentTransactions(tenant.id),
  ])

  return (
    <div>
      <PageHeader title="Accounts & Cash Book" />
      <AccountsTabs accounts={accounts} transactions={transactions} />
    </div>
  )
}
