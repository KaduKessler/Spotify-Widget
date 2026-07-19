import type { FastifyInstance, FastifyRequest } from 'fastify'
import { loadConfig } from '../lib/config.js'
import {
  getConfigByUserId,
  getConfigByUsername,
  getUserByUsername,
  upsertConfig,
} from '../lib/db.js'
import { renderSvg } from '../lib/svg.js'
import { parseWidgetConfig } from '../lib/validation.js'
import { getNowPlayingForUser } from './spotify-now-playing.js'

async function toDataUri(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get('content-type') || 'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return undefined
  }
}

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
            exposeNowPlaying: true,
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
      exposeNowPlaying: true,
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

    // Validar input com Zod
    const validation = parseWidgetConfig((req as FastifyRequest).body)
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error })
    }

    const user = await getUserByUsername(username)
    if (!user) return reply.code(404).send({ error: 'User not found' })

    await upsertConfig(user.id, validation.data)

    return { ok: true }
  })

  // Endpoint público para consumir a informação do usuário (JSON)
  app.get('/user/api/:username', async (request, reply) => {
    const params = (request as FastifyRequest).params as { username?: string }
    const username = params.username
    if (!username) return reply.code(400).send({ error: 'Missing username' })

    const env = loadConfig()
    reply.header('Access-Control-Allow-Origin', env.ADMIN_URL)
    reply.header('Access-Control-Allow-Methods', 'GET,OPTIONS')

    const cfg = (await getConfigByUsername(username)) ?? {
      id: 0,
      userId: 0,
      mode: 'NOW_PLAYING',
      trackId: null,
      theme: 'dark',
      exposeNowPlaying: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const user = await getUserByUsername(username)

    // Privacidade: se o usuário optou por não expor, não retorna nada ao público
    if (!cfg.exposeNowPlaying) {
      return reply.code(204).send()
    }

    // Se o modo for NOW_PLAYING e o usuário permitiu exposição, tentar trazer a última/atual música
    if (user && cfg.mode === 'NOW_PLAYING' && cfg.exposeNowPlaying) {
      try {
        const now = await getNowPlayingForUser(user.id, app)
        if (now) {
          const source = now.isPlaying ? 'now_playing' : 'recent'
          return {
            username,
            mode: cfg.mode,
            source,
            track: {
              id: now.track.id,
              name: now.track.name,
              artists: now.track.artists,
              album: now.track.album,
              albumArt: now.track.albumArt,
              uri: now.track.uri,
              url: now.track.url,
              isPlaying: now.isPlaying,
              lastPlayedAt: now.lastPlayedAt ?? null,
            },
            updated_at: Date.now(),
          }
        }
      } catch (err) {
        app.log.error({ err, username }, 'Failed to fetch now playing for JSON')
      }
    }

    // Fallback: usa track fixa se configurada
    const trackId = cfg.trackId || null
    const source = trackId ? 'fixed' : null

    return {
      username,
      mode: cfg.mode,
      source,
      track: trackId
        ? {
            id: trackId,
            url: trackId,
          }
        : null,
      updated_at: Date.now(),
    }
  })

  // Rota que serve o SVG do widget
  app.get('/widget', async (req, reply) => {
    // Tenta pegar username da query string ou da sessão
    const query = (req as FastifyRequest).query as {
      user?: string
      spin?: string
      scan?: string
      theme?: 'dark' | 'light'
      rainbow?: string
    }
    const sessionUsername = (req as FastifyRequest).username as
      | string
      | undefined
    const username = query.user || sessionUsername

    const config = {
      mode: 'NOW_PLAYING' as 'NOW_PLAYING' | 'FIXED_TRACK',
      theme: 'dark' as 'dark' | 'light',
      trackId: null as string | null,
    }

    type WidgetTrack = {
      name: string
      artist: string
      cover_url?: string | undefined
      isPlaying?: boolean | undefined
      lastPlayedAt?: string | undefined
    }

    let track: WidgetTrack = {
      name: 'Spotify Widget',
      artist: 'Configure no painel',
    }

    // Se usuário especificado, busca config dele
    let scanCodeSrc: string | undefined
    const spin = query.spin === '1' || query.spin === 'true'
    const rainbow = query.rainbow === '1' || query.rainbow === 'true'
    const themeOverride = query.theme

    if (username) {
      const user = await getUserByUsername(username)
      if (user) {
        const userConfig = await getConfigByUserId(user.id)
        if (userConfig) {
          config.mode =
            userConfig.mode === 'FIXED_TRACK' ? 'FIXED_TRACK' : 'NOW_PLAYING'
          config.theme = userConfig.theme === 'light' ? 'light' : 'dark'
          config.trackId = userConfig.trackId
        }

        // Se modo NOW_PLAYING e tem Spotify conectado
        if (config.mode === 'NOW_PLAYING' && user.spotifyAccessToken) {
          try {
            const nowPlaying = await getNowPlayingForUser(user.id, app)

            if (nowPlaying) {
              let cover: string | undefined
              if (nowPlaying.track.albumArt) {
                // Usa data URI para evitar bloqueios de CORS ao embutir SVG via <img>
                cover =
                  (await toDataUri(nowPlaying.track.albumArt)) ||
                  nowPlaying.track.albumArt ||
                  undefined
              }
              track = {
                name: nowPlaying.track.name,
                artist: nowPlaying.track.artists.join(', '),
                cover_url: cover,
                // extras para renderização
                isPlaying: !!nowPlaying.isPlaying,
                lastPlayedAt: nowPlaying.lastPlayedAt,
              }

              // Se solicitou scan code e há uri do Spotify, gera data URI
              if (
                (query.scan === '1' || query.scan === 'true') &&
                nowPlaying.track.uri
              ) {
                scanCodeSrc = await getScanCodeDataUri(nowPlaying.track.uri)
              }
            }
          } catch (err) {
            app.log.error(
              { err, username },
              'Failed to fetch now playing for widget',
            )
          }
        }
      }
    }

    // Permite override de tema via query, com ou sem usuário
    if (themeOverride === 'dark' || themeOverride === 'light') {
      config.theme = themeOverride
    }

    const svg = (
      renderSvg as unknown as (
        t: WidgetTrack,
        theme: 'dark' | 'light',
        opts?: {
          spin?: boolean | undefined
          rainbow?: boolean | undefined
          scanCodeSrc?: string | undefined
        },
      ) => string
    )(track, config.theme, {
      spin,
      rainbow,
      scanCodeSrc,
    })

    reply
      .header('Content-Type', 'image/svg+xml')
      .header('Cache-Control', 'no-cache')
      .send(svg)
  })
}

async function getScanCodeDataUri(
  spotifyUri: string,
): Promise<string | undefined> {
  // Gera o código escaneável (PNG) a partir da URI do Spotify
  // Exemplo: https://scannables.scdn.co/uri/plain/png/000000/white/640/spotify:track:...
  const url = `https://scannables.scdn.co/uri/plain/png/000000/white/640/${encodeURIComponent(spotifyUri)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const buf = Buffer.from(await res.arrayBuffer())
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return undefined
  }
}
