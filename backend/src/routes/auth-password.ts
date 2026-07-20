import { timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcrypt'
import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'
import { getUserByUsername, upsertUser } from '../lib/db.js'

// Throttle map: IP/username → { attempts, lockUntil }
const failedAttempts = new Map<
  string,
  { attempts: number; lockUntil: number }
>()

const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 5 * 60 * 1000 // 5 minutos

function checkThrottle(
  key: string,
): { allowed: true } | { allowed: false; retryAfter: number } {
  const record = failedAttempts.get(key)
  if (!record) return { allowed: true }

  const now = Date.now()
  if (record.lockUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.lockUntil - now) / 1000),
    }
  }

  // Só reseta se já esteve trancado e o lock expirou. Antes de bater o
  // limite (lockUntil ainda em 0), não mexe no contador de tentativas.
  if (record.lockUntil > 0) {
    failedAttempts.delete(key)
  }
  return { allowed: true }
}

function recordFailure(key: string) {
  const now = Date.now()
  const record = failedAttempts.get(key) || { attempts: 0, lockUntil: 0 }

  record.attempts += 1

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_TIME
    console.warn(
      `[Auth] Lockout triggered for ${key} after ${record.attempts} attempts`,
    )
  }

  failedAttempts.set(key, record)
}

function resetFailures(key: string) {
  failedAttempts.delete(key)
}

export async function registerPasswordAuthRoutes(app: FastifyInstance) {
  const env = loadConfig()

  if (!env.ENABLE_PASSWORD_AUTH) return

  app.post('/login', async (request, reply) => {
    const body = request.body as { username?: string; password?: string }

    const username = (body.username || '').trim()
    const password = (body.password || '').trim()

    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password required' })
    }

    // Throttle por IP
    const clientIp = request.ip
    const throttleKey = `${clientIp}:${username}`
    const throttle = checkThrottle(throttleKey)

    if (!throttle.allowed) {
      return reply.code(429).send({
        error: 'Too many failed attempts',
        retryAfter: throttle.retryAfter,
      })
    }

    // 1) Tenta login por usuário do banco com provider 'password'
    const user = await getUserByUsername(username)
    if (user && user.provider === 'password' && user.passwordHash) {
      const ok = await bcrypt.compare(password, user.passwordHash)
      if (!ok) {
        recordFailure(throttleKey)
        const record = failedAttempts.get(throttleKey)
        console.warn(
          `[Auth] Failed login attempt for ${username} from ${clientIp} (${record?.attempts}/${MAX_ATTEMPTS})`,
        )
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      // Login bem-sucedido: resetar tentativas
      resetFailures(throttleKey)

      // Cookie de sessão: username:role
      reply
        .setCookie('session', `${user.username}:${user.role}`, {
          signed: true,
          httpOnly: true,
          sameSite: 'lax',
          secure: env.NODE_ENV === 'production',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        })
        .send({ ok: true })
      return
    }

    // 2) Fallback: credenciais de ADMIN_USERNAME/ADMIN_PASSWORD via env (legacy single admin)
    const usernameMatch =
      username.length === env.ADMIN_USERNAME.length &&
      timingSafeEqual(Buffer.from(username), Buffer.from(env.ADMIN_USERNAME))

    const passwordMatch =
      password.length === env.ADMIN_PASSWORD.length &&
      timingSafeEqual(Buffer.from(password), Buffer.from(env.ADMIN_PASSWORD))

    if (!usernameMatch || !passwordMatch) {
      recordFailure(throttleKey)
      const record = failedAttempts.get(throttleKey)
      console.warn(
        `[Auth] Failed login attempt for ${username} from ${clientIp} (${record?.attempts}/${MAX_ATTEMPTS})`,
      )
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    // Login bem-sucedido: resetar tentativas
    resetFailures(throttleKey)

    // Garante presença do usuário admin no banco
    await upsertUser({
      provider: 'password',
      username: env.ADMIN_USERNAME,
      avatarUrl: null,
      role: 'admin',
    })

    reply
      .setCookie('session', `${env.ADMIN_USERNAME}:admin`, {
        signed: true,
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({ ok: true })
  })

  app.post('/logout', async (_req, reply) => {
    reply.clearCookie('session', { path: '/' }).send({ ok: true })
  })
}
