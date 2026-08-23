import type { LucideIcon } from "lucide-react"
import {
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Star,
  Receipt,
  BookOpen,
  FileBadge,
  ReceiptText,
  Boxes,
  PackageCheck,
  PackageX,
  Clock,
  DollarSign,
  Users,
  UserCog,
  Landmark,
  FileWarning,
  AlertOctagon,
  Wallet,
  ArrowLeftRight,
  BadgeDollarSign,
  ClipboardList,
  Scale,
  CalendarRange,
} from "lucide-react"

export type ReportDef = {
  slug: string
  title: string
  icon: LucideIcon
  group: string
}

export const REPORT_GROUPS: { group: string; reports: ReportDef[] }[] = [
  {
    group: "Income",
    reports: [
      { slug: "sales-summary", title: "Sales Summary", icon: ShoppingCart, group: "Income" },
      { slug: "income-report", title: "Income Report", icon: TrendingUp, group: "Income" },
      { slug: "payment-collection", title: "Payment Collection", icon: CreditCard, group: "Income" },
      { slug: "top-selling-models", title: "Top Selling Models", icon: Star, group: "Income" },
    ],
  },
  {
    group: "Expense",
    reports: [
      { slug: "expense-report", title: "Expense Report", icon: Receipt, group: "Expense" },
      { slug: "expense-categories", title: "Expense Categories", icon: BookOpen, group: "Expense" },
      { slug: "tax-report", title: "Tax Report", icon: FileBadge, group: "Expense" },
      { slug: "purchase-tax", title: "Purchase Tax", icon: ReceiptText, group: "Expense" },
    ],
  },
  {
    group: "Stock",
    reports: [
      { slug: "stock-report", title: "Stock Report", icon: Boxes, group: "Stock" },
      { slug: "available-stock", title: "Available Stock", icon: PackageCheck, group: "Stock" },
      { slug: "sold-stock", title: "Sold Stock", icon: PackageX, group: "Stock" },
      { slug: "stock-aging", title: "Stock Aging", icon: Clock, group: "Stock" },
      { slug: "stock-valuation", title: "Stock Valuation", icon: DollarSign, group: "Stock" },
    ],
  },
  {
    group: "Party",
    reports: [
      { slug: "customer-ledger", title: "Customer Ledger", icon: Users, group: "Party" },
      { slug: "supplier-ledger", title: "Supplier Ledger", icon: UserCog, group: "Party" },
      { slug: "party-balances", title: "Party Balances", icon: Landmark, group: "Party" },
      { slug: "agent-commission", title: "Agent Commission", icon: BadgeDollarSign, group: "Party" },
    ],
  },
  {
    group: "Installment",
    reports: [
      { slug: "installment-status", title: "Installment Status", icon: ClipboardList, group: "Installment" },
      { slug: "overdue-recovery", title: "Overdue Recovery", icon: FileWarning, group: "Installment" },
    ],
  },
  {
    group: "Banking & Cash",
    reports: [
      { slug: "daily-cash-flow", title: "Daily Cash Flow", icon: Wallet, group: "Banking & Cash" },
      { slug: "bank-transactions", title: "Bank Transactions", icon: ArrowLeftRight, group: "Banking & Cash" },
    ],
  },
  {
    group: "Staff",
    reports: [{ slug: "staff-payroll", title: "Staff Payroll", icon: AlertOctagon, group: "Staff" }],
  },
  {
    group: "Management",
    reports: [
      { slug: "purchase-summary", title: "Purchase Summary", icon: ShoppingCart, group: "Management" },
      { slug: "profit-and-loss", title: "Profit & Loss", icon: Scale, group: "Management" },
      { slug: "monthly-summary", title: "Monthly Summary", icon: CalendarRange, group: "Management" },
    ],
  },
]

export const ALL_REPORTS = REPORT_GROUPS.flatMap((g) => g.reports)
