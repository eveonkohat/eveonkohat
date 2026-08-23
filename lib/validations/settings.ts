import { z } from "zod"

export const showroomInfoSchema = z.object({
  name: z.string().min(1, "Showroom name is required"),
  owner_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export type ShowroomInfoInput = z.infer<typeof showroomInfoSchema>
