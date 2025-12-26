import type { FastifyInstance } from 'fastify'
import {
  getConfigByUserId,
  getUserByUsername,
  upsertConfig,
} from '../lib/db.js'
import { parseWidgetConfig } from '../lib/validation.js'

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

    // Validar input com Zod
    const validation = parseWidgetConfig(req.body)
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error })
    }

    const user = await getUserByUsername(username)
    if (!user) return reply.code(404).send({ error: 'User not found' })

    await upsertConfig(user.id, validation.data)

    return reply.send({ ok: true })
  })
}
