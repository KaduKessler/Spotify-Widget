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
