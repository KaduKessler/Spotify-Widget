import type { FastifyInstance } from 'fastify'

export async function registerMeRoute(app: FastifyInstance) {
  app.get('/api/me', async (request, reply) => {
    if (!request.userId) {
      return reply.code(401).send({ error: 'Not authenticated' })
    }

    // ID do usuário e provedor de autenticação
    return {
      id: request.userId,
      provider: 'password', // atualmente só temos password
    }
  })
}
