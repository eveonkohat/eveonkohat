import { z } from "zod"

export const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  sub_category: z.string().optional(),
  date: z.string().min(1),
  payment_account_id: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().optional(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
