"use client"

import { useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format"

type Point = { label: string; value: number }

export function AnalyticsCard({
  title,
  weekly,
  monthly,
  color = "var(--color-chart-1)",
}: {
  title: string
  weekly: Point[]
  monthly: Point[]
  color?: string
}) {
  const [range, setRange] = useState<"weekly" | "monthly">("weekly")
  const data = range === "weekly" ? weekly : monthly

  return (
    <Card className="gap-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {(["weekly", "monthly"] as const).map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-3 text-xs capitalize",
                range === r && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={range === "weekly" ? "30%" : "20%"}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
