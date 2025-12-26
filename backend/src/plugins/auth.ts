import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'

declare module 'fastify' {
  interface FastifyRequest {
    username?: string
  }
}

export async function registerAuthPlugin(app: FastifyInstance) {
  const env = loadConfig()

  app.addHook('preHandler', async (request, reply) => {
    const url = request.url

    // Rotas sempre públicas:
    if (
      url.startsWith('/widget') ||
      url.startsWith('/auth') ||
      url === '/api/auth-config'
    ) {
      return
    }

    // Modo none → tudo liberado, usa ADMIN_USERNAME como username de sessão
    if (env.AUTH_PROVIDER === 'none') {
      request.username = env.ADMIN_USERNAME
      return
    }

    // Password / GitHub → exigem sessão
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

    // O cookie de sessão armazena o username
    request.username = unsign.value
  })
}
