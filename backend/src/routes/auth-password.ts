import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'
import { upsertUser } from '../lib/db.js'

export async function registerPasswordAuthRoutes(app: FastifyInstance) {
  const env = loadConfig()

  if (env.AUTH_PROVIDER !== 'password') return

  app.post('/auth/login', async (request, reply) => {
    const body = request.body as { username?: string; password?: string }

    const username = (body.username || '').trim()
    const password = (body.password || '').trim()

    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    // Garante presença do usuário no banco (username único)
    await upsertUser({
      provider: 'password',
      username: env.ADMIN_USERNAME,
      avatarUrl: null,
    })

    reply
      // Armazena o username na sessão
      .setCookie('session', env.ADMIN_USERNAME, {
        signed: true,
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        path: '/',
      })
      .send({ ok: true })
  })

  app.post('/auth/logout', async (_req, reply) => {
    reply.clearCookie('session', { path: '/' }).send({ ok: true })
  })
}
