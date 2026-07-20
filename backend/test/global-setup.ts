import { execSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import path from 'node:path'

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test.sqlite')

export async function setup() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const file = `${TEST_DB_PATH}${suffix}`
    if (existsSync(file)) unlinkSync(file)
  }

  execSync('pnpm exec prisma migrate deploy', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: 'file:./data/test.sqlite',
    },
  })
}
