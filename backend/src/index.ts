import path from 'node:path'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { registerAdminApi } from './routes/admin.js'
import { registerWidgetRoute } from './routes/widget'

async function bootstrap() {
  const app = Fastify({
    logger: true,
  })

  // Rota do widget SVG
  await registerWidgetRoute(app)

  // Rotas da API admin
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
