import type { FastifyInstance } from 'fastify'
import { loadConfig } from '../lib/config.js'

export async function registerAuthConfigRoute(app: FastifyInstance) {
  const env = loadConfig()

  app.get('/api/auth-config', async () => {
    const providers: string[] = []

    if (env.ENABLE_PASSWORD_AUTH) providers.push('password')
    if (env.ENABLE_GITHUB_AUTH) providers.push('github')
    if (env.ENABLE_NONE_AUTH) providers.push('none')

    return { providers }
  })
}
