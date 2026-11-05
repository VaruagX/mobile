# Varuag OS backend

The backend is a database-free placeholder while the replacement data service is being selected. It exposes `/health`; requests under `/api` return `503 Data service is not configured`.

The mobile app continues to use its in-memory demo data and demo accounts. No database connection strings, SQL queries, migrations, or database setup are required here.

## Run

```bash
npm install
npm start
```

Set `PORT` to change the listening port. `CORS_ORIGINS` is a comma-separated allowlist for browser clients.
