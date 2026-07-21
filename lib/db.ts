import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "linko.db"));
// busy_timeout must be set before any other pragma/statement that can write
// (journal_mode=WAL itself writes the WAL header) — otherwise the very first
// concurrent opener to lose the race throws SQLITE_BUSY with no retry applied yet.
db.pragma("busy_timeout = 5000");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Schema/seed only runs once per db file (guarded by user_version) instead of on
// every module import. next.config.ts imports this module once up front, in the
// single main build process, before `next build` spawns its parallel workers —
// so by the time any worker gets here, migration is already done and this is
// just a cheap version read. Kept version-guarded (not just a "ran once" flag)
// so it's also correct for `next dev` and any process that imports this fresh.
const SCHEMA_VERSION = 1;
if ((db.pragma("user_version", { simple: true }) as number) < SCHEMA_VERSION) {
  runMigrations();
  db.pragma(`user_version = ${SCHEMA_VERSION}`);
}

function runMigrations() {
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    background_type TEXT NOT NULL DEFAULT 'color' CHECK (background_type IN ('image', 'color')),
    background_value TEXT NOT NULL DEFAULT '#8e93ff',
    avatar_path TEXT,
    title TEXT NOT NULL DEFAULT '',
    title_color TEXT NOT NULL DEFAULT '#1a1a1a',
    subtitle TEXT NOT NULL DEFAULT '',
    subtitle_color TEXT NOT NULL DEFAULT '#5a5d98'
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    icon TEXT,
    text TEXT NOT NULL,
    url TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#1a1a1a',
    background_color TEXT NOT NULL DEFAULT '#898ef6',
    border_color TEXT NOT NULL DEFAULT '#7e82df',
    border_width INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS social_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('github','twitter','instagram','linkedin','youtube','tiktok','other')),
    icon_color TEXT NOT NULL DEFAULT '#1a1a1a',
    text TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    ip_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_links_page_id ON links(page_id);
  CREATE INDEX IF NOT EXISTS idx_social_links_page_id ON social_links(page_id);
  CREATE INDEX IF NOT EXISTS idx_visits_page_id ON visits(page_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
`);

try {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','super'));`);
} catch (err) {
  // ponytail: try/catch en lugar de schema versioning — SQLite no soporta IF NOT EXISTS en ADD COLUMN
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}

try {
  db.exec(`ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1));`);
} catch (err) {
  // ponytail: idem role
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}

try {
  db.exec(`ALTER TABLE social_links ADD COLUMN icon TEXT;`);
} catch (err) {
  // ponytail: ícono tabler opcional para platform="other" o override
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}

// Estilo por defecto de los botones de links (a nivel page) — heredado por
// links que no marquen custom_style=1. Ídem color de ícono de redes.
try {
  db.exec(`ALTER TABLE pages ADD COLUMN link_color TEXT NOT NULL DEFAULT '#1a1a1a';`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}
try {
  db.exec(`ALTER TABLE pages ADD COLUMN link_background_color TEXT NOT NULL DEFAULT '#898ef6';`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}
try {
  db.exec(`ALTER TABLE pages ADD COLUMN link_border_color TEXT NOT NULL DEFAULT '#7e82df';`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}
try {
  db.exec(`ALTER TABLE pages ADD COLUMN link_border_width INTEGER NOT NULL DEFAULT 1;`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}
try {
  db.exec(`ALTER TABLE pages ADD COLUMN social_icon_color TEXT NOT NULL DEFAULT '#1a1a1a';`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}
try {
  db.exec(`ALTER TABLE pages ADD COLUMN social_icon_background_color TEXT NOT NULL DEFAULT '#ffffff';`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}

// Flag de override por item: 0 = hereda defaults del page, 1 = usa sus propios
// campos de estilo. Cuando 0, los campos de color/borde se guardan con los
// defaults del page para mantener las columnas NOT NULL válidas.
try {
  db.exec(`ALTER TABLE links ADD COLUMN custom_style INTEGER NOT NULL DEFAULT 0;`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}
try {
  db.exec(`ALTER TABLE social_links ADD COLUMN custom_color INTEGER NOT NULL DEFAULT 0;`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}
try {
  db.exec(`ALTER TABLE social_links ADD COLUMN icon_background_color TEXT NOT NULL DEFAULT '#ffffff';`);
} catch (err) {
  if (!(err instanceof Error && err.message.includes("duplicate column name"))) throw err;
}

const SUPER_EMAIL = process.env.LINKO_SUPER_EMAIL ?? "admin@linko.local";
const SUPER_USERNAME = process.env.LINKO_SUPER_USERNAME ?? "admin";
const SUPER_PASSWORD = process.env.LINKO_SUPER_PASSWORD ?? "linko-admin-2024";
const SUPER_HASH = bcrypt.hashSync(SUPER_PASSWORD, 10);
db.prepare(
  `INSERT OR IGNORE INTO users (email, password_hash, username, role) VALUES (?, ?, ?, 'super')`
).run(SUPER_EMAIL, SUPER_HASH, SUPER_USERNAME);
// Admin (role "super") no tiene perfil/links — sólo gestiona usuarios y ve analíticas, sin page propia.
}

export default db;
