'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { env, assertJwtConfigured } = require('./config/env');
const db = require('./config/db');

function signAccessToken(user) {
  assertJwtConfigured();
  return jwt.sign({ sub: user.id, role: user.role, clientId: user.client_id || null }, env.JWT_SECRET, { expiresIn: '15m' });
}
function verifyAccessToken(token) { assertJwtConfigured(); return jwt.verify(token, env.JWT_SECRET); }
function hashRefreshToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
async function issueRefreshToken(userId, userAgent) {
  const raw = `${crypto.randomUUID()}${crypto.randomBytes(32).toString('hex')}`;
  await db.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent) VALUES ($1, $2, now() + interval '30 days', $3)`, [userId, hashRefreshToken(raw), userAgent || null]);
  return raw;
}
async function rotateRefreshToken(raw, userAgent) {
  if (typeof raw !== 'string' || !raw) throw new Error('Invalid refresh token');
  const result = await db.withTransaction(async (client) => {
    const found = await client.query(`SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at, u.id, u.role, u.client_id, u.name, u.email, u.status FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id WHERE rt.token_hash = $1 FOR UPDATE`, [hashRefreshToken(raw)]);
    const row = found.rows[0];
    if (!row || row.revoked_at || new Date(row.expires_at) <= new Date() || row.status !== 'active') throw new Error('Invalid refresh token');
    const next = `${crypto.randomUUID()}${crypto.randomBytes(32).toString('hex')}`;
    const inserted = await client.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent) VALUES ($1, $2, now() + interval '30 days', $3) RETURNING id`, [row.user_id, hashRefreshToken(next), userAgent || null]);
    await client.query(`UPDATE refresh_tokens SET revoked_at = now(), replaced_by = $1 WHERE id = $2`, [inserted.rows[0].id, row.id]);
    return { user: row, refreshToken: next };
  });
  return { user: publicUser(result.user), accessToken: signAccessToken(result.user), refreshToken: result.refreshToken };
}
async function authenticate(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
    const claims = verifyAccessToken(header.slice(7));
    const result = await db.query(`SELECT id, role, client_id, name, email, phone, avatar_url, job_title, status, must_change_password FROM users WHERE id = $1`, [claims.sub]);
    if (!result.rowCount || result.rows[0].status !== 'active') return res.status(401).json({ error: 'Authentication required' });
    req.user = result.rows[0];
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired access token' }); }
}
function allow(...roles) { return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Insufficient permissions' }); }
function publicUser(user) { return { id: user.id, role: user.role, clientId: user.client_id || null, name: user.name, email: user.email, phone: user.phone || null, avatarUrl: user.avatar_url || null, jobTitle: user.job_title || null, mustChangePassword: user.must_change_password }; }
module.exports = { authenticate, allow, publicUser, signAccessToken, issueRefreshToken, rotateRefreshToken, hashRefreshToken, bcrypt };
