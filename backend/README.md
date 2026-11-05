# Varuag OS — backend

Express + raw SQL (`pg`) + Neon PostgreSQL. The mobile app never sees the database; it only talks to this API.

## Configuration

`backend/.env` (git-ignored) holds the configuration. `.env.example` shows the keys:

| Key | Purpose |
|---|---|
| `DATABASE_URL` | Neon connection string. Placeholder until you add the real one. |
| `JWT_SECRET` | Token signing secret (at least 32 random characters in production). |
| `PORT` | API port (default 5000). |
| `NODE_ENV` | `development` or `production`. |

While `DATABASE_URL` is the placeholder, `src/config/db.js` refuses to create a connection.

## Database migrations

Plain SQL files in `migrations/`, applied in order by `scripts/migrate.js`. They are forward-only, with no down migrations and no drops.

```bash
npm run migrate:plan        # offline: list files + checksums, no connection
npm run migrate:status      # read-only: applied vs pending
npm run migrate -- --yes    # apply pending migrations (each in its own transaction)
```

Before applying:

1. Point `DATABASE_URL` at a **new, empty** Neon database or branch, not the legacy Varuag Labs database. The runner refuses to run on a database that already has these tables but no `vos_schema_migrations` history.
2. Prefer Neon's direct (non-pooled) connection string for migrations.
3. Run `migrate:status` first, then `migrate -- --yes`.

| File | Contents |
|---|---|
| `001_core_identity.sql` | clients, users (admin / team / client), refresh tokens, push tokens, notification preferences |
| `002_projects_milestones_tasks.sql` | projects, members, milestones, tasks, submissions, blockers, status history, progress views |
| `003_files_updates_messages.sql` | files, client-facing project updates, team messages, activity log |
| `004_invoices_payments.sql` | invoices, items, payments (manual + gateway-ready), verification rules, balances view, expenses |
| `005_support_notifications.sql` | support tickets and messages, announcements, notifications |

**Progress** comes from the `milestone_progress` and `project_progress` views. It counts only tasks with status `done`, and a task can only be `done` once an admin has verified it.
