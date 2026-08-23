"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, UserPlus, Eye, Pencil, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button"
import { inviteTeamMember, removeTeamMember } from "@/lib/actions/settings"
import type { Profile } from "@/types/database"

type FormState = { error?: string }

const ROLE_LABELS: Record<string, string> = {
  "tenant-owner": "tenant-owner",
  manager: "manager",
  staff: "staff",
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Send Invite
    </Button>
  )
}

export function UserManagementPanel({
  members,
  currentUserId,
  canManage,
}: {
  members: Profile[]
  currentUserId: string
  canManage: boolean
}) {
  const [open, setOpen] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState requires this signature
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, _formData) => {
    const result = await inviteTeamMember()
    if (!result.success) return { error: result.error }
    toast.success("Invite sent")
    setOpen(false)
    return {}
  }, {})

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={!canManage} className="w-full sm:w-auto">
            <UserPlus className="size-4" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Invite a teammate to your showroom workspace.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="grid gap-4">
            {state.error ? (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
            ) : null}
            <DialogFooter>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="flex items-center gap-2 font-medium">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {(m.full_name || m.email)[0]?.toUpperCase()}
                  </span>
                  {m.id === currentUserId ? "— You" : m.full_name || m.email.split("@")[0]}
                </TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell>{ROLE_LABELS[m.role] ?? m.role}</TableCell>
                <TableCell>{m.permissions.length} pages</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" disabled>
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" disabled={!canManage}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" disabled={!canManage}>
                      <ShieldCheck className="size-4" />
                    </Button>
                    {canManage && m.id !== currentUserId ? (
                      <ConfirmDeleteButton
                        title={`Remove ${m.full_name || m.email}?`}
                        description="They will immediately lose access to this workspace."
                        action={removeTeamMember.bind(null, m.id)}
                      />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
