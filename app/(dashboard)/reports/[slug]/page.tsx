import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, FileQuestion } from "lucide-react"
import { getSessionContext } from "@/lib/data/session"
import { getReportData } from "@/lib/data/reports"
import { ALL_REPORTS } from "@/lib/constants/reports"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { PrintButton } from "@/components/shared/print-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const report = ALL_REPORTS.find((r) => r.slug === slug)
  return { title: report?.title ?? "Report" }
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const report = ALL_REPORTS.find((r) => r.slug === slug)
  if (!report) notFound()

  const { tenant } = await getSessionContext()
  const data = await getReportData(tenant.id, slug)

  if (data.kind === "redirect") {
    redirect(data.href)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/reports">
              <ArrowLeft className="size-4" />
              Reports Center
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{report.title}</h1>
        </div>
        {data.kind === "table" && data.rows.length > 0 ? <PrintButton /> : null}
      </div>

      <Card className="overflow-hidden py-0">
        {data.kind === "unavailable" ? (
          <EmptyState icon={FileQuestion} title="Report not available yet" description={data.reason} />
        ) : data.rows.length === 0 ? (
          <EmptyState title="No data yet" description="This report will populate once related activity is recorded." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {data.columns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
