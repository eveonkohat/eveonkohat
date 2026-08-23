import "server-only"
import { createClient } from "@/lib/supabase/server"

/** Resolves the caller's tenant inside a Server Action, throwing if unauthenticated. */
export async function requireTenant() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("No tenant found for this user")
  }

  return { supabase, tenantId: profile.tenant_id, role: profile.role, userId: user.id }
}

export type ActionResult = { success: true } | { success: false; error: string }
