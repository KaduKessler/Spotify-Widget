import type { FastifyInstance } from 'fastify'
import { requireAdmin } from '../lib/authz.js'
import {
  addToGitHubWhitelist,
  getGitHubWhitelistEntry,
  isGitHubWhitelisted,
  isValidGitHubUsername,
  listGitHubWhitelist,
  removeFromGitHubWhitelist,
  validateGitHubUserExists,
} from '../lib/db.js'

export async function registerAdminWhitelistRoutes(app: FastifyInstance) {
  // Lista whitelist GitHub (admin only)
  app.get('/api/admin/whitelist', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const whitelist = await listGitHubWhitelist()
    return reply.send({ whitelist })
  })

  // Adiciona username à whitelist (admin only)
  app.post('/api/admin/whitelist', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const body = req.body as {
      username?: string
      note?: string
      validateGithub?: boolean
    }
    const username = (body.username || '').trim()

    if (!username) {
      return reply.code(400).send({ error: 'username_required', message: 'Username é obrigatório' })
    }

    // Valida padrão do username
    if (!isValidGitHubUsername(username)) {
      return reply.code(400).send({
        error: 'invalid_username_format',
        message: 'Username deve ter 1-39 caracteres e conter apenas letras, números e hífen'
      })
    }

    // Verifica se já existe ativo
    const existing = await getGitHubWhitelistEntry(username)
    if (existing && !existing.removedAt) {
      return reply.code(409).send({
        error: 'username_already_exists',
        message: 'Username já está na whitelist'
      })
    }

    // Validar existência no GitHub se solicitado
    if (body.validateGithub) {
      const exists = await validateGitHubUserExists(username)
      if (!exists) {
        return reply.code(400).send({
          error: 'github_user_not_found',
          message: `Username ${username} não encontrado no GitHub`
        })
      }
    }

    try {
      const entry = await addToGitHubWhitelist(
        username,
        req.username || 'unknown',
        body.note || undefined,
      )
      const wasReactivated = existing?.removedAt
      return reply.send({ ok: true, entry, reactivated: wasReactivated })
    } catch (err) {
      app.log.error({ err }, 'Failed to add to whitelist')
      return reply.code(500).send({
        error: 'add_failed',
        message: 'Falha ao adicionar à whitelist'
      })
    }
  })

  // Remove username da whitelist (admin only)
  app.delete('/api/admin/whitelist/:username', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const params = req.params as { username?: string }
    const username = (params.username || '').trim()
    if (!username) {
      return reply.code(400).send({
        error: 'username_required',
        message: 'Username é obrigatório'
      })
    }

    const existing = await getGitHubWhitelistEntry(username)
    if (!existing) {
      return reply.code(404).send({
        error: 'not_found',
        message: 'Username não encontrado na whitelist'
      })
    }

    if (existing.removedAt) {
      return reply.code(404).send({
        error: 'already_removed',
        message: 'Username já foi removido da whitelist'
      })
    }

    const success = await removeFromGitHubWhitelist(username, req.username || 'unknown')
    if (!success) {
      return reply.code(500).send({
        error: 'remove_failed',
        message: 'Falha ao remover da whitelist'
      })
    }

    return reply.send({ ok: true })
  })

  // Adiciona múltiplos usernames em lote (admin only)
  app.post('/api/admin/whitelist/batch', async (req, reply) => {
    if (!requireAdmin(req, reply)) return
    const body = req.body as {
      usernames?: string[]
      validateGithub?: boolean
      skipErrors?: boolean
    }

    const usernames = body.usernames || []
    if (!Array.isArray(usernames) || usernames.length === 0) {
      return reply.code(400).send({
        error: 'empty_list',
        message: 'Lista de usernames não pode estar vazia'
      })
    }

    if (usernames.length > 100) {
      return reply.code(400).send({
        error: 'too_many',
        message: 'Máximo de 100 usernames por lote'
      })
    }

    const results = {
      added: [] as string[],
      errors: [] as Array<{ username: string; error: string; message: string }>,
    }

    for (const u of usernames) {
      const username = u.trim()
      if (!username) continue

      if (!isValidGitHubUsername(username)) {
        results.errors.push({
          username,
          error: 'invalid_format',
          message: 'Formato inválido',
        })
        if (!body.skipErrors) continue
        continue
      }

      if (body.validateGithub) {
        const exists = await validateGitHubUserExists(username)
        if (!exists) {
          results.errors.push({
            username,
            error: 'github_not_found',
            message: 'Não encontrado no GitHub',
          })
          if (!body.skipErrors) continue
          continue
        }
      }

      try {
        await addToGitHubWhitelist(
          username,
          req.username || 'unknown',
          'Adicionado em lote',
        )
        results.added.push(username)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage === 'USERNAME_ALREADY_EXISTS') {
          results.errors.push({
            username,
            error: 'already_exists',
            message: 'Já está na whitelist',
          })
        } else {
          results.errors.push({
            username,
            error: 'add_failed',
            message: 'Falha ao adicionar',
          })
        }
      }
    }

    return reply.send({
      ok: true,
      added: results.added.length,
      errors: results.errors.length,
      results,
    })
  })

  // Verifica se username está na whitelist (público, útil para frontend)
  app.get('/api/whitelist/:username', async (req, reply) => {
    const params = req.params as { username?: string }
    const username = (params.username || '').trim()
    if (!username) {
      return reply.code(400).send({ error: 'username_required' })
    }

    const whitelisted = await isGitHubWhitelisted(username)
    return reply.send({ whitelisted })
  })
}
