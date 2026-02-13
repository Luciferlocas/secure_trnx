import { FastifyPluginAsync } from "fastify";
import { encryptPayload, decryptPayload } from "@repo/crypto";
import { createTxInputSchema, TxSecureRecord } from "@repo/schema";

const transactionRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /tx/encrypt
  fastify.post<{ Body: unknown }>("/encrypt", async (request, reply) => {
    const parseResult = createTxInputSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const { partyId, payload } = parseResult.data;

    try {
      const record = encryptPayload(
        partyId,
        payload,
        fastify.config.MASTER_KEY,
      );

      const client = await fastify.pg.connect();
      try {
        const {rows} = await client.query(
          `INSERT INTO transactions (
                    party_id, created_at, payload_nonce, payload_ct, payload_tag, 
                    dek_wrap_nonce, dek_wrapped, dek_wrap_tag, alg, mk_version
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [
            record.partyId,
            record.createdAt,
            record.payload_nonce,
            record.payload_ct,
            record.payload_tag,
            record.dek_wrap_nonce,
            record.dek_wrapped,
            record.dek_wrap_tag,
            record.alg,
            record.mk_version,
          ],
        );
        const row = rows[0];
        const data: TxSecureRecord = {
          id: row.id,
          partyId: row.party_id,
          createdAt: row.created_at,
          payload_nonce: row.payload_nonce,
          payload_ct: row.payload_ct,
          payload_tag: row.payload_tag,
          dek_wrap_nonce: row.dek_wrap_nonce,
          dek_wrapped: row.dek_wrapped,
          dek_wrap_tag: row.dek_wrap_tag,
          alg: row.alg as "AES-256-GCM",
          mk_version: row.mk_version,
        };
        return data;
      } finally {
        client.release();
      }
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: "Encryption or storage failed" });
    }
  });

  // GET /tx/:id
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;

    const client = await fastify.pg.connect();
    try {
      const { rows } = await client.query(
        "SELECT * FROM transactions WHERE id = $1",
        [id],
      );

      if (rows.length === 0) {
        return reply.status(404).send({ error: "Transaction not found" });
      }

      const row = rows[0];
      const record: TxSecureRecord = {
        id: row.id,
        partyId: row.party_id,
        createdAt: row.created_at,
        payload_nonce: row.payload_nonce,
        payload_ct: row.payload_ct,
        payload_tag: row.payload_tag,
        dek_wrap_nonce: row.dek_wrap_nonce,
        dek_wrapped: row.dek_wrapped,
        dek_wrap_tag: row.dek_wrap_tag,
        alg: row.alg as "AES-256-GCM",
        mk_version: row.mk_version,
      };

      return record;
    } finally {
      client.release();
    }
  });

  // POST /tx/:id/decrypt
  fastify.post<{ Params: { id: string } }>(
    "/:id/decrypt",
    async (request, reply) => {
      const { id } = request.params;

      const client = await fastify.pg.connect();
      let record: TxSecureRecord | undefined;

      try {
        const { rows } = await client.query(
          "SELECT * FROM transactions WHERE id = $1",
          [id],
        );
        if (rows.length === 0) {
          return reply.status(404).send({ error: "Transaction not found" });
        }

        const row = rows[0];
        record = {
          id: row.id,
          partyId: row.party_id,
          createdAt: row.created_at,
          payload_nonce: row.payload_nonce,
          payload_ct: row.payload_ct,
          payload_tag: row.payload_tag,
          dek_wrap_nonce: row.dek_wrap_nonce,
          dek_wrapped: row.dek_wrapped,
          dek_wrap_tag: row.dek_wrap_tag,
          alg: row.alg as "AES-256-GCM",
          mk_version: row.mk_version,
        };
      } finally {
        client.release();
      }

      try {
        const decryptedPayload = decryptPayload(
          record,
          fastify.config.MASTER_KEY,
        );
        return decryptedPayload;
      } catch (err: any) {
        request.log.error(err);
        return reply.status(400).send({ error: "Decryption failed" });
      }
    },
  );
};

export default transactionRoutes;
