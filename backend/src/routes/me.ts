import type { FastifyInstance } from 'fastify'
import { getUserByUsername } from '../lib/db.js'

export async function registerMeRoute(app: FastifyInstance) {
  app.get('/api/me', async (request, reply) => {
    if (!request.username) {
      return reply.code(401).send({ error: 'Not authenticated' })
    }

    const user = await getUserByUsername(request.username)
    if (!user) {
      // fallback: retorna apenas username/provider
      return { id: request.username, provider: 'password' }
    }

    return {
      id: user.username, // compatível com frontend atual que usa id para montar URL pública
      provider: user.provider,
      username: user.username,
      avatar_url: user.avatarUrl,
      role: user.role,
    }
  })
}
