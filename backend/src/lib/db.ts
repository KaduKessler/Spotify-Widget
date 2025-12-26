import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import {
  PrismaClient,
  type User as PrismaUser,
  type WidgetConfig as PrismaWidgetConfig,
} from '../generated/prisma-client/client'

// Singleton pattern para Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Adapter obrigatório no Prisma v7 (engineType "client")
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./data/db.sqlite',
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ========================
// Types exportados
// ========================

export type User = PrismaUser
export type WidgetConfig = PrismaWidgetConfig

// ========================
// User functions
// ========================

/**
 * Cria ou atualiza um usuário
 */
export async function upsertUser(data: {
  provider: string
  username: string
  avatarUrl?: string | null
}): Promise<User> {
  return prisma.user.upsert({
    where: { username: data.username },
    update: {
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      updatedAt: new Date(),
    },
    create: {
      provider: data.provider,
      username: data.username,
      avatarUrl: data.avatarUrl || null,
    },
  })
}

/**
 * Busca usuário por username (usado nas URLs públicas)
 */
export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  return prisma.user.findUnique({
    where: { username },
  })
}

/**
 * Busca usuário por ID interno
 */
export async function getUserById(id: number): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  })
}

// ========================
// Widget Config functions
// ========================

/**
 * Busca configuração de widget por username
 */
export async function getConfigByUsername(
  username: string,
): Promise<WidgetConfig | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { config: true },
  })

  return user?.config || null
}

/**
 * Busca configuração de widget por userId
 */
export async function getConfigByUserId(
  userId: number,
): Promise<WidgetConfig | null> {
  return prisma.widgetConfig.findUnique({
    where: { userId },
  })
}

/**
 * Cria ou atualiza configuração de widget
 */
export async function upsertConfig(
  userId: number,
  data: {
    mode: 'NOW_PLAYING' | 'FIXED_TRACK'
    trackId?: string | null
    theme: 'dark' | 'light'
  },
): Promise<WidgetConfig> {
  return prisma.widgetConfig.upsert({
    where: { userId },
    update: {
      mode: data.mode,
      trackId: data.trackId || null,
      theme: data.theme,
      updatedAt: new Date(),
    },
    create: {
      userId,
      mode: data.mode,
      trackId: data.trackId || null,
      theme: data.theme,
    },
  })
}

/**
 * Deleta configuração de widget (se necessário)
 */
export async function deleteConfig(userId: number): Promise<void> {
  await prisma.widgetConfig.delete({
    where: { userId },
  })
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
