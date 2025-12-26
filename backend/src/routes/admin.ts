import type { FastifyInstance } from 'fastify'
import {
  getConfigByUserId,
  getUserByUsername,
  upsertConfig,
} from '../lib/db.js'

export async function registerAdminApi(app: FastifyInstance) {
  // GET /api/config (por-usuário)
  app.get('/api/config', async (req, reply) => {
    const username = req.username
    if (!username) return reply.code(401).send({ error: 'Not authenticated' })

    const user = await getUserByUsername(username)
    if (!user) return reply.code(404).send({ error: 'User not found' })

    const config = await getConfigByUserId(user.id)
    return reply.send(
      config ?? {
        id: 0,
        userId: user.id,
        mode: 'NOW_PLAYING',
        trackId: null,
        theme: 'dark',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    )
  })

  // POST /api/config (por-usuário)
  app.post('/api/config', async (req, reply) => {
    const username = req.username
    if (!username) return reply.code(401).send({ error: 'Not authenticated' })

    const body = req.body as {
      mode?: 'NOW_PLAYING' | 'FIXED_TRACK'
      track_id?: string | null
      theme?: 'dark' | 'light'
    }

    const user = await getUserByUsername(username)
    if (!user) return reply.code(404).send({ error: 'User not found' })

    await upsertConfig(user.id, {
      mode: body.mode ?? 'NOW_PLAYING',
      trackId: body.track_id ?? null,
      theme: body.theme ?? 'dark',
    })

    return reply.send({ ok: true })
  })
}
