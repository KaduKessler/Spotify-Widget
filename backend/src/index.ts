import path from 'node:path'
import { pathToFileURL } from 'node:url'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import { loadConfig } from './lib/config.js'
import { importGitHubWhitelistFromEnv } from './lib/db.js'
import { registerAuthPlugin } from './plugins/auth.js'
import { registerAdminApi } from './routes/admin.js'
import { registerAdminUsersRoutes } from './routes/admin-users.js'
import { registerAdminWhitelistRoutes } from './routes/admin-whitelist.js'
import { registerAuthConfigRoute } from './routes/auth-config.js'
import { registerGithubAuthRoutes } from './routes/auth-github.js'
import { registerPasswordAuthRoutes } from './routes/auth-password.js'
import { registerSpotifyAuthRoutes } from './routes/auth-spotify.js'
import { registerMeRoute } from './routes/me.js'
import { registerSpotifyConfigRoutes } from './routes/spotify-config.js'
import spotifyDisconnectRoute from './routes/spotify-disconnect.js'
import { registerSpotifyNowPlayingRoutes } from './routes/spotify-now-playing.js'
import spotifyStatusRoute from './routes/spotify-status.js'
import { registerWidgetRoute } from './routes/widget.js'

export async function buildApp(): Promise<FastifyInstance> {
  const env = loadConfig()

  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? {
            level: 'debug',
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'HH:MM:ss',
              },
            },
          }
        : env.NODE_ENV === 'test'
          ? false
          : {
              level: 'info',
            },
  })

  // Error handler global
  app.setErrorHandler((error, request, reply) => {
    const err = error as Error & { statusCode?: number }
    const statusCode = err.statusCode || 500

    app.log.error(
      {
        err: error,
        req: { method: request.method, url: request.url },
      },
      'Request error',
    )

    // Não expor detalhes internos em produção
    const message =
      statusCode >= 500 && env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message

    reply.status(statusCode).send({
      error: err.name || 'Error',
      message,
      statusCode,
    })
  })

  // Health check endpoints
  app.get('/', async (_req, reply) => {
    return reply.redirect('/admin/')
  })

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  app.get('/ready', async () => {
    // Aqui poderia verificar DB, cache, etc
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    }
  })

  // CORS - permitir admin em domínio diferente
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? [env.APP_URL, env.ADMIN_URL] : true, // Em dev, permite qualquer origem
    credentials: true, // Permite cookies
  })

  await app.register(cookie, {
    secret: env.SESSION_SECRET,
    parseOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
    },
  })

  // Security headers via Helmet
  if (env.ENABLE_HELMET) {
    await app.register(helmet, {
      // Em desenvolvimento desativa CSP para evitar bloqueios por inline styles durante dev
      contentSecurityPolicy:
        env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: [
                  "'self'",
                  "'unsafe-inline'",
                  'https://fonts.googleapis.com',
                ],
                imgSrc: [
                  "'self'",
                  'data:',
                  'https://avatars.githubusercontent.com',
                  'https://github.com',
                  'https://i.scdn.co',
                ],
                connectSrc: ["'self'"],
              },
            }
          : false,
      // Permite desabilitar HSTS caso o proxy (ex: Nginx Proxy Manager) já adicione o header
      hsts: env.HELMET_DISABLE_HSTS
        ? false
        : { maxAge: 31536000, includeSubDomains: true },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true,
    })
  }

  // Rate limiting global (mais permissivo)
  await app.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '1 minute', // por minuto
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  })

  // Rate limiting específico para auth routes (mais restritivo)
  await app.register(
    async (authRoutes) => {
      await authRoutes.register(rateLimit, {
        max: 10, // 10 requests
        timeWindow: '5 minutes', // por 5 minutos
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too many auth attempts',
          message: 'Rate limit exceeded. Please try again later.',
        }),
      })

      await registerPasswordAuthRoutes(authRoutes)
      await registerGithubAuthRoutes(authRoutes)
    },
    { prefix: '/auth' },
  )

  await registerAuthPlugin(app)
  await registerAuthConfigRoute(app)
  await registerMeRoute(app)
  await registerSpotifyAuthRoutes(app)
  await registerSpotifyConfigRoutes(app)
  await registerSpotifyNowPlayingRoutes(app)
  await spotifyStatusRoute(app)
  await spotifyDisconnectRoute(app)
  await registerWidgetRoute(app)
  await registerAdminApi(app)
  await registerAdminUsersRoutes(app)
  await registerAdminWhitelistRoutes(app)

  // Importa whitelist do .env para o banco na inicialização
  if (
    env.ENABLE_GITHUB_AUTH &&
    env.GITHUB_WHITELIST &&
    env.GITHUB_WHITELIST.length > 0
  ) {
    const imported = await importGitHubWhitelistFromEnv(env.GITHUB_WHITELIST)
    if (imported > 0) {
      app.log.info(
        `✓ Importados ${imported} usernames do .env para whitelist GitHub`,
      )
    }
  }

  // Futuro: servir o admin (quando existir build em ../admin/dist)
  const adminDistPath = path.join(process.cwd(), '..', 'admin', 'dist')
  app.register(fastifyStatic, {
    root: adminDistPath,
    prefix: '/admin/',
  })

  return app
}

async function bootstrap() {
  const app = await buildApp()

  await app.listen({ port: 3000, host: '0.0.0.0' })
  app.log.info('Backend rodando em http://localhost:3000')

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM']
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, closing server gracefully...`)
      try {
        await app.close()
        app.log.info('Server closed successfully')
        process.exit(0)
      } catch (err) {
        app.log.error(err, 'Error during shutdown')
        process.exit(1)
      }
    })
  }
}

const isEntrypoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isEntrypoint) {
  bootstrap().catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
  })
}
