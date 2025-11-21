import type { FastifyInstance } from 'fastify'
import { getUserById } from '../lib/db.js'

export async function registerMeRoute(app: FastifyInstance) {
  app.get('/api/me', async (request, reply) => {
    if (!request.userId) {
      return reply.code(401).send({ error: 'Not authenticated' })
    }

    const user = getUserById(request.userId)
    if (!user) {
      // fallback: retorna apenas id/provider
      return { id: request.userId, provider: 'password' }
    }

    return {
      id: user.id,
      provider: user.provider,
      username: user.username,
      avatar_url: user.avatar_url,
    }
  })
}
