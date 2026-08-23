import type { Metadata } from "next"
import { ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Govt. Verification" }

const PROVINCES = ["Punjab", "Sindh", "Islamabad", "KPK", "Balochistan"] as const

function searchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

export default function GovtVerificationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Government Verification Portals</h1>
      <p className="mt-1 text-sm font-medium text-primary">
        Verify bike registration, ownership, and check e-challans directly from official government sites.
      </p>

      <Tabs defaultValue="Punjab" className="mt-6">
        <TabsList className="flex-wrap">
          {PROVINCES.map((p) => (
            <TabsTrigger key={p} value={p}>
              {p}
            </TabsTrigger>
          ))}
        </TabsList>

        {PROVINCES.map((province) => (
          <TabsContent key={province} value={province} className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <CardTitle className="mt-2">Bike Verification</CardTitle>
                  <p className="text-sm text-muted-foreground">Excise &amp; Taxation Department, {province}</p>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Check online verification of the bike to confirm its make, model, chassis number,
                    engine number, and current owner details to prevent frauds.
                  </p>
                  <Button asChild className="w-full">
                    <a
                      href={searchUrl(`${province} excise and taxation department vehicle registration verification`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Excise Portal
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-5" />
                  </div>
                  <CardTitle className="mt-2">E-Challan Check</CardTitle>
                  <p className="text-sm text-muted-foreground">Traffic Police &amp; Safe City Authority</p>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Before purchasing or exchanging, make sure to check if there are any unpaid traffic
                    tickets or e-challans issued against the bike&apos;s registration number.
                  </p>
                  <Button asChild variant="destructive" className="w-full">
                    <a
                      href={searchUrl(`${province} traffic police e-challan check online`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Challan Portal
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
