import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  received: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  active: "bg-primary/15 text-primary",
  "in-stock": "bg-primary/15 text-primary",
  in_stock: "bg-primary/15 text-primary",
  partial: "bg-warning/20 text-warning-foreground",
  pending: "bg-muted text-muted-foreground",
  overdue: "bg-destructive/15 text-destructive",
  sold: "bg-destructive/10 text-destructive",
  returned: "bg-muted text-muted-foreground",
}

const STATUS_LABELS: Record<string, string> = {
  "in-stock": "In Stock",
  in_stock: "In Stock",
  received: "Fully Paid",
  partial: "Partially Paid",
  pending: "Unpaid",
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  const label = STATUS_LABELS[key] ?? status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        STATUS_STYLES[key] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  )
}
