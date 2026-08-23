"use server"

import { revalidatePath } from "next/cache"
import { requireTenant } from "./require-tenant"
import { showroomInfoSchema } from "@/lib/validations/settings"
import type { ActionResult } from "./require-tenant"

export async function updateShowroomInfo(formData: FormData): Promise<ActionResult> {
  const parsed = showroomInfoSchema.safeParse({
    name: formData.get("name"),
    owner_name: formData.get("owner_name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId, role } = await requireTenant()

  if (role !== "tenant-owner") {
    return { success: false, error: "Only the showroom owner can update this information" }
  }

  const logoFile = formData.get("logo")
  let logoUrl: string | undefined

  if (logoFile instanceof File && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop() || "png"
    const path = `${tenantId}/logo.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type })

    if (uploadError) {
      return { success: false, error: `Logo upload failed: ${uploadError.message}` }
    }

    const { data: publicUrl } = supabase.storage.from("logos").getPublicUrl(path)
    logoUrl = `${publicUrl.publicUrl}?v=${Date.now()}`
  }

  const { error } = await supabase
    .from("tenants")
    .update({
      ...parsed.data,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function inviteTeamMember(): Promise<ActionResult> {
  const { role } = await requireTenant()

  if (role !== "tenant-owner") {
    return { success: false, error: "Only the showroom owner can add users" }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: false,
      error:
        "Adding teammates requires a service-role key on the server (SUPABASE_SERVICE_ROLE_KEY). Ask your administrator to configure it — it must never be exposed to the browser.",
    }
  }

  return {
    success: false,
    error: "Service-role provisioning isn't wired up in this environment yet.",
  }
}

export async function removeTeamMember(id: string): Promise<ActionResult> {
  const { supabase, tenantId, role } = await requireTenant()

  if (role !== "tenant-owner") {
    return { success: false, error: "Only the showroom owner can remove users" }
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/settings")
  return { success: true }
}

export async function factoryResetTenant(): Promise<ActionResult> {
  const { supabase, role } = await requireTenant()

  if (role !== "tenant-owner") {
    return { success: false, error: "Only the showroom owner can factory reset" }
  }

  const { error } = await supabase.rpc("factory_reset_tenant")

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
