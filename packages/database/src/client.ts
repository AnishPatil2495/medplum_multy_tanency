import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | undefined;

export function getPrismaClient(databaseUrl?: string): PrismaClient {
  if (prismaInstance) return prismaInstance;

  prismaInstance = new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = undefined;
  }
}
