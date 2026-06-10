import { z } from "zod";

export const createFeePaymentSchema = z.object({
  studentId: z.string().min(1),
  studentFeeId: z.string().min(1),

  amountPaid: z.number().positive(),

  paymentMethod: z.enum([
    "cash",
    "bank_transfer",
    "card",
    "pos",
    "online",
  ]),

  paidAt: z.string().optional(),

  reference: z.string().optional(),

  note: z.string().optional(),
});