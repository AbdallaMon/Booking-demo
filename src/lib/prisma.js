/**
 * Prisma v7 singleton client using @prisma/adapter-pg (factory pattern).
 * Re-uses the connection pool across serverless invocations (in dev).
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

function createPrismaClient() {
  // max:1 is critical for serverless (Vercel) — each invocation gets one
  // connection, preventing "too many connections" on Prisma Postgres.
  const adapterFactory = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });
  return new PrismaClient({ adapter: adapterFactory });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
