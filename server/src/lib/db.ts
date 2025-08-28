import { env } from "@/env";
import { PrismaClient } from "../../prisma/generated/client";

const globalForPrisma = globalThis as unknown as {
  db: PrismaClient | undefined;
};

export const db =
  globalForPrisma.db ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

console.log("Postgres URL: ", env.DATABASE_URL)
console.log("Node ENV: ", env.NODE_ENV)
if (env.NODE_ENV !== "production") globalForPrisma.db = db;
