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

if (env.NODE_ENV !== "production") globalForPrisma.db = db;
