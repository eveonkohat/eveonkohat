"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Wallet, Plus, ArrowLeftRight, TrendingUp, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button"
import { createAccount, deleteAccount, transferFunds, recordOtherIncome } from "@/lib/actions/accounts"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { Account, AccountTransaction } from "@/types/database"

type FormState = { error?: string }

function SubmitButton({
  label,
  icon: Icon,
  className,
}: {
  label: string
  icon: React.ElementType
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className={className ?? "w-full sm:w-auto"}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {label}
    </Button>
  )
}

export function AccountsTabs({
  accounts,
  transactions,
}: {
  accounts: Account[]
  transactions: AccountTransaction[]
}) {
  const cashAccounts = accounts.filter((a) => a.type === "cash")
  const bankAccounts = accounts.filter((a) => a.type === "bank")
  const accountName = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? "—"

  return (
    <Tabs defaultValue="accounts">
      <TabsList>
        <TabsTrigger value="accounts">
          <Wallet className="size-4" />
          Accounts
        </TabsTrigger>
        <TabsTrigger value="create">
          <Plus className="size-4" />
          Create Account
        </TabsTrigger>
        <TabsTrigger value="transfer">
          <ArrowLeftRight className="size-4" />
          Transfer
        </TabsTrigger>
        <TabsTrigger value="income">
          <TrendingUp className="size-4" />
          Other Income
        </TabsTrigger>
      </TabsList>

      <TabsContent value="accounts" className="mt-4 space-y-6">
        <AccountGroup title="Cash Accounts" accounts={cashAccounts} />
        <AccountGroup title="Bank Accounts" accounts={bankAccounts} />

        <div>
          <h3 className="mb-3 text-sm font-semibold">All Transactions</h3>
          <Card className="overflow-hidden py-0">
            {transactions.length === 0 ? (
              <EmptyState title="No transactions yet" description="Cash movements will appear here as they happen." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell>{accountName(tx.account_id)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              tx.direction === "in"
                                ? "font-medium text-success"
                                : "font-medium text-destructive"
                            }
                          >
                            {tx.direction === "in" ? "Cash In" : "Cash Out"}
                          </span>
                        </TableCell>
                        <TableCell>{tx.category || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{tx.description || "—"}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            tx.direction === "in" ? "text-success" : "text-destructive"
                          }`}
                        >
                          {tx.direction === "in" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="create" className="mt-4">
        <Card>
          <CardContent className="pt-2">
            <CreateAccountForm />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transfer" className="mt-4">
        <Card>
          <CardContent className="pt-2">
            <TransferForm accounts={accounts} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="income" className="mt-4">
        <Card>
          <CardContent className="pt-2">
            <OtherIncomeForm accounts={accounts} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function AccountGroup({ title, accounts }: { title: string; accounts: Account[] }) {
  if (accounts.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Wallet className="size-4" />
        {title}
      </h3>
      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Opening Balance</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{account.address || "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(account.opening_balance)}</TableCell>
                  <TableCell className="text-right font-semibold text-success">
                    {formatCurrency(account.current_balance)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" disabled title="Edit account details from Create Account tab">
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmDeleteButton
                        title={`Delete ${account.name}?`}
                        description="This removes the account. Existing transactions referencing it will keep their history."
                        action={deleteAccount.bind(null, account.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

function CreateAccountForm() {
  const [type, setType] = useState<"cash" | "bank">("cash")
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createAccount(formData)
    if (!result.success) return { error: result.error }
    toast.success("Account created")
    return {}
  }, {})

  return (
    <form action={formAction} className="grid gap-5">
      <div className="space-y-2">
        <Label>Account Type</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["cash", "bank"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium capitalize transition-colors ${
                type === t ? "border-primary bg-primary/5 text-primary" : "hover:bg-accent"
              }`}
            >
              <span
                className={`size-2 rounded-full border ${type === t ? "border-primary bg-primary" : "border-muted-foreground"}`}
              />
              <Wallet className="size-4" />
              {t} Account
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name">Account Name</Label>
          <Input id="name" name="name" required placeholder="e.g. Main Cash Counter" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address (Optional)</Label>
          <Input id="address" name="address" placeholder="Office / location…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="opening_balance">Opening Balance (PKR)</Label>
          <Input id="opening_balance" name="opening_balance" type="number" step="0.01" defaultValue={0} />
        </div>
      </div>

      {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

      <SubmitButton label="Create Account" icon={Plus} />
    </form>
  )
}

function TransferForm({ accounts }: { accounts: Account[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await transferFunds(formData)
    if (!result.success) return { error: result.error }
    toast.success("Transfer recorded")
    return {}
  }, {})

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="from_account_id">From Account</Label>
          <Select name="from_account_id">
            <SelectTrigger id="from_account_id" className="w-full">
              <SelectValue placeholder="Select option" />
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
          <Label htmlFor="to_account_id">To Account</Label>
          <Select name="to_account_id">
            <SelectTrigger id="to_account_id" className="w-full">
              <SelectValue placeholder="Select option" />
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
          <Label htmlFor="amount">Amount (PKR)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" placeholder="Enter amount…" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note (Optional)</Label>
          <Input id="note" name="note" placeholder="e.g. cash deposit for supplier payment…" />
        </div>
      </div>

      {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

      <SubmitButton label="Record Transfer" icon={ArrowLeftRight} />
    </form>
  )
}

function OtherIncomeForm({ accounts }: { accounts: Account[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await recordOtherIncome(formData)
    if (!result.success) return { error: result.error }
    toast.success("Income recorded")
    return {}
  }, {})

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" placeholder="Type or select category…" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (PKR)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" placeholder="e.g. 50000" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">Income Detail</Label>
          <Input id="description" name="description" placeholder="Describe the income source…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_id">Transferred In (Account)</Label>
          <Select name="account_id">
            <SelectTrigger id="account_id" className="w-full">
              <SelectValue placeholder="Select option" />
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
      </div>

      {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

      <SubmitButton
        label="Record Income"
        icon={TrendingUp}
        className="w-full bg-success text-success-foreground hover:bg-success/90 sm:w-auto"
      />
    </form>
  )
}
