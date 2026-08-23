import type { Metadata } from "next"
import { Building2 } from "lucide-react"
import { getSessionContext } from "@/lib/data/session"
import { getParties } from "@/lib/data/parties"
import { PageBanner } from "@/components/shared/page-banner"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button"
import { PartyFormDialog } from "@/components/parties/party-form-dialog"
import { deleteParty } from "@/lib/actions/parties"
import { formatCurrency } from "@/lib/utils/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = { title: "Parties" }

export default async function PartiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const { tenant } = await getSessionContext()
  const parties = await getParties(tenant.id, search)

  return (
    <div>
      <PageBanner
        eyebrow="Party Accounts"
        title="Parties"
        description="Manage supplier accounts, balances and ledgers."
        action={<PartyFormDialog />}
      />

      <div className="mb-4">
        <SearchInput placeholder="Search party, contact person, phone or address…" className="max-w-md" />
      </div>

      <Card className="overflow-hidden py-0">
        {parties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No party accounts found"
            description="Register a supplier or party to start tracking balances and ledgers."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Party Account</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parties.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell className="font-medium">{party.name}</TableCell>
                    <TableCell>{party.contact_person || "—"}</TableCell>
                    <TableCell>{party.phone || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{party.address || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(party.current_balance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <PartyFormDialog party={party} />
                        <ConfirmDeleteButton
                          title="Delete this party account?"
                          description={`This will permanently remove ${party.name} and its balance history.`}
                          action={deleteParty.bind(null, party.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
