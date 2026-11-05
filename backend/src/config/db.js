'use strict';
/**
 * PostgreSQL connection module (Neon). The only place the backend talks to the database.
 *
 * - The connection string is read from process.env.DATABASE_URL via ./env; never hard-coded.
 * - The pool is created lazily on first use, so requiring this file does not connect.
 * - TLS follows the connection string (Neon URLs carry sslmode=require).
 * - Connection details are never logged.
 */
const { Pool } = require('pg');
const { env, assertDatabaseConfigured } = require('./env');

let pool = null;

function getPool() {
  if (pool) return pool;
  assertDatabaseConfigured();
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
    query_timeout: 20_000,
    keepAlive: true,
    application_name: 'varuag-os-backend',
  });
  pool.on('error', (err) => {
    console.error('[db] idle client error:', err.message);
  });
  return pool;
}

/** Parameterised query: query('SELECT * FROM users WHERE id = $1', [id]) */
function query(text, params) {
  return getPool().query(text, params);
}

/** Runs fn(client) inside BEGIN/COMMIT, rolling back on any error. */
async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, withTransaction, close };
