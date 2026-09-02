"use client"

import { useActionState, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/lib/actions/settings"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
      Update Password
    </Button>
  )
}

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await changePassword(formData)
    if (!result.success) return { error: result.error }
    toast.success("Password updated")
    formRef.current?.reset()
    return {}
  }, {})

  return (
    <form ref={formRef} action={formAction} className="grid max-w-sm gap-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>

      {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

      <SubmitButton />
    </form>
  )
}
