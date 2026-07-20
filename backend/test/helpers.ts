import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/index.js'

export async function makeApp(): Promise<FastifyInstance> {
  return buildApp()
}

/** Loga com o admin legacy (ADMIN_USERNAME/ADMIN_PASSWORD do env de teste) e retorna o cookie de sessão. */
export async function loginAsAdmin(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    },
  })
  const cookie = res.cookies.find((c) => c.name === 'session')
  if (!cookie) throw new Error('Login de admin falhou: sem cookie de sessão')
  return `${cookie.name}=${cookie.value}`
}
