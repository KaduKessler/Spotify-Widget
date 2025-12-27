import bcrypt from 'bcrypt'
import type { FastifyInstance } from 'fastify'
import { requireAdmin } from '../lib/authz.js'
import {
  createPasswordUser,
  listUsers,
  setUserPasswordHash,
  updateUserRole,
} from '../lib/db.js'

export async function registerAdminUsersRoutes(app: FastifyInstance) {
  // Lista usuários (admin only)
  app.get('/api/admin/users', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const users = await listUsers()
    return reply.send({ users })
  })

  // Cria usuário por senha (admin only)
  app.post('/api/admin/users', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const body = req.body as {
      username?: string
      password?: string
      role?: 'admin' | 'user' | 'viewer'
    }
    const username = (body.username || '').trim()
    const password = (body.password || '').trim()
    const role = body.role || 'user'
    if (!username || !password) {
      return reply.code(400).send({ error: 'username and password required' })
    }

    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)
    try {
      const user = await createPasswordUser({
        username,
        passwordHash: hash,
        role,
      })
      return reply.send({
        ok: true,
        user: { id: user.id, username: user.username, provider: user.provider },
      })
    } catch (err) {
      app.log.error({ err }, 'Failed to create user')
      return reply.code(500).send({ error: 'Failed to create user' })
    }
  })

  // Atualiza role de usuário (admin only)
  app.put('/api/admin/users/:username/role', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const params = req.params as { username?: string }
    const body = req.body as { role?: 'admin' | 'user' | 'viewer' }
    const username = (params.username || '').trim()
    const role = body.role || 'user'
    if (!username) return reply.code(400).send({ error: 'username required' })

    const user = await updateUserRole(username, role)
    if (!user) return reply.code(404).send({ error: 'User not found' })
    return reply.send({ ok: true })
  })

  // Atualiza senha (admin only)
  app.put('/api/admin/users/:username/password', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const params = req.params as { username?: string }
    const body = req.body as { password?: string }
    const username = (params.username || '').trim()
    const password = (body.password || '').trim()
    if (!username || !password)
      return reply.code(400).send({ error: 'username and password required' })

    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)
    const user = await setUserPasswordHash(username, hash)
    if (!user) return reply.code(404).send({ error: 'User not found' })
    return reply.send({ ok: true })
  })
}
