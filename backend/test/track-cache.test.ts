import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma, upsertConfig } from '../src/lib/db.js'
import { makeApp } from './helpers.js'

async function createFixedTrackUser(username: string, trackId: string) {
  const user = await prisma.user.create({
    data: {
      provider: 'password',
      username,
      role: 'user',
      spotifyClientId: 'client-id',
      spotifyClientSecret: 'client-secret',
      spotifyAccessToken: 'access-token',
      spotifyRefreshToken: 'refresh-token',
      spotifyTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })
  await upsertConfig(user.id, {
    mode: 'FIXED_TRACK',
    trackId,
    theme: 'dark',
    exposeNowPlaying: true,
  })
  return user
}

function stubSpotifyTrackApi(trackId: string) {
  let calls = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL) => {
      const u = url.toString()
      if (u.includes('api.spotify.com/v1/tracks/')) {
        calls++
        return new Response(
          JSON.stringify({
            id: trackId,
            name: 'Uma Música',
            artists: [{ name: 'Uma Banda' }],
            album: { name: 'Um Álbum', images: [] },
            uri: `spotify:track:${trackId}`,
            external_urls: {
              spotify: `https://open.spotify.com/track/${trackId}`,
            },
          }),
          { status: 200 },
        )
      }
      return new Response(null, { status: 404 })
    }),
  )
  return () => calls
}

describe('Cache de detalhes de faixa fixa (/widget)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
    vi.unstubAllGlobals()
  })

  it('só chama a API do Spotify uma vez pra múltiplos fetches da mesma faixa', async () => {
    const trackId = `track${Date.now()}`
    const getCallCount = stubSpotifyTrackApi(trackId)
    await createFixedTrackUser('fixedtrackuser', trackId)

    const first = await app.inject({
      method: 'GET',
      url: '/widget?user=fixedtrackuser',
    })
    const second = await app.inject({
      method: 'GET',
      url: '/widget?user=fixedtrackuser',
    })

    expect(first.statusCode).toBe(200)
    expect(second.statusCode).toBe(200)
    expect(first.body).toContain('Uma Música')
    expect(second.body).toContain('Uma Música')
    expect(getCallCount()).toBe(1)
  })
})
