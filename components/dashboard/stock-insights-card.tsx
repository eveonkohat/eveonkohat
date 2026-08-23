"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/empty-state"
import { AlertTriangle, Star, PackageSearch } from "lucide-react"

export function StockInsightsCard({
  lowStock,
  topSelling,
}: {
  lowStock: { model: string; count: number }[]
  topSelling: { model: string; count: number }[]
}) {
  return (
    <Card className="gap-4">
      <CardContent className="pt-2">
        <Tabs defaultValue="low-stock">
          <TabsList>
            <TabsTrigger value="low-stock">
              <AlertTriangle className="size-4" />
              Low Stock
            </TabsTrigger>
            <TabsTrigger value="top-selling">
              <Star className="size-4" />
              Top Selling
            </TabsTrigger>
          </TabsList>

          <TabsContent value="low-stock" className="mt-4">
            {lowStock.length === 0 ? (
              <EmptyState icon={PackageSearch} title="No low stock alerts" description="Every model has healthy stock levels." />
            ) : (
              <ul className="divide-y">
                {lowStock.map((item) => (
                  <li key={item.model} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium">{item.model}</span>
                    <span className="font-semibold text-warning-foreground">{item.count} left</span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="top-selling" className="mt-4">
            {topSelling.length === 0 ? (
              <EmptyState icon={PackageSearch} title="No sales yet" description="Top selling models will appear here once bikes are sold." />
            ) : (
              <ul className="divide-y">
                {topSelling.map((item) => (
                  <li key={item.model} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium">{item.model}</span>
                    <span className="font-semibold text-success">{item.count} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
