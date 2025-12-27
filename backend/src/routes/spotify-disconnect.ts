import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/db.js'

export default async function spotifyDisconnectRoute(app: FastifyInstance) {
  app.post('/api/spotify/disconnect', async (request, reply) => {
    const username = request.username
    if (!username) {
      return reply.status(401).send({ error: 'Não autenticado' })
    }

    const user = await prisma.user.findFirst({ where: { username } })
    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    // Remove tokens OAuth do Spotify
    await prisma.user.update({
      where: { id: user.id },
      data: {
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        spotifyTokenExpiresAt: null,
      },
    })

    return { success: true }
  })
}
