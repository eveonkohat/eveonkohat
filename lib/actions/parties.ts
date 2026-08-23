"use server"

import { revalidatePath } from "next/cache"
import { requireTenant } from "./require-tenant"
import { partySchema } from "@/lib/validations/parties"
import type { ActionResult } from "./require-tenant"

export async function createParty(formData: FormData): Promise<ActionResult> {
  const parsed = partySchema.safeParse({
    name: formData.get("name"),
    contact_person: formData.get("contact_person"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    opening_balance: formData.get("opening_balance"),
    notes: formData.get("notes"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()

  const { error } = await supabase.from("parties").insert({
    tenant_id: tenantId,
    ...parsed.data,
    current_balance: parsed.data.opening_balance,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/parties")
  return { success: true }
}

export async function updateParty(id: string, formData: FormData): Promise<ActionResult> {
  const parsed = partySchema.safeParse({
    name: formData.get("name"),
    contact_person: formData.get("contact_person"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    opening_balance: formData.get("opening_balance"),
    notes: formData.get("notes"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { supabase, tenantId } = await requireTenant()

  const { error } = await supabase
    .from("parties")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/parties")
  return { success: true }
}

export async function deleteParty(id: string): Promise<ActionResult> {
  const { supabase, tenantId } = await requireTenant()

  const { error } = await supabase
    .from("parties")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/parties")
  return { success: true }
}
