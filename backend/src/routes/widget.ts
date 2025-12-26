import type { FastifyInstance, FastifyRequest } from 'fastify'
import { loadConfig } from '../lib/config.js'
import {
  getConfigByUserId,
  getConfigByUsername,
  getUserByUsername,
  upsertConfig,
} from '../lib/db.js'
import { renderSvg } from '../lib/svg.js'

export async function registerWidgetRoute(app: FastifyInstance) {
  // Retorna a configuração do widget do usuário autenticado, ou a global
  app.get('/api/widget', async (req) => {
    const username = (req as FastifyRequest).username as string | undefined
    if (username) {
      const user = await getUserByUsername(username)
      if (user) {
        const cfg = await getConfigByUserId(user.id)
        return (
          cfg ?? {
            id: 0,
            userId: user.id,
            mode: 'NOW_PLAYING',
            trackId: null,
            theme: 'dark',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        )
      }
    }

    // leitura pública sem sessão: retorna defaults
    return {
      id: 0,
      userId: 0,
      mode: 'NOW_PLAYING',
      trackId: null,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  // Atualiza a configuração do usuário autenticado
  app.put('/api/widget', async (req, reply) => {
    const username = (req as FastifyRequest).username as string | undefined
    if (!username) {
      return reply.code(401).send({ error: 'Not authenticated' })
    }

    const body = (req as FastifyRequest).body as {
      mode?: string
      track_id?: string | null
      theme?: string
    }
    const mode = body.mode === 'FIXED_TRACK' ? 'FIXED_TRACK' : 'NOW_PLAYING'
    const theme = body.theme === 'light' ? 'light' : 'dark'

    const user = await getUserByUsername(username)
    if (!user) return reply.code(404).send({ error: 'User not found' })

    await upsertConfig(user.id, {
      mode: mode as 'NOW_PLAYING' | 'FIXED_TRACK',
      trackId: body.track_id || null,
      theme: theme as 'dark' | 'light',
    })

    return { ok: true }
  })

  // Endpoint público para consumir a informação do usuário (JSON)
  app.get('/user/api/:username', async (request, reply) => {
    const params = (request as FastifyRequest).params as { username?: string }
    const username = params.username
    if (!username) return reply.code(400).send({ error: 'Missing username' })

    const cfg = (await getConfigByUsername(username)) ?? {
      id: 0,
      userId: 0,
      mode: 'NOW_PLAYING',
      trackId: null,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // por enquanto, o endpoint retorna o track_id salvo (se houver)
    const trackId = cfg.trackId || null

    const env = loadConfig()
    // permitir que o admin no outro host leia esse JSON (CORS controlado)
    reply.header('Access-Control-Allow-Origin', env.ADMIN_URL)
    reply.header('Access-Control-Allow-Methods', 'GET,OPTIONS')

    const source = trackId ? 'fixed' : null

    return {
      username,
      mode: cfg.mode,
      source,
      track: trackId ? { id: trackId, url: trackId } : null,
      updated_at: Date.now(),
    }
  })

  // Rota que serve o SVG do widget (compatibilidade)
  app.get('/widget', async (_req, reply) => {
    const config = {
      mode: 'NOW_PLAYING' as 'NOW_PLAYING' | 'FIXED_TRACK',
      theme: 'dark' as 'dark' | 'light',
    }

    // Por enquanto, track fake. Depois ligamos no Spotify.
    const track =
      config.mode === 'FIXED_TRACK'
        ? { name: 'Sua música fixa', artist: 'Artista Fixo' }
        : { name: 'Now playing (fake)', artist: 'Spotify-Readme' }

    const svg = renderSvg(
      track as { name: string; artist: string },
      config.theme,
    )

    reply
      .header('Content-Type', 'image/svg+xml')
      .header('Cache-Control', 'no-cache')
      .send(svg)
  })
}
