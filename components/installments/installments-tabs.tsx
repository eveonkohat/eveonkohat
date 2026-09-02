"use client"

import { LayoutDashboard, Users, FileSignature, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
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
import { StatusBadge } from "@/components/shared/status-badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { CustomerFormDialog } from "./customer-form-dialog"
import { InstallmentSaleDialog } from "./installment-sale-dialog"
import { RecordPaymentDialog } from "./record-payment-dialog"
import { TermsPanel } from "./terms-panel"
import { deleteInstallmentCustomer, deleteInstallmentSale } from "@/lib/actions/installments"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Users as UsersIcon, Wallet, CheckCircle2, AlertCircle } from "lucide-react"
import type { Account, Scooter, InstallmentCustomer, InstallmentSale, InstallmentTerm } from "@/types/database"

type CustomerWithBalance = InstallmentCustomer & { balance_amount: number; purchase_count: number }
type SaleWithCustomer = InstallmentSale & {
  customer?: { id: string; name: string; cnic: string | null; phone: string | null }
}

export function InstallmentsTabs({
  stats,
  customers,
  sales,
  terms,
  accounts,
  scooters,
  canOverride,
}: {
  stats: {
    customerCount: number
    totalPortfolio: number
    totalCollected: number
    collectedPct: number
    outstanding: number
    overdueCount: number
  }
  customers: CustomerWithBalance[]
  sales: SaleWithCustomer[]
  terms: InstallmentTerm[]
  accounts: Account[]
  scooters: Scooter[]
  canOverride: boolean
}) {
  return (
    <Tabs defaultValue="dashboard">
      <TabsList>
        <TabsTrigger value="dashboard">
          <LayoutDashboard className="size-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="customers">
          <Users className="size-4" />
          Customers
        </TabsTrigger>
        <TabsTrigger value="sale-order">
          <FileSignature className="size-4" />
          Sale Order
        </TabsTrigger>
        <TabsTrigger value="terms">
          <FileText className="size-4" />
          Terms
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="mt-4 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Customers" value={String(stats.customerCount)} icon={UsersIcon} />
          <StatCard label="Total Portfolio" value={formatCurrency(stats.totalPortfolio)} icon={Wallet} />
          <StatCard
            label="Total Collected"
            value={formatCurrency(stats.totalCollected)}
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(stats.outstanding)}
            icon={Wallet}
            tone="warning"
          />
          <StatCard
            label="Overdue"
            value={`${stats.overdueCount} Accounts`}
            icon={AlertCircle}
            tone="destructive"
          />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Installment Purchases</h3>
          <SalesTable sales={sales} accounts={accounts} showActions="payment" canOverride={canOverride} />
        </div>
      </TabsContent>

      <TabsContent value="customers" className="mt-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Search by name, ID, CNIC or contact…" className="max-w-md" />
          <CustomerFormDialog />
        </div>
        <Card className="overflow-hidden py-0">
          {customers.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No customers registered" description="Add a customer to start an installment plan." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>CNIC</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead className="text-right">Balance Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">S/O {c.father_name || "—"}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.customer_code}</TableCell>
                      <TableCell>{c.cnic || "—"}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell>{formatDate(c.registration_date)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(c.balance_amount)}
                        <p className="text-xs font-normal text-muted-foreground">
                          {c.purchase_count} purchase(s)
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <ConfirmDeleteButton
                            title={`Delete ${c.name}?`}
                            description="This removes the customer record. Linked installment sales must be removed first."
                            action={deleteInstallmentCustomer.bind(null, c.id)}
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
      </TabsContent>

      <TabsContent value="sale-order" className="mt-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Search customer, CNIC, phone, item…" className="max-w-md" />
          <InstallmentSaleDialog customers={customers} scooters={scooters} />
        </div>
        <SalesTable sales={sales} accounts={accounts} showActions="delete" canOverride={canOverride} />
      </TabsContent>

      <TabsContent value="terms" className="mt-4">
        <TermsPanel terms={terms} />
      </TabsContent>
    </Tabs>
  )
}

function SalesTable({
  sales,
  accounts,
  showActions,
  canOverride,
}: {
  sales: SaleWithCustomer[]
  accounts: Account[]
  showActions: "payment" | "delete"
  canOverride: boolean
}) {
  return (
    <Card className="overflow-hidden py-0">
      {sales.length === 0 ? (
        <EmptyState icon={FileSignature} title="No installment sales yet" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer &amp; Vehicle</TableHead>
                <TableHead className="text-right">Plan Value</TableHead>
                <TableHead className="text-right">Per Installment</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <p className="font-medium">{sale.customer?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{sale.item_description || "—"}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(sale.total_amount)}
                    <p className="text-xs font-normal text-muted-foreground">{sale.term_months} months</p>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.per_installment)}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(sale.paid_amount)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(sale.balance)}</TableCell>
                  <TableCell>
                    <StatusBadge status={sale.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {showActions === "payment" && sale.status !== "completed" ? (
                        <RecordPaymentDialog
                          saleId={sale.id}
                          perInstallment={Number(sale.per_installment)}
                          accounts={accounts}
                          canOverride={canOverride}
                        />
                      ) : null}
                      {showActions === "delete" ? (
                        <ConfirmDeleteButton
                          title="Delete this installment sale?"
                          description="Any linked scooter will be returned to available stock."
                          action={deleteInstallmentSale.bind(null, sale.id)}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}
