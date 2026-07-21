import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'
import {
  getUserByUsername,
  isGitHubWhitelisted,
  upsertUser,
} from '../lib/db.js'
import { fetchWithTimeout } from '../lib/http.js'

export async function registerGithubAuthRoutes(app: FastifyInstance) {
  const env = loadConfig()

  if (!env.ENABLE_GITHUB_AUTH) return

  const redirectUri = `${env.APP_URL.replace(/\/$/, '')}/auth/github/callback`

  // 1) Início do login: redireciona pro GitHub
  app.get('/github', async (_req, reply) => {
    // Gera um `state` aleatório e armazena em cookie assinado (Double Submit Cookie)
    const state = randomBytes(16).toString('hex')
    reply.setCookie('oauth_state', state, {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 5, // 5 minutos
    })

    const url = new URL('https://github.com/login/oauth/authorize')
    url.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', 'read:user')
    url.searchParams.set('state', state)

    return reply.redirect(url.toString())
  })

  // 2) Callback do GitHub: troca o "code" por access_token, pega user e cria sessão
  app.get('/github/callback', async (request, reply) => {
    const { code, state } = request.query as { code?: string; state?: string }

    if (!code) {
      return reply.code(400).send({ error: 'Missing code' })
    }

    // Valida o `state` contra o cookie assinado
    const rawStateCookie = request.cookies.oauth_state
    const unsign = rawStateCookie
      ? reply.unsignCookie(rawStateCookie)
      : { valid: false, value: '' }
    if (!state || !unsign.valid || !unsign.value) {
      return reply.code(400).send({ error: 'Invalid state' })
    }
    const a = Buffer.from(state)
    const b = Buffer.from(unsign.value)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return reply.code(400).send({ error: 'Invalid state' })
    }
    // Limpa o cookie de state
    reply.clearCookie('oauth_state', { path: '/' })

    // Troca code por access_token
    const tokenRes = await fetchWithTimeout(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      },
    )

    if (!tokenRes.ok) {
      console.error('GitHub token error:', tokenRes.status)
      return reply.code(500).send({ error: 'GitHub token request failed' })
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token?: string
      error?: string
    }

    if (!tokenJson.access_token) {
      console.error('GitHub token response:', tokenJson)
      return reply.code(500).send({ error: 'No access_token from GitHub' })
    }

    const accessToken = tokenJson.access_token

    // Busca dados do usuário
    const userRes = await fetchWithTimeout('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'spotify-widget',
      },
    })

    if (!userRes.ok) {
      console.error('GitHub user error:', userRes.status)
      return reply.code(500).send({ error: 'GitHub user request failed' })
    }

    const user = (await userRes.json()) as {
      id: number
      login: string
      avatar_url?: string
    }

    // Políticas de registro: só bloqueiam signup novo, não login de quem já tem conta
    const existingUser = await getUserByUsername(user.login)
    if (!existingUser && env.REGISTRATION_POLICY === 'closed') {
      return reply.code(403).send({ error: 'Registrations are closed' })
    }
    if (!existingUser && env.REGISTRATION_POLICY === 'invite_only') {
      return reply.code(403).send({ error: 'Invite required' })
    }
    if (env.REGISTRATION_POLICY === 'github_whitelist') {
      // Verifica whitelist: primeiro banco, depois .env (para compatibilidade)
      const inDatabaseWhitelist = await isGitHubWhitelisted(user.login)
      const inEnvWhitelist = Array.isArray(env.GITHUB_WHITELIST)
        ? env.GITHUB_WHITELIST.includes(user.login)
        : false

      if (!inDatabaseWhitelist && !inEnvWhitelist) {
        return reply
          .code(403)
          .send({ error: 'Not allowed by GitHub whitelist' })
      }
    }

    // Garante presença do usuário no banco (username único)
    const role = (env.ADMIN_USERS || []).includes(user.login) ? 'admin' : 'user'
    await upsertUser({
      provider: 'github',
      username: user.login,
      avatarUrl: user.avatar_url || null,
      role,
    })

    reply
      // Armazena username e role na sessão
      .setCookie('session', `${user.login}:${role}`, {
        signed: true,
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        path: '/',
      })
      // volta pro admin
      .redirect(`${env.ADMIN_URL.replace(/\/$/, '')}/`)
  })
}
