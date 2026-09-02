import type { Metadata } from "next"
import { Building2, Users, CreditCard, Trash2, KeyRound } from "lucide-react"
import { getSessionContext } from "@/lib/data/session"
import { getTeamMembers } from "@/lib/data/settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ShowroomInfoForm } from "@/components/settings/showroom-info-form"
import { UserManagementPanel } from "@/components/settings/user-management-panel"
import { ChangePasswordForm } from "@/components/settings/change-password-form"
import { SystemResetPanel } from "@/components/settings/system-reset-panel"
import { formatNumber } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const { tenant, profile, userId } = await getSessionContext()
  const members = await getTeamMembers(tenant.id)
  const isOwner = profile.role === "tenant-owner"

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>

      <Tabs defaultValue="showroom">
        <TabsList className="flex-wrap">
          <TabsTrigger value="showroom">
            <Building2 className="size-4" />
            Showroom Info
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="size-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="size-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="account">
            <KeyRound className="size-4" />
            Change Password
          </TabsTrigger>
          <TabsTrigger value="reset" className="data-[state=active]:bg-destructive data-[state=active]:text-white">
            <Trash2 className="size-4" />
            System Reset
          </TabsTrigger>
        </TabsList>

        <TabsContent value="showroom" className="mt-4">
          <Card>
            <CardContent className="pt-2">
              <ShowroomInfoForm tenant={tenant} canEdit={isOwner} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="pt-2">
              <UserManagementPanel members={members} currentUserId={userId} canManage={isOwner} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <Card>
            <CardContent className="pt-2">
              <h2 className="mb-4 text-lg font-bold">Subscription Details</h2>
              <dl className="divide-y">
                {[
                  ["Current Plan", tenant.plan_type],
                  ["Showroom Type", tenant.showroom_type ?? "—"],
                  ["Status", tenant.status],
                  ["Max Users", formatNumber(tenant.max_users)],
                  ["Max Vehicles", formatNumber(tenant.max_vehicles)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-3 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                To upgrade your plan, contact your platform administrator.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardContent className="pt-2">
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reset" className="mt-4">
          <SystemResetPanel canReset={isOwner} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
