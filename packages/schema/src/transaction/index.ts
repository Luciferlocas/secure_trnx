import { z } from "zod";

export const txSecureRecordSchema = z.object({
  id: z.string().uuid(),
  partyId: z.string(),
  createdAt: z.string(),
  payload_nonce: z.string().length(24), // 12 bytes hex
  payload_ct: z.string(),
  payload_tag: z.string().length(32), // 16 bytes hex
  dek_wrap_nonce: z.string().length(24), // 12 bytes hex
  dek_wrapped: z.string(),
  dek_wrap_tag: z.string().length(32), // 16 bytes hex
  alg: z.literal("AES-256-GCM"),
  mk_version: z.literal(1),
});

export const payloadSchema = z.object({
  amount: z.number(), currency: z.string() 
})

export const createTxInputSchema = z.object({
  partyId: z.string(),
  payload: payloadSchema,
});

export const decryptTxInputSchema = z.object({
  id: z.string().uuid(),
});

export const getTransactionByIdSchema = decryptTxInputSchema