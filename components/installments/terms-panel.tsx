"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, FileText, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button"
import { createInstallmentTerm, deleteInstallmentTerm } from "@/lib/actions/installments"
import type { InstallmentTerm } from "@/types/database"

type FormState = { error?: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      Save Terms
    </Button>
  )
}

export function TermsPanel({ terms }: { terms: InstallmentTerm[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await createInstallmentTerm(formData)
    if (!result.success) return { error: result.error }
    toast.success("Terms saved")
    return {}
  }, {})

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" />
            Write Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Installment Agreement Terms" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms_text">Terms and Conditions</Label>
              <Textarea
                id="terms_text"
                name="terms_text"
                rows={8}
                placeholder="Type terms and conditions here…"
                required
              />
            </div>
            {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved Term Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          {terms.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No term sheets yet"
              description="Terms you save will be reusable across installment agreements."
            />
          ) : (
            <ul className="divide-y">
              {terms.map((term) => (
                <li key={term.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{term.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">
                      {term.terms_text}
                    </p>
                  </div>
                  <ConfirmDeleteButton
                    title="Delete this term sheet?"
                    action={deleteInstallmentTerm.bind(null, term.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
