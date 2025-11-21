import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const dataDir = path.join(process.cwd(), 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'db.sqlite')
const db = new Database(dbPath)

// Cria tabela widget_config se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS widget_config (
    id INTEGER PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'NOW_PLAYING',
    track_id TEXT,
    theme TEXT NOT NULL DEFAULT 'dark'
  );
`)

// Garante um registro único com id = 1
db.exec(`
  INSERT OR IGNORE INTO widget_config (id, mode, theme)
  VALUES (1, 'NOW_PLAYING', 'dark');
`)

export type WidgetConfig = {
  id: number
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  track_id: string | null
  theme: 'dark' | 'light'
}

export function getConfig(): WidgetConfig {
  const row = db
    .prepare('SELECT id, mode, track_id, theme FROM widget_config WHERE id = 1')
    .get() as WidgetConfig

  return row
}

export function updateConfig({
  mode,
  track_id,
  theme,
}: {
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  track_id: string | null
  theme: 'dark' | 'light'
}) {
  db.prepare(
    `
    UPDATE widget_config
    SET mode = ?, track_id = ?, theme = ?
    WHERE id = 1
  `,
  ).run(mode, track_id, theme)
}

// Cria tabela users se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    username TEXT,
    avatar_url TEXT,
    updated_at INTEGER
  );
`)

export type User = {
  id: string
  provider: string
  username?: string | null
  avatar_url?: string | null
  updated_at?: number | null
}

export function upsertUser(user: {
  id: string
  provider: string
  username?: string | null
  avatar_url?: string | null
}) {
  const now = Date.now()
  db.prepare(
    `INSERT INTO users (id, provider, username, avatar_url, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       username = excluded.username,
       avatar_url = excluded.avatar_url,
       updated_at = excluded.updated_at;
    `,
  ).run(
    user.id,
    user.provider,
    user.username || null,
    user.avatar_url || null,
    now,
  )
}

export function getUserById(id: string): User | undefined {
  const row = db
    .prepare(
      'SELECT id, provider, username, avatar_url, updated_at FROM users WHERE id = ?',
    )
    .get(id)
  return row as User | undefined
}
