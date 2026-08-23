import { z } from "zod"

export const accountSchema = z.object({
  type: z.enum(["cash", "bank"]),
  name: z.string().min(1, "Account name is required"),
  address: z.string().optional(),
  opening_balance: z.coerce.number().default(0),
})

export const transferSchema = z
  .object({
    from_account_id: z.string().min(1, "Select a source account"),
    to_account_id: z.string().min(1, "Select a destination account"),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    date: z.string().min(1),
    note: z.string().optional(),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: "Source and destination accounts must be different",
    path: ["to_account_id"],
  })

export const otherIncomeSchema = z.object({
  date: z.string().min(1),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().optional(),
  account_id: z.string().min(1, "Select an account"),
})

export type AccountInput = z.infer<typeof accountSchema>
export type TransferInput = z.infer<typeof transferSchema>
export type OtherIncomeInput = z.infer<typeof otherIncomeSchema>
