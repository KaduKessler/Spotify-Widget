import path from 'node:path'
import cookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { loadConfig } from './lib/config.js'
import { registerAuthPlugin } from './plugins/auth.js'
import { registerAdminApi } from './routes/admin.js'
import { registerAuthConfigRoute } from './routes/auth-config.js'
import { registerGithubAuthRoutes } from './routes/auth-github.js'
import { registerPasswordAuthRoutes } from './routes/auth-password.js'
import { registerMeRoute } from './routes/me.js'
import { registerWidgetRoute } from './routes/widget'

const env = loadConfig()

async function bootstrap() {
  const app = Fastify({
    logger: true,
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

  await registerAuthPlugin(app)
  await registerPasswordAuthRoutes(app)
  await registerGithubAuthRoutes(app)
  await registerAuthConfigRoute(app)
  await registerMeRoute(app)
  await registerWidgetRoute(app)
  await registerAdminApi(app)

  // Futuro: servir o admin (quando existir build em ../admin/dist)
  const adminDistPath = path.join(process.cwd(), '..', 'admin', 'dist')
  app.register(fastifyStatic, {
    root: adminDistPath,
    prefix: '/admin/',
  })

  await app.listen({ port: 3000, host: '0.0.0.0' })
  console.log('Backend rodando em http://localhost:3000')
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
