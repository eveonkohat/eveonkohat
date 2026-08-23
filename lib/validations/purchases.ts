import { z } from "zod"

export const scooterPurchaseSchema = z.object({
  vehicle_type: z.string().min(1).default("Electric"),
  make: z.string().min(1, "Company (make) is required"),
  model: z.string().min(1, "Scooter model is required"),
  color: z.string().optional(),
  year: z.coerce.number().int().optional(),
  date: z.string().min(1),
  purchase_price: z.coerce.number().min(0).default(0),
  tax_per_unit: z.coerce.number().min(0).default(0),
  carriage_per_unit: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().int().min(1).default(1),
  party_id: z.string().optional(),
  chassis_no: z.string().optional(),
  engine_no: z.string().optional(),
})

export const otherPurchaseSchema = z.object({
  date: z.string().min(1),
  party_id: z.string().optional(),
  item_name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().min(1).default(1),
  unit_price: z.coerce.number().min(0).default(0),
  paid_amount: z.coerce.number().min(0).default(0),
  payment_account_id: z.string().optional(),
  description: z.string().optional(),
})

export const purchaseReturnSchema = z.object({
  scooter_id: z.string().min(1, "Select a scooter to return"),
  return_date: z.string().min(1),
  agreed_return_amount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})

export type ScooterPurchaseInput = z.infer<typeof scooterPurchaseSchema>
export type OtherPurchaseInput = z.infer<typeof otherPurchaseSchema>
export type PurchaseReturnInput = z.infer<typeof purchaseReturnSchema>
