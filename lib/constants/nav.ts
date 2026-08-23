import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Bike,
  ShoppingBasket,
  Repeat,
  Building2,
  CalendarClock,
  ShieldCheck,
  Receipt,
  Wallet,
  BarChart3,
  Scale,
  Settings,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Stock", href: "/stock", icon: Bike },
  { label: "Purchase", href: "/purchase", icon: ShoppingBasket },
  { label: "Sale", href: "/sale", icon: Repeat },
  { label: "Parties", href: "/parties", icon: Building2 },
  { label: "Installments", href: "/installments", icon: CalendarClock },
  { label: "Govt. Verification", href: "/govt-verification", icon: ShieldCheck },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "P & L", href: "/pl", icon: Scale },
  { label: "Settings", href: "/settings", icon: Settings },
]
