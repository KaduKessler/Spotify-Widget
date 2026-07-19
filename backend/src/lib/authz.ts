import type { FastifyReply, FastifyRequest } from 'fastify'

export function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (request.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden: admin role required' })
    return false
  }
  return true
}

export function requireAuthenticated(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.username) {
    reply.code(401).send({ error: 'Unauthorized' })
    return false
  }
  return true
}

export function requireOwnerOrAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
  targetUsername: string,
) {
  if (request.role === 'admin') return true
  if (request.username === targetUsername) return true
  reply
    .code(403)
    .send({ error: 'Forbidden: you can only access your own resources' })
  return false
}
