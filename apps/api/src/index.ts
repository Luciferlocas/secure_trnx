import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import dbPlugin from "./plugins/db";
import configPlugin from "./plugins/config";
import transactionRoutes from "./routes/transaction";

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

fastify.register(configPlugin);
fastify.register(dbPlugin);

fastify.register(transactionRoutes, { prefix: "/api/tx" });

const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
    console.log(`Server listening on http://localhost:3001`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
