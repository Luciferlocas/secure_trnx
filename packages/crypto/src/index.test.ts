import { test, describe } from "node:test";
import * as assert from "node:assert";
import * as crypto from "node:crypto";
import { encryptPayload, decryptPayload } from "./index";

const MASTER_KEY_HEX = crypto.randomBytes(32).toString("hex");
const id = crypto.randomUUID();

describe("Crypto Module", () => {
  test("encryptPayload -> decryptPayload works", () => {
    const payload = { amount: 100, currency: "USD" };
    const partyId = "party_123";

    const record = encryptPayload(partyId, payload, MASTER_KEY_HEX);

    assert.strictEqual(record.partyId, partyId);
    assert.strictEqual(record.alg, "AES-256-GCM");

    const decrypted = decryptPayload({id, ...record}, MASTER_KEY_HEX);
    assert.deepStrictEqual(decrypted, payload);
  });

  test("decryptPayload fails with tampered ciphertext", () => {
    const payload = { secret: "data" };
    const record = encryptPayload("p1", payload, MASTER_KEY_HEX);

    // Tamper with payload_ct (change last byte)
    const ctBuffer = Buffer.from(record.payload_ct, "hex");
    if (ctBuffer.length > 0) {
      ctBuffer[ctBuffer.length - 1]! ^= 1;
    }
    record.payload_ct = ctBuffer.toString("hex");

    assert.throws(() => {
      decryptPayload({id, ...record}, MASTER_KEY_HEX);
    }, /Decryption failed|Integrity check failed/);
  });

  test("decryptPayload fails with tampered tag", () => {
    const payload = { secret: "data" };
    const record = encryptPayload("p1", payload, MASTER_KEY_HEX);

    // Tamper with payload_tag
    const tagBuffer = Buffer.from(record.payload_tag, "hex");
    if (tagBuffer.length > 0) {
      tagBuffer[0]! ^= 1;
    }
    record.payload_tag = tagBuffer.toString("hex");

    assert.throws(() => {
      decryptPayload({id, ...record}, MASTER_KEY_HEX);
    }, /Decryption failed|Integrity check failed/);
  });

  test("decryptPayload fails with wrong nonce length", () => {
    const payload = { secret: "data" };
    const record = encryptPayload("p1", payload, MASTER_KEY_HEX);

    // Invalid nonce length (should be 12 bytes / 24 hex chars)
    record.payload_nonce = "00".repeat(11); // 11 bytes

    assert.throws(() => {
      decryptPayload({id, ...record}, MASTER_KEY_HEX);
    }, /Invalid payload nonce length/);
  });

  test("encryptPayload throws with invalid Master Key length", () => {
    assert.throws(() => {
      encryptPayload("p1", {}, "1234"); // Too short
    }, /Master Key must be 32 bytes/);
  });

  test("decryptPayload fails with tampered DEK ciphertext", () => {
    const payload = { secret: "data" };
    const record = encryptPayload("p1", payload, MASTER_KEY_HEX);

    // Tamper with dek_wrapped
    const dekBuffer = Buffer.from(record.dek_wrapped, "hex");
    if (dekBuffer.length > 0) {
      dekBuffer[0]! ^= 1;
    }
    record.dek_wrapped = dekBuffer.toString("hex");

    assert.throws(() => {
      decryptPayload({id, ...record}, MASTER_KEY_HEX);
    }, /Decryption failed|Integrity check failed/);
  });
});
