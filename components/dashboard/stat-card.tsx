import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: "primary" | "success" | "warning" | "destructive"
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "success" && "bg-success/15 text-success",
            tone === "warning" && "bg-warning/20 text-warning-foreground",
            tone === "destructive" && "bg-destructive/10 text-destructive"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
