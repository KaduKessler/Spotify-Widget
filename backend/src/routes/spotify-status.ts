import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/db.js'

export default async function spotifyStatusRoute(app: FastifyInstance) {
  app.get('/api/spotify/status', async (request, reply) => {
    const username = request.username
    if (!username) {
      return reply.status(401).send({ error: 'Não autenticado' })
    }

    const user = await prisma.user.findFirst({ where: { username } })
    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    const connected = !!(user.spotifyAccessToken && user.spotifyRefreshToken)
    return { connected }
  })
}
