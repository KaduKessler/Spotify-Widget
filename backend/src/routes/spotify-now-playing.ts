import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/db.js'
import { fetchWithTimeout } from '../lib/http.js'

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  uri: string
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
  if (
    !user.spotifyRefreshToken ||
    !user.spotifyClientId ||
    !user.spotifyClientSecret
  ) {
    return null
  }

  const tokenUrl = 'https://accounts.spotify.com/api/token'
  const basicAuth = Buffer.from(
    `${user.spotifyClientId}:${user.spotifyClientSecret}`,
  ).toString('base64')

  try {
    const response = await fetchWithTimeout(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
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

async function getValidAccessToken(
  userId: number,
  app: FastifyInstance,
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      spotifyAccessToken: true,
      spotifyRefreshToken: true,
      spotifyTokenExpiresAt: true,
      spotifyClientId: true,
      spotifyClientSecret: true,
    },
  })

  if (
    !user ||
    !user.spotifyAccessToken ||
    !user.spotifyRefreshToken ||
    !user.spotifyClientId ||
    !user.spotifyClientSecret
  ) {
    return null
  }

  if (user.spotifyTokenExpiresAt && user.spotifyTokenExpiresAt < new Date()) {
    return refreshSpotifyToken(user, app)
  }

  return user.spotifyAccessToken
}

// Aceita spotify:track:ID, URLs open.spotify.com (com ou sem locale/query) ou id puro
function extractTrackId(input: string): string | null {
  const trimmed = input.trim()

  const uriMatch = trimmed.match(/^spotify:track:([a-zA-Z0-9]+)$/)
  if (uriMatch?.[1]) return uriMatch[1]

  const urlMatch = trimmed.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/,
  )
  if (urlMatch?.[1]) return urlMatch[1]

  if (/^[a-zA-Z0-9]+$/.test(trimmed)) return trimmed

  return null
}

type TrackDetails = {
  id: string
  name: string
  artists: string[]
  album: string
  albumArt: string | null
  uri: string
  url: string
}

// Cache de faixas consultadas (modo Track fixa): o /widget é público e pode
// ser batido a cada refresh de README/página, mas uma faixa fixa não muda
// sozinha. Chave por trackId (não por usuário): o catálogo do Spotify é o
// mesmo dado pra qualquer um que consulte a mesma faixa.
const TRACK_DETAILS_CACHE_TTL_MS = 60 * 60 * 1000
const trackDetailsCache = new Map<
  string,
  { data: TrackDetails; expiresAt: number }
>()

export async function getTrackDetailsForUser(
  userId: number,
  trackId: string,
  app: FastifyInstance,
): Promise<TrackDetails | null> {
  const id = extractTrackId(trackId)
  if (!id) return null

  const cached = trackDetailsCache.get(id)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const accessToken = await getValidAccessToken(userId, app)
  if (!accessToken) return null

  try {
    const response = await fetchWithTimeout(
      `https://api.spotify.com/v1/tracks/${id}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    if (!response.ok) return null

    const track = (await response.json()) as SpotifyTrack
    const details: TrackDetails = {
      id: track.id,
      name: track.name,
      artists: track.artists.map((a) => a.name),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || null,
      uri: track.uri,
      url: track.external_urls.spotify,
    }
    trackDetailsCache.set(id, {
      data: details,
      expiresAt: Date.now() + TRACK_DETAILS_CACHE_TTL_MS,
    })
    return details
  } catch (err) {
    app.log.error({ err, trackId }, 'Failed to fetch track details')
    return null
  }
}

type NowPlayingResult = {
  isPlaying: boolean
  track: {
    id: string
    name: string
    artists: string[]
    album: string
    albumArt: string | null
    uri: string
    url: string
  }
  lastPlayedAt?: string
} | null

// Cache curto em memória: evita bater na API do Spotify duas vezes
// (preview do widget + card de now-playing do admin) pro mesmo evento
// de atualização, que costumam disparar quase simultaneamente.
const NOW_PLAYING_CACHE_TTL_MS = 3000
const nowPlayingCache = new Map<
  number,
  { data: NowPlayingResult; expiresAt: number }
>()

export async function getNowPlayingForUser(
  userId: number,
  app: FastifyInstance,
): Promise<NowPlayingResult> {
  const cached = nowPlayingCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const result = await fetchNowPlayingForUser(userId, app)
  nowPlayingCache.set(userId, {
    data: result,
    expiresAt: Date.now() + NOW_PLAYING_CACHE_TTL_MS,
  })
  return result
}

async function fetchNowPlayingForUser(
  userId: number,
  app: FastifyInstance,
): Promise<NowPlayingResult> {
  const accessToken = await getValidAccessToken(userId, app)
  if (!accessToken) return null

  // Tenta buscar a música atual
  const currentlyPlayingResponse = await fetchWithTimeout(
    'https://api.spotify.com/v1/me/player/currently-playing',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (currentlyPlayingResponse.status === 200) {
    const data =
      (await currentlyPlayingResponse.json()) as CurrentlyPlayingResponse

    if (data.is_playing && data.item) {
      const track = data.item
      return {
        isPlaying: true,
        track: {
          id: track.id,
          name: track.name,
          artists: track.artists.map((a) => a.name),
          album: track.album.name,
          albumArt: track.album.images[0]?.url || null,
          uri: track.uri,
          url: track.external_urls.spotify,
        },
      }
    }
  }

  // Fallback: busca a última música tocada
  const recentlyPlayedResponse = await fetchWithTimeout(
    'https://api.spotify.com/v1/me/player/recently-played?limit=1',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
            uri: track.uri,
            url: track.external_urls.spotify,
          },
          lastPlayedAt: item.played_at,
        }
      }
    }
  }

  return null
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
      const currentlyPlayingResponse = await fetchWithTimeout(
        'https://api.spotify.com/v1/me/player/currently-playing',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      if (currentlyPlayingResponse.status === 200) {
        const data =
          (await currentlyPlayingResponse.json()) as CurrentlyPlayingResponse

        if (data.is_playing && data.item) {
          return {
            isPlaying: true,
            track: {
              id: data.item.id,
              name: data.item.name,
              artists: data.item.artists.map((a) => a.name),
              album: data.item.album.name,
              albumArt: data.item.album.images[0]?.url || null,
              uri: data.item.uri,
              url: data.item.external_urls.spotify,
            },
          }
        }
      }

      // Se não está tocando nada, busca recently played
      const recentlyPlayedResponse = await fetchWithTimeout(
        'https://api.spotify.com/v1/me/player/recently-played?limit=1',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      if (recentlyPlayedResponse.status === 200) {
        const data =
          (await recentlyPlayedResponse.json()) as RecentlyPlayedResponse

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
                uri: track.uri,
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
