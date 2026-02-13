import * as crypto from "node:crypto";
import { type TxSecureRecord } from "@repo/schema";

export { type TxSecureRecord };

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits
const TAG_LENGTH = 16; // 128 bits

export function encryptPayload(
  partyId: string,
  payload: unknown,
  masterKeyHex: string,
): Omit<TxSecureRecord, "id"> {
  const masterKey = Buffer.from(masterKeyHex, "hex");
  if (masterKey.length !== KEY_LENGTH) {
    throw new Error(`Master Key must be ${KEY_LENGTH} bytes`);
  }

  const dek = crypto.randomBytes(KEY_LENGTH);

  const payloadBuffer = Buffer.from(JSON.stringify(payload), "utf8");
  const payloadIv = crypto.randomBytes(IV_LENGTH);
  const payloadCipher = crypto.createCipheriv(ALGORITHM, dek, payloadIv);

  const payloadCt = Buffer.concat([
    payloadCipher.update(payloadBuffer),
    payloadCipher.final(),
  ]);
  const payloadTag = payloadCipher.getAuthTag();

  const dekIv = crypto.randomBytes(IV_LENGTH);
  const dekCipher = crypto.createCipheriv(ALGORITHM, masterKey, dekIv);

  const dekWrapped = Buffer.concat([dekCipher.update(dek), dekCipher.final()]);
  const dekTag = dekCipher.getAuthTag();

  return {
    partyId,
    createdAt: new Date().toISOString(),
    payload_nonce: payloadIv.toString("hex"),
    payload_ct: payloadCt.toString("hex"),
    payload_tag: payloadTag.toString("hex"),
    dek_wrap_nonce: dekIv.toString("hex"),
    dek_wrapped: dekWrapped.toString("hex"),
    dek_wrap_tag: dekTag.toString("hex"),
    alg: "AES-256-GCM",
    mk_version: 1,
  };
}


export function decryptPayload(
  record: TxSecureRecord,
  masterKeyHex: string,
): unknown {
  const masterKey = Buffer.from(masterKeyHex, "hex");
  if (masterKey.length !== KEY_LENGTH) {
    throw new Error(`Master Key must be ${KEY_LENGTH} bytes`);
  }

  if (record.alg !== "AES-256-GCM") {
    throw new Error(`Unsupported algorithm: ${record.alg}`);
  }

  try {
    const dekIv = Buffer.from(record.dek_wrap_nonce, "hex");
    const dekWrapped = Buffer.from(record.dek_wrapped, "hex");
    const dekTag = Buffer.from(record.dek_wrap_tag, "hex");

    if (dekIv.length !== IV_LENGTH) throw new Error("Invalid DEK nonce length");
    if (dekTag.length !== TAG_LENGTH) throw new Error("Invalid DEK tag length");

    const dekDecipher = crypto.createDecipheriv(ALGORITHM, masterKey, dekIv);
    dekDecipher.setAuthTag(dekTag);

    const dek = Buffer.concat([
      dekDecipher.update(dekWrapped),
      dekDecipher.final(),
    ]);

    const payloadIv = Buffer.from(record.payload_nonce, "hex");
    const payloadCt = Buffer.from(record.payload_ct, "hex");
    const payloadTag = Buffer.from(record.payload_tag, "hex");

    if (payloadIv.length !== IV_LENGTH)
      throw new Error("Invalid payload nonce length");
    if (payloadTag.length !== TAG_LENGTH)
      throw new Error("Invalid payload tag length");

    const payloadDecipher = crypto.createDecipheriv(ALGORITHM, dek, payloadIv);
    payloadDecipher.setAuthTag(payloadTag);

    const payloadBuffer = Buffer.concat([
      payloadDecipher.update(payloadCt),
      payloadDecipher.final(),
    ]);

    return JSON.parse(payloadBuffer.toString("utf8"));
  } catch (error: any) {
    if (
      error.message.includes("Unsupported state") ||
      error.message.includes("auth tag")
    ) {
      throw new Error("Decryption failed: Integrity check failed");
    }
    throw error;
  }
}
