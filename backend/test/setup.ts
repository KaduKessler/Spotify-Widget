import { afterAll, afterEach } from 'vitest'
import { prisma } from '../src/lib/db.js'

afterEach(async () => {
  await prisma.widgetConfig.deleteMany()
  await prisma.gitHubWhitelist.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
