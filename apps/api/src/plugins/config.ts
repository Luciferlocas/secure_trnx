import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    config: {
      MASTER_KEY: string;
    };
  }
}

export default fp(async (fastify) => {
  const MASTER_KEY_HEX = process.env.MASTER_KEY;

  if (!MASTER_KEY_HEX) {
    fastify.log.warn(
      "MASTER_KEY env var not set. Generating using crypto.randomBytes(32).toString('hex')",
    );
    process.exit(1);
  } else if (MASTER_KEY_HEX.length !== 64) {
    fastify.log.error("MASTER_KEY must be a 32-byte hex string (64 chars)");
    process.exit(1);
  }

  fastify.decorate("config", {
    MASTER_KEY: MASTER_KEY_HEX,
  });
});
