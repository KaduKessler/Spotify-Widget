import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/db.js'

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  external_urls: {
    spotify: string
  }
}

interface CurrentlyPlayingResponse {
  is_playing: boolean
  item?: SpotifyTrack
}

interface RecentlyPlayedResponse {
  items: {
    track: SpotifyTrack
    played_at: string
  }[]
}

async function refreshSpotifyToken(
  user: {
    id: number
    spotifyClientId: string | null
    spotifyClientSecret: string | null
    spotifyRefreshToken: string | null
  },
  app: FastifyInstance,
): Promise<string | null> {
  if (!user.spotifyRefreshToken || !user.spotifyClientId || !user.spotifyClientSecret) {
    return null
  }

  const tokenUrl = 'https://accounts.spotify.com/api/token'
  const basicAuth = Buffer.from(
    `${user.spotifyClientId}:${user.spotifyClientSecret}`,
  ).toString('base64')

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.spotifyRefreshToken,
      }),
    })

    if (!response.ok) {
      app.log.error('Failed to refresh Spotify token')
      return null
    }

    const data = (await response.json()) as {
      access_token: string
      expires_in: number
    }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        spotifyAccessToken: data.access_token,
        spotifyTokenExpiresAt: expiresAt,
      },
    })

    return data.access_token
  } catch (err) {
    app.log.error({ err }, 'Error refreshing Spotify token')
    return null
  }
}

export async function registerSpotifyNowPlayingRoutes(app: FastifyInstance) {
  app.get('/api/spotify/now-playing', async (request, reply) => {
    const username = request.username
    if (!username) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        spotifyAccessToken: true,
        spotifyRefreshToken: true,
        spotifyTokenExpiresAt: true,
        spotifyClientId: true,
        spotifyClientSecret: true,
      },
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    if (!user.spotifyAccessToken || !user.spotifyRefreshToken) {
      return reply.status(400).send({
        error: 'Spotify not connected',
        message: 'Please connect your Spotify account first',
      })
    }

    let accessToken = user.spotifyAccessToken

    // Verifica se o token expirou
    if (user.spotifyTokenExpiresAt && user.spotifyTokenExpiresAt < new Date()) {
      app.log.info({ username }, 'Spotify token expired, refreshing...')
      const newToken = await refreshSpotifyToken(user, app)
      if (!newToken) {
        return reply.status(401).send({
          error: 'Token refresh failed',
          message: 'Please reconnect your Spotify account',
        })
      }
      accessToken = newToken
    }

    try {
      // Tenta buscar currently playing
      const currentlyPlayingResponse = await fetch(
        'https://api.spotify.com/v1/me/player/currently-playing',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      )

      if (currentlyPlayingResponse.status === 200) {
        const data = (await currentlyPlayingResponse.json()) as CurrentlyPlayingResponse

        if (data.is_playing && data.item) {
          return {
            isPlaying: true,
            track: {
              id: data.item.id,
              name: data.item.name,
              artists: data.item.artists.map((a) => a.name),
              album: data.item.album.name,
              albumArt: data.item.album.images[0]?.url || null,
              url: data.item.external_urls.spotify,
            },
          }
        }
      }

      // Se não está tocando nada, busca recently played
      const recentlyPlayedResponse = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=1',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      )

      if (recentlyPlayedResponse.status === 200) {
        const data = (await recentlyPlayedResponse.json()) as RecentlyPlayedResponse

        if (data.items && data.items.length > 0) {
          const item = data.items[0]
          if (item?.track) {
            const track = item.track
            return {
              isPlaying: false,
              track: {
                id: track.id,
                name: track.name,
                artists: track.artists.map((a) => a.name),
                album: track.album.name,
                albumArt: track.album.images[0]?.url || null,
                url: track.external_urls.spotify,
              },
              lastPlayedAt: item.played_at,
            }
          }
        }
      }

      return {
        isPlaying: false,
        track: null,
        message: 'No track found',
      }
    } catch (err) {
      app.log.error({ err }, 'Error fetching Spotify now playing')
      return reply.status(500).send({
        error: 'Failed to fetch now playing',
      })
    }
  })
}
