import { PrismaClient } from "@prisma/client";

/**
 * A single shared PrismaClient. This is the ONLY module that constructs the ORM
 * client; everything else goes through the repository layer. Reusing one client
 * avoids exhausting connections during dev hot-reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };
