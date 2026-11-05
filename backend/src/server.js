'use strict';

const express = require('express');
const cors = require('cors');
const { env, assertDatabaseConfigured, assertJwtConfigured } = require('./config/env');
const db = require('./config/db');
const { authenticate, allow, publicUser, signAccessToken, issueRefreshToken, rotateRefreshToken, hashRefreshToken, bcrypt } = require('./auth');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.get('/health', async (_req, res) => { try { await db.query('SELECT 1'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); } });

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required' });
    const result = await db.query(`SELECT id, role, client_id, name, email, phone, avatar_url, job_title, status, must_change_password, password_hash FROM users WHERE lower(email) = lower($1)`, [email.trim()]);
    const user = result.rows[0];
    if (!user || user.status !== 'active' || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid credentials' });
    await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
    res.json({ user: publicUser(user), accessToken: signAccessToken(user), refreshToken: await issueRefreshToken(user.id, req.get('user-agent')) });
  } catch (err) { next(err); }
});
app.post('/api/auth/refresh', async (req, res) => { try { res.json(await rotateRefreshToken(req.body && req.body.refreshToken, req.get('user-agent'))); } catch { res.status(401).json({ error: 'Invalid refresh token' }); } });
app.post('/api/auth/logout', authenticate, async (req, res, next) => { try { const raw = req.body && req.body.refreshToken; if (raw) await db.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND user_id = $2 AND revoked_at IS NULL', [hashRefreshToken(raw), req.user.id]); res.status(204).end(); } catch (err) { next(err); } });
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

function projectScope(user, alias = 'p') { return user.role === 'client' ? { sql: `${alias}.client_id = $1`, params: [user.client_id] } : { sql: 'TRUE', params: [] }; }
app.get('/api/dashboard', authenticate, async (req, res, next) => {
  try {
    const s = projectScope(req.user);
    const [projects, tasks, invoices, notifications] = await Promise.all([
      db.query(`SELECT count(*)::int AS count FROM projects p WHERE ${s.sql} AND p.status <> 'cancelled'`, s.params),
      db.query(`SELECT count(*)::int AS count FROM tasks t JOIN milestones m ON m.id=t.milestone_id JOIN projects p ON p.id=m.project_id WHERE ${s.sql} AND t.status NOT IN ('done','cancelled')`, s.params),
      db.query(`SELECT count(*)::int AS count FROM invoices i WHERE ${req.user.role === 'client' ? 'i.client_id=$1' : 'TRUE'}`, req.user.role === 'client' ? [req.user.client_id] : []),
      db.query('SELECT count(*)::int AS count FROM notifications WHERE user_id=$1 AND read_at IS NULL', [req.user.id]),
    ]);
    res.json({ projects: projects.rows[0].count, openTasks: tasks.rows[0].count, invoices: invoices.rows[0].count, unreadNotifications: notifications.rows[0].count });
  } catch (err) { next(err); }
});
app.get('/api/projects', authenticate, async (req, res, next) => { try { const s = projectScope(req.user); res.json({ projects: (await db.query(`SELECT p.*, pp.progress_percent FROM projects p LEFT JOIN project_progress pp ON pp.project_id=p.id WHERE ${s.sql} ORDER BY p.created_at DESC`, s.params)).rows }); } catch (err) { next(err); } });
app.get('/api/projects/:id', authenticate, async (req, res, next) => {
  try {
    const p = await db.query(`SELECT p.*, pp.progress_percent FROM projects p LEFT JOIN project_progress pp ON pp.project_id=p.id WHERE p.id=$1 AND ($2::text <> 'client' OR p.client_id=$3)`, [req.params.id, req.user.role, req.user.client_id]);
    if (!p.rowCount) return res.status(404).json({ error: 'Project not found' });
    const [milestones, updates, files] = await Promise.all([
      db.query('SELECT m.*, mp.progress_percent FROM milestones m LEFT JOIN milestone_progress mp ON mp.milestone_id=m.id WHERE m.project_id=$1 ORDER BY m.sort_order,m.created_at', [req.params.id]),
      db.query(`SELECT * FROM project_updates WHERE project_id=$1 AND ($2::text <> 'client' OR status='published') ORDER BY created_at DESC`, [req.params.id, req.user.role]),
      db.query(`SELECT * FROM files WHERE project_id=$1 AND status='ready' AND ($2::text <> 'client' OR visibility='client') ORDER BY created_at DESC`, [req.params.id, req.user.role]),
    ]);
    res.json({ project: p.rows[0], milestones: milestones.rows, updates: updates.rows, files: files.rows });
  } catch (err) { next(err); }
});
app.get('/api/projects/:id/tasks', authenticate, async (req, res, next) => { try { const r = await db.query(`SELECT t.* FROM tasks t JOIN milestones m ON m.id=t.milestone_id JOIN projects p ON p.id=m.project_id WHERE p.id=$1 AND ($2::text <> 'client' OR p.client_id=$3) ORDER BY m.sort_order,t.sort_order`, [req.params.id, req.user.role, req.user.client_id]); res.json({ tasks: r.rows }); } catch (err) { next(err); } });
app.patch('/api/tasks/:id/status', authenticate, allow('admin','team'), async (req, res, next) => { try { const r = await db.query(`UPDATE tasks t SET status=$1, submitted_at=CASE WHEN $1='in_review' THEN now() ELSE submitted_at END WHERE t.id=$2 AND ($3::text='admin' OR t.assignee_id=$4 OR EXISTS (SELECT 1 FROM milestones m JOIN project_members pm ON pm.project_id=m.project_id WHERE m.id=t.milestone_id AND pm.user_id=$4)) RETURNING t.*`, [req.body && req.body.status, req.params.id, req.user.role, req.user.id]); if (!r.rowCount) return res.status(404).json({ error: 'Task not found or not permitted' }); res.json({ task: r.rows[0] }); } catch (err) { next(err); } });
app.post('/api/tasks/:id/verify', authenticate, allow('admin'), async (req, res, next) => { try { const r = await db.query(`UPDATE tasks SET status='done', verified_at=now(), verified_by=$1 WHERE id=$2 RETURNING *`, [req.user.id, req.params.id]); if (!r.rowCount) return res.status(404).json({ error: 'Task not found' }); res.json({ task: r.rows[0] }); } catch (err) { next(err); } });
app.get('/api/invoices', authenticate, async (req, res, next) => { try { const r = await db.query(`SELECT i.*, b.amount_paid,b.amount_pending_verification,b.balance_due,b.payment_state FROM invoices i JOIN invoice_balances b ON b.invoice_id=i.id WHERE ($1::text <> 'client' OR i.client_id=$2) ORDER BY i.created_at DESC`, [req.user.role, req.user.client_id]); res.json({ invoices: r.rows }); } catch (err) { next(err); } });
app.post('/api/invoices/:id/payments', authenticate, allow('admin','client'), async (req, res, next) => { try { const { amount, method, reference, proofFileId, paidOn } = req.body || {}; const invoice = await db.query(`SELECT id FROM invoices WHERE id=$1 AND ($2::text<>'client' OR client_id=$3)`, [req.params.id, req.user.role, req.user.client_id]); if (!invoice.rowCount) return res.status(404).json({ error: 'Invoice not found' }); const r = await db.query(`INSERT INTO payments (invoice_id, submitted_by, amount, method, reference, proof_file_id, paid_on) VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::date,CURRENT_DATE)) RETURNING *`, [req.params.id, req.user.id, amount, method, reference || null, proofFileId || null, paidOn || null]); res.status(201).json({ payment: r.rows[0] }); } catch (err) { next(err); } });
app.post('/api/payments/:id/verify', authenticate, allow('admin'), async (req, res, next) => { try { const r = await db.query(`UPDATE payments SET status='verified', verified_by=$1, verified_at=now(), receipt_number=COALESCE(receipt_number, 'VL-REC-' || lpad(nextval('receipt_number_seq')::text, 5, '0')) WHERE id=$2 AND status='pending' RETURNING *`, [req.user.id, req.params.id]); if (!r.rowCount) return res.status(404).json({ error: 'Pending payment not found' }); res.json({ payment: r.rows[0] }); } catch (err) { next(err); } });
app.get('/api/notifications', authenticate, async (req, res, next) => { try { res.json({ notifications: (await db.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [req.user.id])).rows }); } catch (err) { next(err); } });
app.get('/api/projects/:id/messages', authenticate, allow('admin','team'), async (req, res, next) => { try { res.json({ messages: (await db.query('SELECT pm.* FROM project_messages pm JOIN projects p ON p.id=pm.project_id WHERE pm.project_id=$1 ORDER BY pm.created_at ASC', [req.params.id])).rows }); } catch (err) { next(err); } });
app.post('/api/projects/:id/messages', authenticate, allow('admin','team'), async (req, res, next) => { try { const r = await db.query('INSERT INTO project_messages (project_id, task_id, author_id, body) VALUES ($1,$2,$3,$4) RETURNING *', [req.params.id, req.body && req.body.taskId || null, req.user.id, req.body && req.body.body]); res.status(201).json({ message: r.rows[0] }); } catch (err) { next(err); } });
app.post('/api/projects/:id/updates', authenticate, allow('admin','team'), async (req, res, next) => { try { const { title, body, milestoneId, publish = false } = req.body || {}; const r = await db.query(`INSERT INTO project_updates (project_id,milestone_id,author_id,title,body,status,approved_by,approved_at,published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,CASE WHEN $6='published' THEN now() END,CASE WHEN $6='published' THEN now() END) RETURNING *`, [req.params.id, milestoneId || null, req.user.id, title, body, publish && req.user.role === 'admin' ? 'published' : 'pending_approval', publish && req.user.role === 'admin' ? req.user.id : null]); res.status(201).json({ update: r.rows[0] }); } catch (err) { next(err); } });
app.post('/api/files', authenticate, allow('admin','team','client'), async (req, res, next) => { try { const { projectId, milestoneId, taskId, submissionId, storageProvider, storageKey, originalName, mimeType, sizeBytes, visibility = 'internal' } = req.body || {}; const visible = req.user.role === 'client' ? 'client' : visibility; const r = await db.query(`INSERT INTO files (project_id,milestone_id,task_id,submission_id,storage_provider,storage_key,original_name,mime_type,size_bytes,visibility,uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,project_id,storage_provider,storage_key,original_name,mime_type,size_bytes,visibility,status,created_at`, [projectId || null, milestoneId || null, taskId || null, submissionId || null, storageProvider, storageKey, originalName, mimeType, sizeBytes, visible, req.user.id]); res.status(201).json({ file: r.rows[0], upload: { method: 'PUT', storageProvider, storageKey } }); } catch (err) { next(err); } });
app.post('/api/files/:id/complete', authenticate, allow('admin','team','client'), async (req, res, next) => { try { const r = await db.query(`UPDATE files SET status='ready' WHERE id=$1 AND uploaded_by=$2 RETURNING *`, [req.params.id, req.user.id]); if (!r.rowCount) return res.status(404).json({ error: 'File not found or not permitted' }); res.json({ file: r.rows[0] }); } catch (err) { next(err); } });
app.get('/api/support/tickets', authenticate, async (req, res, next) => { try { res.json({ tickets: (await db.query(`SELECT * FROM support_tickets WHERE ($1::text <> 'client' OR client_id=$2) ORDER BY created_at DESC`, [req.user.role, req.user.client_id])).rows }); } catch (err) { next(err); } });
app.post('/api/support/tickets', authenticate, async (req, res, next) => { try { const { subject, description, projectId, priority = 'medium' } = req.body || {}; const clientId = req.user.role === 'client' ? req.user.client_id : req.body.clientId; const r = await db.query(`INSERT INTO support_tickets (client_id, project_id, raised_by, subject, description, priority) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [clientId, projectId || null, req.user.id, subject, description, priority]); res.status(201).json({ ticket: r.rows[0] }); } catch (err) { next(err); } });
app.use((err, _req, res, _next) => { console.error('[api]', err.message); res.status(err.status || 500).json({ error: 'Internal server error' }); });
if (require.main === module) { assertDatabaseConfigured(); assertJwtConfigured(); app.listen(env.PORT, () => console.log(`Varuag OS API listening on port ${env.PORT}`)); }
module.exports = app;
