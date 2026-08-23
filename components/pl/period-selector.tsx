"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PrintButton } from "@/components/shared/print-button"
import { cn } from "@/lib/utils"

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function PeriodSelector({
  period,
  month,
  year,
}: {
  period: "monthly" | "yearly"
  month: number
  year: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const years = Array.from({ length: 5 }, (_, i) => year - 2 + i)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {(["monthly", "yearly"] as const).map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 px-3 text-xs capitalize",
              period === p && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
            onClick={() => setParam("period", p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {period === "monthly" ? (
        <Select value={String(month)} onValueChange={(v) => setParam("month", v)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select value={String(year)} onValueChange={(v) => setParam("year", v)}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <PrintButton />
    </div>
  )
}
