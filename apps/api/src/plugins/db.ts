import fp from "fastify-plugin";
import fastifyPostgres from "@fastify/postgres";

export default fp(async (fastify) => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  await fastify.register(fastifyPostgres, {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
  });

  fastify.addHook("onReady", async () => {
    const client = await fastify.pg.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          party_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          payload_nonce TEXT NOT NULL,
          payload_ct TEXT NOT NULL,
          payload_tag TEXT NOT NULL,
          dek_wrap_nonce TEXT NOT NULL,
          dek_wrapped TEXT NOT NULL,
          dek_wrap_tag TEXT NOT NULL,
          alg TEXT NOT NULL,
          mk_version INTEGER NOT NULL
        );
      `);
      fastify.log.info("Database schema initialized");
    } finally {
      client.release();
    }
  });
});
