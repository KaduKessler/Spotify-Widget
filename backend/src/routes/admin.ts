import type { FastifyInstance } from 'fastify'
import { getConfig, updateConfig } from '../lib/db.js'

export async function registerAdminApi(app: FastifyInstance) {
  // GET /api/config
  app.get('/api/config', async (_req, reply) => {
    const config = getConfig()
    return reply.send(config)
  })

  // POST /api/config
  app.post('/api/config', async (req, reply) => {
    const body = req.body as {
      mode?: 'NOW_PLAYING' | 'FIXED_TRACK'
      track_id?: string | null
      theme?: 'dark' | 'light'
    }

    updateConfig({
      mode: body.mode ?? 'NOW_PLAYING',
      track_id: body.track_id ?? null,
      theme: body.theme ?? 'dark',
    })

    return reply.send({ ok: true })
  })
}
