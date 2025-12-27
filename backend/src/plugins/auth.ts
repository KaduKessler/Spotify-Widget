import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'

declare module 'fastify' {
  interface FastifyRequest {
    username?: string
    role?: 'admin' | 'user' | 'viewer'
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

    // Modo none → tudo liberado, usa ADMIN_USERNAME como username de sessão e role admin
    if (env.ENABLE_NONE_AUTH) {
      request.username = env.ADMIN_USERNAME
      request.role = 'admin'
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

    // Cookie de sessão: `username:role` ou apenas `username`
    const value = unsign.value
    if (value.includes(':')) {
      const parts = value.split(':') as [string, string?]
      const u = parts[0]
      const r = parts[1]
      if (u) request.username = u
      request.role = (r as 'admin' | 'user' | 'viewer') || 'user'
    } else {
      if (value) request.username = value
      // Se listado como ADMIN_USERS no env, considera admin; senão user
      const env = loadConfig()
      request.role = env.ADMIN_USERS.includes(value) ? 'admin' : 'user'
    }
  })
}
