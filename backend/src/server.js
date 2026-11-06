'use strict';

const express = require('express');
const cors = require('cors');

const app = express();
const port = Number.parseInt(process.env.PORT || '5001', 10);
const allowedOrigins = new Set((process.env.CORS_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean));

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  });
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(Object.assign(new Error('Origin is not allowed'), { status: 403 }));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, dataService: 'not-configured' }));
app.use('/api', (_req, res) => res.status(503).json({ error: 'Data service is not configured' }));
app.use((err, _req, res, _next) => {
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({ error: status === 403 ? 'Forbidden' : 'Request failed' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`Varuag OS API placeholder listening on port ${port}`));
}

module.exports = app;
