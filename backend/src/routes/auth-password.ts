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

    const userId = 'local'

    upsertUser({
      id: userId,
      provider: 'password',
      username: env.ADMIN_USERNAME,
      avatar_url: null,
    })

    reply
      .setCookie('session', userId, {
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
