"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateShowroomInfo } from "@/lib/actions/settings"
import { initials } from "@/lib/utils/format"
import type { Tenant } from "@/types/database"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      Save Changes
    </Button>
  )
}

export function ShowroomInfoForm({ tenant, canEdit }: { tenant: Tenant; canEdit: boolean }) {
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant.logo_url)

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await updateShowroomInfo(formData)
    if (!result.success) return { error: result.error }
    toast.success("Showroom information updated")
    return {}
  }, {})

  return (
    <form action={formAction} className="grid gap-6">
      <div className="flex flex-col items-center gap-4 rounded-lg border p-6 sm:flex-row">
        <Avatar className="size-20 rounded-2xl">
          <AvatarImage src={logoPreview ?? undefined} alt={tenant.name} />
          <AvatarFallback className="rounded-2xl bg-primary text-xl text-primary-foreground">
            {initials(tenant.name)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <p className="font-medium">Showroom Logo</p>
          <Input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/svg+xml"
            disabled={!canEdit}
            className="mt-2"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setLogoPreview(URL.createObjectURL(file))
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or SVG formats supported.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name">Showroom Name</Label>
          <Input id="name" name="name" defaultValue={tenant.name} disabled={!canEdit} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_name">Owner Name</Label>
          <Input
            id="owner_name"
            name="owner_name"
            defaultValue={tenant.owner_name ?? ""}
            disabled={!canEdit}
            placeholder="Owner full name…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} disabled={!canEdit} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={tenant.address ?? ""} disabled={!canEdit} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Plan Type</Label>
          <p className="text-lg font-semibold">{tenant.plan_type}</p>
        </div>
        <div className="space-y-2">
          <Label>Showroom Type</Label>
          <p className="text-lg font-semibold">{tenant.showroom_type ?? "—"}</p>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <p className="text-lg font-semibold text-success">{tenant.status}</p>
        </div>
      </div>

      {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

      {canEdit ? <SubmitButton /> : (
        <p className="text-sm text-muted-foreground">Only the showroom owner can edit this information.</p>
      )}
    </form>
  )
}
