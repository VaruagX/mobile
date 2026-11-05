'use strict';
/**
 * Environment configuration for the Varuag OS backend.
 *
 * Values come only from backend/.env (or the host's environment). Nothing secret is
 * hard-coded here. Requiring this module never connects to anything.
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const PLACEHOLDER_DATABASE_URL = /USER:PASSWORD@HOST/i;
const PLACEHOLDER_JWT_SECRET = 'replace_with_secure_secret';

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number.parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
});

const isProduction = env.NODE_ENV === 'production';

/** Throws a clear error unless DATABASE_URL holds a real connection string. */
function assertDatabaseConfigured() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add it to backend/.env.');
  }
  if (PLACEHOLDER_DATABASE_URL.test(env.DATABASE_URL)) {
    throw new Error(
      'DATABASE_URL in backend/.env is still the placeholder. Replace it with your Neon connection string before connecting.'
    );
  }
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL is not a valid connection URL.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must start with postgresql://');
  }
}

/** Throws unless JWT_SECRET is safe to sign tokens with. */
function assertJwtConfigured() {
  if (!env.JWT_SECRET || env.JWT_SECRET === PLACEHOLDER_JWT_SECRET) {
    throw new Error('JWT_SECRET in backend/.env is missing or still the placeholder.');
  }
  if (isProduction && env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
}

module.exports = { env, isProduction, assertDatabaseConfigured, assertJwtConfigured };
