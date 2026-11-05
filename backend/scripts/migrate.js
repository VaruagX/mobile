#!/usr/bin/env node
'use strict';
/**
 * Varuag OS migration runner (forward-only, raw SQL, `pg`).
 *
 *   npm run migrate:plan      Offline. Lists migration files and checksums. Never connects.
 *   npm run migrate:status    Read-only. Shows which migrations are applied / pending.
 *   npm run migrate -- --yes  Applies pending migrations. Refuses to run without --yes.
 *
 * Safety:
 *  - Each migration runs in its own transaction with a transaction-level advisory lock,
 *    so two runners can never apply the same file twice (works through Neon's pooler).
 *  - Applied files are checksummed; editing an applied file stops the runner.
 *  - Refuses to touch a database that already has Varuag tables but no Varuag OS history
 *    (for example the legacy Varuag Labs database). Use a new, empty Neon database or branch.
 *  - There are no down migrations and nothing here drops or truncates data.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const HISTORY_TABLE = 'vos_schema_migrations';
const LOCK_KEY = 4_815_162_342; // fixed bigint advisory-lock id for this runner
const GUARDED_TABLES = ['users', 'clients', 'projects', 'milestones', 'tasks', 'invoices', 'payments'];

const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

function loadMigrations() {
  const names = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return names.map((name, index) => {
    if (!/^\d{3}_[a-z0-9_]+\.sql$/.test(name)) {
      throw new Error(`Bad migration file name "${name}" (expected 001_description.sql).`);
    }
    const number = Number(name.slice(0, 3));
    if (number !== index + 1) {
      throw new Error(`Migration numbering must be continuous; "${name}" should be number ${index + 1}.`);
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)\s*;/im.test(sql)) {
      throw new Error(`"${name}" must not contain BEGIN/COMMIT; the runner manages transactions.`);
    }
    return { name, sql, checksum: sha256(sql) };
  });
}

function plan() {
  const migrations = loadMigrations();
  console.log(`Migrations in ${path.relative(process.cwd(), MIGRATIONS_DIR) || MIGRATIONS_DIR}:`);
  for (const m of migrations) console.log(`  ${m.name}  sha256:${m.checksum.slice(0, 12)}`);
  console.log(`\n${migrations.length} file(s). No database connection was made.`);
}

async function historyExists(client) {
  const { rows } = await client.query('SELECT to_regclass($1) IS NOT NULL AS present', [HISTORY_TABLE]);
  return rows[0].present;
}

async function assertSafeTarget(client) {
  if (await historyExists(client)) return;
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = current_schema() AND table_name = ANY($1::text[])
     ORDER BY table_name`,
    [GUARDED_TABLES]
  );
  if (rows.length) {
    throw new Error(
      `Refusing to continue: this database already has ${rows.map((r) => r.table_name).join(', ')} ` +
        `but no ${HISTORY_TABLE} table. It looks like another application's database (for example the ` +
        'legacy Varuag Labs app). Point DATABASE_URL at a new, empty Neon database or branch.'
    );
  }
}

async function readApplied(client) {
  if (!(await historyExists(client))) return new Map();
  const { rows } = await client.query(`SELECT name, checksum, applied_at FROM ${HISTORY_TABLE} ORDER BY name`);
  return new Map(rows.map((r) => [r.name, r]));
}

function verifyHistory(migrations, applied) {
  const files = new Map(migrations.map((m) => [m.name, m]));
  for (const [name, row] of applied) {
    const file = files.get(name);
    if (!file) throw new Error(`Applied migration "${name}" is missing from the migrations folder.`);
    if (file.checksum !== row.checksum) {
      throw new Error(`Applied migration "${name}" was edited after it ran. Add a new migration instead.`);
    }
  }
  return migrations.filter((m) => !applied.has(m.name));
}

async function status() {
  const db = require('../src/config/db');
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN READ ONLY');
    await assertSafeTarget(client);
    const migrations = loadMigrations();
    const applied = await readApplied(client);
    await client.query('ROLLBACK');
    const pending = verifyHistory(migrations, applied);
    for (const m of migrations) {
      const row = applied.get(m.name);
      console.log(`  ${row ? 'applied ' : 'PENDING '} ${m.name}${row ? `  (${row.applied_at.toISOString()})` : ''}`);
    }
    console.log(`\n${applied.size} applied, ${pending.length} pending. Nothing was changed.`);
  } finally {
    client.release();
    await db.close();
  }
}

async function up() {
  if (!process.argv.includes('--yes')) {
    plan();
    console.log('\nNot applied. Re-run with --yes to apply pending migrations: npm run migrate -- --yes');
    process.exitCode = 1;
    return;
  }

  const db = require('../src/config/db');
  const client = await db.getPool().connect();
  let appliedCount = 0;
  try {
    await assertSafeTarget(client);
    const migrations = loadMigrations();

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${HISTORY_TABLE} (
        name        text PRIMARY KEY,
        checksum    text NOT NULL,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )`);

    const pending = verifyHistory(migrations, await readApplied(client));
    if (!pending.length) {
      console.log('Database is up to date. Applied 0 migrations.');
      return;
    }

    for (const m of pending) {
      await client.query('BEGIN');
      try {
        await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEY]);
        await client.query("SET LOCAL lock_timeout = '10s'");
        await client.query("SET LOCAL statement_timeout = '120s'");
        const again = await client.query(`SELECT 1 FROM ${HISTORY_TABLE} WHERE name = $1`, [m.name]);
        if (again.rowCount) {
          await client.query('ROLLBACK');
          console.log(`  skip  ${m.name} (applied by another runner)`);
          continue;
        }
        await client.query(m.sql);
        await client.query(`INSERT INTO ${HISTORY_TABLE} (name, checksum) VALUES ($1, $2)`, [m.name, m.checksum]);
        await client.query('COMMIT');
        appliedCount += 1;
        console.log(`  apply ${m.name}`);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new Error(`${m.name} failed and was rolled back: ${err.message}`);
      }
    }
    console.log(`\nApplied ${appliedCount} migration(s).`);
  } finally {
    client.release();
    await db.close();
  }
}

const command = process.argv[2] || 'plan';
const commands = { plan: async () => plan(), status, up };

if (!commands[command]) {
  console.error(`Unknown command "${command}". Use: plan | status | up --yes`);
  process.exit(1);
}

commands[command]().catch((err) => {
  console.error(`\nMigration error: ${err.message}`);
  process.exit(1);
});
