import { z } from "zod"

export const partySchema = z.object({
  name: z.string().min(1, "Party or company name is required"),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  opening_balance: z.coerce.number().default(0),
  notes: z.string().optional(),
})

export type PartyInput = z.infer<typeof partySchema>
