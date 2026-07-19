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
  role?: 'admin' | 'user' | 'viewer'
}): Promise<User> {
  return prisma.user.upsert({
    where: { username: data.username },
    update: {
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.role ? { role: data.role } : {}),
      updatedAt: new Date(),
    },
    create: {
      provider: data.provider,
      username: data.username,
      avatarUrl: data.avatarUrl || null,
      role: data.role || 'user',
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
// User management helpers
// ========================

export async function listUsers(): Promise<Array<Pick<User, 'id' | 'username' | 'provider' | 'role' | 'avatarUrl' | 'createdAt'>>> {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      username: true,
      provider: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
  })
  return users
}

export async function updateUserRole(username: string, role: 'admin' | 'user' | 'viewer'): Promise<User | null> {
  try {
    return await prisma.user.update({
      where: { username },
      data: { role },
    })
  } catch {
    return null
  }
}

export async function setUserPasswordHash(username: string, passwordHash: string): Promise<User | null> {
  try {
    return await prisma.user.update({
      where: { username },
      data: { passwordHash },
    })
  } catch {
    return null
  }
}

export async function createPasswordUser(params: { username: string; passwordHash: string; role?: 'admin' | 'user' | 'viewer' }): Promise<User> {
  return prisma.user.create({
    data: {
      provider: 'password',
      username: params.username,
      passwordHash: params.passwordHash,
      role: params.role || 'user',
    },
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
    exposeNowPlaying: boolean
  },
): Promise<WidgetConfig> {
  return prisma.widgetConfig.upsert({
    where: { userId },
    update: {
      mode: data.mode,
      trackId: data.trackId || null,
      theme: data.theme,
      exposeNowPlaying: data.exposeNowPlaying,
      updatedAt: new Date(),
    },
    create: {
      userId,
      mode: data.mode,
      trackId: data.trackId || null,
      theme: data.theme,
      exposeNowPlaying: data.exposeNowPlaying,
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

// ========================
// GitHub Whitelist helpers
// ========================

/**
 * Valida se um username segue o padrão do GitHub
 * GitHub usernames: 1-39 caracteres, [a-zA-Z0-9-], não pode começar/terminar com hífen
 */
export function isValidGitHubUsername(username: string): boolean {
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username) && username.length <= 39
}

/**
 * Verifica se o username existe no GitHub (via API)
 */
export async function validateGitHubUserExists(username: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: {
        'User-Agent': 'Spotify-Widget-Admin',
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    return response.status === 200
  } catch (err: unknown) {
    console.error(`Failed to validate GitHub user ${username}:`, err)
    return false
  }
}

export async function listGitHubWhitelist() {
  return await prisma.gitHubWhitelist.findMany({
    where: { removedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getGitHubWhitelistEntry(username: string) {
  return await prisma.gitHubWhitelist.findUnique({
    where: { username },
  })
}

export async function addToGitHubWhitelist(username: string, addedBy?: string, note?: string) {
  // Verificar se já existe (inclusive removidos)
  const existing = await prisma.gitHubWhitelist.findUnique({
    where: { username },
  })

  // Se existe e foi removido, reativar
  if (existing?.removedAt) {
    return await prisma.gitHubWhitelist.update({
      where: { username },
      data: {
        removedAt: null,
        removedBy: null,
        addedBy: addedBy || null,
        note: note || null,
        createdAt: new Date(), // Atualizar data de criação
      },
    })
  }

  // Se já existe ativo, lançar erro
  if (existing && !existing.removedAt) {
    throw new Error('USERNAME_ALREADY_EXISTS')
  }

  // Criar novo registro
  return await prisma.gitHubWhitelist.create({
    data: {
      username,
      addedBy: addedBy || null,
      note: note || null,
    },
  })
}

export async function removeFromGitHubWhitelist(username: string, removedBy?: string): Promise<boolean> {
  try {
    await prisma.gitHubWhitelist.update({
      where: { username },
      data: {
        removedBy: removedBy || null,
        removedAt: new Date(),
      },
    })
    return true
  } catch {
    return false
  }
}

export async function isGitHubWhitelisted(username: string): Promise<boolean> {
  const entry = await prisma.gitHubWhitelist.findUnique({
    where: { username },
  })
  return !!entry && !entry.removedAt // Verificar se não foi removido
}

export async function importGitHubWhitelistFromEnv(envWhitelist: string[] | undefined): Promise<number> {
  if (!envWhitelist || envWhitelist.length === 0) {
    return 0
  }

  let imported = 0
  for (const username of envWhitelist) {
    const trimmed = username.trim()
    if (!trimmed) continue

    // Verifica se já existe
    const existing = await getGitHubWhitelistEntry(trimmed)
    if (existing) continue

    // Adiciona com nota de origem
    try {
      await addToGitHubWhitelist(
        trimmed,
        undefined, // addedBy = null
        'Importado do .env'
      )
      imported++
    } catch (err: unknown) {
      console.error(`Failed to import ${trimmed} from .env:`, err)
    }
  }

  return imported
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
