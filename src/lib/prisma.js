/**
 * Prisma v7 singleton client using @prisma/adapter-pg (factory pattern).
 * Re-uses the connection pool across serverless invocations (in dev).
 */
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

function createPrismaClient() {
  // PrismaPg is an AdapterFactory — pass it directly as the adapter.
  // It internally creates a pg.Pool from the connection config.
  const adapterFactory = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter: adapterFactory });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
