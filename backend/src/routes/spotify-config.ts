import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getUserByUsername, prisma } from '../lib/db.js'

const spotifyConfigSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
})

export async function registerSpotifyConfigRoutes(app: FastifyInstance) {
  // GET - Retorna config Spotify (clientId mascarado)
  app.get('/api/spotify-config', async (request, reply) => {
    const username = request.username
    if (!username) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const user = await getUserByUsername(username)
    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    const spotifyData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        spotifyClientId: true,
        spotifyClientSecret: true,
      },
    })

    if (!spotifyData) {
      return reply.status(404).send({ error: 'User not found' })
    }

    // Mascara o clientSecret (mostra apenas últimos 4 chars)
    const maskedSecret = spotifyData.spotifyClientSecret
      ? `****${spotifyData.spotifyClientSecret.slice(-4)}`
      : null

    return {
      configured: !!(
        spotifyData.spotifyClientId && spotifyData.spotifyClientSecret
      ),
      clientId: spotifyData.spotifyClientId || null,
      clientSecret: maskedSecret,
    }
  })

  // POST - Salva/atualiza credenciais Spotify
  app.post('/api/spotify-config', async (request, reply) => {
    const username = request.username
    if (!username) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const result = spotifyConfigSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation error',
        details: result.error.flatten().fieldErrors,
      })
    }

    const { clientId, clientSecret } = result.data

    const user = await getUserByUsername(username)
    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    // Atualiza credenciais do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        spotifyClientId: clientId,
        spotifyClientSecret: clientSecret,
      },
    })

    app.log.info({ username }, 'Spotify credentials updated')

    return { success: true, message: 'Spotify credentials saved successfully' }
  })

  // DELETE - Remove credenciais Spotify
  app.delete('/api/spotify-config', async (request, reply) => {
    const username = request.username
    if (!username) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const user = await getUserByUsername(username)
    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        spotifyClientId: null,
        spotifyClientSecret: null,
      },
    })

    app.log.info({ username }, 'Spotify credentials cleared')

    return {
      success: true,
      message: 'Spotify credentials cleared successfully',
    }
  })
}
