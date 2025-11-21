import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'

export async function registerAuthConfigRoute(app: FastifyInstance) {
  const env = loadConfig()

  app.get('/api/auth-config', async () => {
    return { provider: env.AUTH_PROVIDER }
  })
}
