import Link from "next/link"
import { Zap, LogOut } from "lucide-react"
import { NavList } from "./nav-list"
import { signOut } from "@/app/(auth)/login/actions"

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <SidebarContent />
    </aside>
  )
}

export function SidebarContent() {
  return (
    <>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-5 py-5 text-lg font-bold tracking-tight text-sidebar-foreground"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="size-4" fill="currentColor" />
        </span>
        Zobly
      </Link>

      <NavList />

      <form action={signOut} className="border-t border-sidebar-border p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4.5" />
          Logout
        </button>
      </form>
    </>
  )
}
