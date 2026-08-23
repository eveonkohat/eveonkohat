import { z } from "zod"

export const installmentCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  father_name: z.string().optional(),
  cnic: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  guarantor_name: z.string().optional(),
  guarantor_cnic: z.string().optional(),
  guarantor_phone: z.string().optional(),
  registration_date: z.string().min(1),
})

export const installmentSaleSchema = z.object({
  customer_id: z.string().min(1, "Select a customer"),
  bike_id: z.string().optional(),
  item_description: z.string().optional(),
  sale_date: z.string().min(1),
  total_amount: z.coerce.number().min(0),
  down_payment: z.coerce.number().min(0).default(0),
  term_months: z.coerce.number().int().min(1).default(12),
})

export const installmentPaymentSchema = z.object({
  installment_sale_id: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  payment_date: z.string().min(1),
  account_id: z.string().optional(),
  notes: z.string().optional(),
})

export const installmentTermSchema = z.object({
  title: z.string().min(1, "Title is required"),
  terms_text: z.string().min(1, "Terms and conditions are required"),
})

export type InstallmentCustomerInput = z.infer<typeof installmentCustomerSchema>
export type InstallmentSaleInput = z.infer<typeof installmentSaleSchema>
export type InstallmentPaymentInput = z.infer<typeof installmentPaymentSchema>
export type InstallmentTermInput = z.infer<typeof installmentTermSchema>
