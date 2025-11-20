import type { FastifyInstance } from 'fastify'
import { getConfig } from '../lib/db'
import { renderSvg } from '../lib/svg'

export async function registerWidgetRoute(app: FastifyInstance) {
  app.get('/widget', async (_req, reply) => {
    const config = getConfig()

    // Por enquanto, track fake. Depois ligamos no Spotify.
    const track =
      config.mode === 'FIXED_TRACK'
        ? { name: 'Sua música fixa', artist: 'Artista Fixo' }
        : { name: 'Now playing (fake)', artist: 'Spotify-Readme' }

    const svg = renderSvg(track, config.theme)

    reply
      .header('Content-Type', 'image/svg+xml')
      .header('Cache-Control', 'no-cache')
      .send(svg)
  })
}
