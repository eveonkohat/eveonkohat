import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, Tenant } from "@/types/database"

export type SessionContext = {
  userId: string
  email: string
  profile: Profile
  tenant: Tenant
}

/**
 * Loads the authenticated user's profile + tenant for use in Server
 * Components. The proxy already guarantees an authenticated session for
 * every dashboard route, but a brand-new auth user may not have a profile
 * row yet (e.g. created directly in the Supabase dashboard) — in that case
 * we bootstrap one here as a fallback.
 */
export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    const { data: bootstrapped } = await supabase.rpc("bootstrap_tenant_and_profile")
    profile = bootstrapped as Profile | null
  }

  if (!profile) {
    redirect("/login")
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", profile.tenant_id)
    .single()

  if (!tenant) {
    redirect("/login")
  }

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile,
    tenant,
  }
}
