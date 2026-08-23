import type { Metadata } from "next"
import Link from "next/link"
import { REPORT_GROUPS } from "@/lib/constants/reports"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = { title: "Reports" }

export default function ReportsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Reports Center</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_GROUPS.map(({ group, reports }) => (
          <Card key={group} className="gap-3">
            <CardContent className="pt-2">
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group}
              </p>
              <div className="space-y-1.5">
                {reports.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/reports/${r.slug}`}
                    className="flex items-center gap-2.5 rounded-lg border p-3 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <r.icon className="size-4 shrink-0 text-primary" />
                    {r.title}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
