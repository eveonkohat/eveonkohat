"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Menu, Sun, Moon, LogOut, Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/utils/format"
import { NAV_ITEMS } from "@/lib/constants/nav"
import { SidebarContent } from "./sidebar"
import { signOut } from "@/app/(auth)/login/actions"
import Link from "next/link"

const ROLE_LABELS: Record<string, string> = {
  "tenant-owner": "Owner",
  manager: "Manager",
  staff: "Staff",
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    const immediate = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(immediate)
      clearInterval(id)
    }
  }, [])

  return now
}

export function Header({
  displayName,
  email,
  role,
}: {
  displayName: string
  email: string
  role: string
}) {
  const pathname = usePathname()
  const now = useClock()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const activeItem = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  const time = now
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--:--"

  const date = now
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }).format(now)
    : ""

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&_svg]:text-current"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-full flex-col">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Management Workspace
          </p>
          <h1 className="truncate text-base font-semibold">
            {activeItem?.label ?? "Dashboard"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-3 rounded-lg border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <span className="font-mono font-medium tabular-nums text-foreground">{time}</span>
          <span className="text-border">|</span>
          <span>{date}</span>
        </div>

        <div className="hidden items-center gap-1 rounded-lg border p-1 sm:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-7", theme === "light" && "bg-accent text-accent-foreground")}
            onClick={() => setTheme("light")}
            aria-label="Light mode"
          >
            <Sun className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-7", theme === "dark" && "bg-accent text-accent-foreground")}
            onClick={() => setTheme("dark")}
            aria-label="Dark mode"
          >
            <Moon className="size-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 hover:bg-accent">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[11px] text-muted-foreground">Signed in as</span>
                <span className="block text-xs font-semibold">{displayName}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              <p className="mt-1 text-xs font-medium text-primary">
                {ROLE_LABELS[role] ?? role}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <SettingsIcon className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem
                variant="destructive"
                asChild
                onSelect={(e) => e.preventDefault()}
              >
                <button type="submit" className="flex w-full items-center gap-2">
                  <LogOut className="size-4" />
                  Log out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
