import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'
import { upsertUser } from '../lib/db.js' // ajuste caminho/exports

export async function registerGithubAuthRoutes(app: FastifyInstance) {
  const env = loadConfig()

  if (env.AUTH_PROVIDER !== 'github') return

  const redirectUri = `${env.APP_URL.replace(/\/$/, '')}/auth/github/callback`

  // 1) Início do login: redireciona pro GitHub
  app.get('/auth/github', async (_req, reply) => {
    const url = new URL('https://github.com/login/oauth/authorize')
    url.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', 'read:user')

    return reply.redirect(url.toString())
  })

  // 2) Callback do GitHub: troca o "code" por access_token, pega user e cria sessão
  app.get('/auth/github/callback', async (request, reply) => {
    const { code } = request.query as { code?: string }

    if (!code) {
      return reply.code(400).send({ error: 'Missing code' })
    }

    // Troca code por access_token
    const tokenRes = await fetch(
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
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'spotify-readme',
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

    // por enquanto, só usamos um id estável baseado no GitHub
    const userId = `github:${user.id}`

    upsertUser({
      id: userId,
      provider: 'github',
      username: user.login,
      avatar_url: user.avatar_url || null,
    })

    reply
      .setCookie('session', userId, {
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
