import { z } from "zod";
import {
  txSecureRecordSchema,
  createTxInputSchema,
  decryptTxInputSchema,
  getTransactionByIdSchema,
  payloadSchema,
} from "./index.js";

export type TxSecureRecord = z.infer<typeof txSecureRecordSchema>;
export type CreateTxInput = z.infer<typeof createTxInputSchema>;
export type DecryptTxInput = z.infer<typeof decryptTxInputSchema>;
export type GetTransactionByIdInput = z.infer<typeof getTransactionByIdSchema>;
export type Payload = z.infer<typeof payloadSchema>;
