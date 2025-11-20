import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string
  }
}

export async function registerAuthPlugin(app: FastifyInstance) {
  const env = loadConfig()

  app.addHook('preHandler', async (request, reply) => {
    // /widget sempre público
    if (request.url.startsWith('/widget')) return

    // /auth/* sempre público (login/logout, callback github)
    if (request.url.startsWith('/auth')) return

    // none → tudo liberado, assume userId padrão
    if (env.AUTH_PROVIDER === 'none') {
      request.userId = 'local'
      return
    }

    // password/github → precisam de sessão
    const raw = request.cookies.session
    if (!raw) {
      reply.code(401).send({ error: 'Unauthorized' })
      return
    }

    const unsign = reply.unsignCookie(raw)
    if (!unsign.valid || !unsign.value) {
      reply.code(401).send({ error: 'Invalid session' })
      return
    }

    request.userId = unsign.value
  })
}
