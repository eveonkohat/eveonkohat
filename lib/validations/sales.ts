import { z } from "zod"

export const scooterSaleSchema = z.object({
  scooter_id: z.string().min(1, "Select a scooter to sell"),
  customer_name: z.string().min(1, "Customer name is required"),
  customer_cnic: z.string().optional(),
  customer_phone: z.string().optional(),
  date: z.string().min(1),
  total_amount: z.coerce.number().min(0),
  received_amount: z.coerce.number().min(0).default(0),
  payment_account_id: z.string().optional(),
  notes: z.string().optional(),
})

export const posLineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().positive(),
  uom: z.string().default("Unit"),
  rate: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
})

export const posSaleSchema = z.object({
  customer_name: z.string().min(1).default("Cash Customer"),
  customer_phone: z.string().optional(),
  date: z.string().min(1),
  items: z.array(posLineItemSchema).min(1, "Add at least one item"),
  terms_and_conditions: z.string().optional(),
  grand_total: z.coerce.number().min(0),
  received_amount: z.coerce.number().min(0).default(0),
  payment_account_id: z.string().optional(),
  invoice_notes: z.string().optional(),
})

export type ScooterSaleInput = z.infer<typeof scooterSaleSchema>
export type PosSaleInput = z.infer<typeof posSaleSchema>
