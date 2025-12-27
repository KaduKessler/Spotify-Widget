import type { FastifyInstance } from 'fastify'
import { getUserByUsername, prisma } from '../lib/db.js'

export async function registerSpotifyAuthRoutes(app: FastifyInstance) {
  // Inicia o fluxo OAuth do Spotify
  app.get('/auth/spotify', async (request, reply) => {
    // Verifica sessão manualmente (pois /auth/* é público no auth plugin)
    const raw = request.cookies.session
    if (!raw) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Not logged in' })
    }

    const unsign = reply.unsignCookie(raw)
    if (!unsign.valid || !unsign.value) {
      return reply.status(401).send({ error: 'Invalid session' })
    }

    const username = unsign.value

    const user = await getUserByUsername(username)
    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    // Verifica se o usuário tem credenciais configuradas
    if (!user.spotifyClientId || !user.spotifyClientSecret) {
      return reply.status(400).send({
        error: 'Spotify credentials not configured',
        message: 'Please configure your Spotify Client ID and Secret first',
      })
    }

    // Gera state para CSRF protection
    const state = Buffer.from(JSON.stringify({ username })).toString('base64url')

    // Salva state no cookie
    reply.setCookie('spotify_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 5, // 5 minutos
      path: '/',
    })

    // Scopes necessários para buscar now playing
    const scopes = ['user-read-currently-playing', 'user-read-recently-played']
    const redirectUri = `${process.env.APP_URL || 'http://127.0.0.1:3000'}/auth/spotify/callback`

    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.set('client_id', user.spotifyClientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('state', state)

    reply.redirect(authUrl.toString())
  })

  // Callback do OAuth do Spotify
  app.get('/auth/spotify/callback', async (request, reply) => {
    const { code, state, error } = request.query as {
      code?: string
      state?: string
      error?: string
    }

    if (error) {
      app.log.warn({ error }, 'Spotify OAuth error')
      return reply.redirect('/admin?spotify_error=access_denied')
    }

    if (!code || !state) {
      return reply.status(400).send({ error: 'Missing code or state' })
    }

    // Valida state (CSRF protection)
    const cookieState = request.cookies.spotify_oauth_state
    if (!cookieState || cookieState !== state) {
      return reply.status(400).send({ error: 'Invalid state parameter' })
    }

    // Limpa cookie de state
    reply.clearCookie('spotify_oauth_state')

    // Decodifica state para pegar username
    const { username } = JSON.parse(Buffer.from(state, 'base64url').toString())

    const user = await getUserByUsername(username)
    if (!user || !user.spotifyClientId || !user.spotifyClientSecret) {
      return reply.status(400).send({ error: 'Invalid user or missing credentials' })
    }

    // Troca code por access token
    const redirectUri = `${process.env.APP_URL || 'http://127.0.0.1:3000'}/auth/spotify/callback`
    const tokenUrl = 'https://accounts.spotify.com/api/token'

    const basicAuth = Buffer.from(
      `${user.spotifyClientId}:${user.spotifyClientSecret}`,
    ).toString('base64')

    try {
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        app.log.error({ error: errorData }, 'Failed to exchange code for token')
        return reply.redirect('/admin?spotify_error=token_exchange_failed')
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string
        token_type: string
        scope: string
        expires_in: number
        refresh_token: string
      }

      // Salva tokens no banco
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          spotifyAccessToken: tokenData.access_token,
          spotifyRefreshToken: tokenData.refresh_token,
          spotifyTokenExpiresAt: expiresAt,
        },
      })

      app.log.info({ username }, 'Spotify OAuth successful')

      // Redireciona de volta para o admin (frontend)
      const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'
      return reply.redirect(`${frontendUrl}?spotify_success=true`)
    } catch (err) {
      app.log.error({ err }, 'Error during Spotify OAuth')
      const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'
      return reply.redirect(`${frontendUrl}?spotify_error=unknown`)
    }
  })
}
