# Final Database Reconciliation

Strictly read-only. No application code, migration, environment file or database was changed. Neon was **not** contacted and no SQL was executed. No secret value was read or printed: environment variables are listed by **name only**, and `.env` files were never opened.

## Evidence labels

| Tag | Meaning |
|---|---|
| **[OS-C]** | `varuag-os` repo (this project), current working tree |
| **[OS-G]** | `varuag-os` Git history (commits `52bb168`, `8228534`, `b0fc832`) |
| **[LM-C]** | The sibling repo **`/Users/gauravkale/Documents/varuag labs mobile`** (branch `redesign/glass-ui`, HEAD `821d31f8`), current files. This is where the developed backend lives. |
| **[LM-R]** | A claim written in that sibling repo's own reports (`MASTER_IMPLEMENTATION_REPORT.md`, `PROJECT_MANAGEMENT_V3_IMPLEMENTATION_REPORT.md`, `docs/db-review/*`). Reported by an earlier session, **not re-verified by me**. |
| **[U]** | UNKNOWN / NOT VERIFIED |

---

## 1. Why the earlier audit conflicted with what you remembered

**`docs/COMPLETE_DATABASE_AUDIT.md` was incomplete. It examined only the `varuag-os` repo and its Git history, and never looked at the sibling project folder.** That is the cause of the conflict you noticed.

- `varuag-os/backend` really is a placeholder [OS-C]. Its deleted history [OS-G] was a different, fresh-database design (25 tables, roles `admin`/`team`/`client`) whose migration runner **refuses to run on a legacy database**.
- The backend you remember (Express + PostgreSQL, migrations, a large Neon schema) is in **`varuag labs mobile/backend`** [LM-C]: 11 migrations, 153 API endpoints, RBAC, project phases, a Super Admin provisioning script, and 85 passing database tests [LM-R].
- **A "39-table Neon schema" appears in neither repo.** The numbers I can actually find are in Section 6. I cannot confirm 39.

Consequently, parts of the earlier audit are wrong or superseded (Section 3).

---

## 2. Verified current architecture

### 2.1 Git state of `varuag-os` (verified)

| Item | Value |
|---|---|
| Branch / HEAD | `main` @ `b0fc832` ("db change"), tracking `origin/main`, not ahead or behind |
| Other branches, tags, stashes, worktrees | none |
| Commits in history | 3: `52bb168`, `8228534`, `b0fc832` |
| Dangling commits (possible lost work) | 0 (dangling trees only, no commits) |
| Uncommitted changes | modified: `backend/.env.example`, `backend/README.md`, `backend/src/server.js`, `mobile/src/components/{Form,Leadership,TabBar}.tsx`, `mobile/src/features/sheets.tsx`. Untracked: `docs/`, `mobile/src/features/{finance-sheets,form-parts,new-project,planning-sheets}.tsx` |
| Committed? | nothing from this session has been committed |

### 2.2 `varuag-os` application [OS-C]

| Part | State |
|---|---|
| `mobile/` | Expo SDK 57 / Expo Router UI review build. **No network code**; all data from an in-memory demo store. Roles in code: `admin`, `team`, `client`. Demo login with a hard-coded demo password. |
| `backend/` | Express 5 placeholder: `/health` and `/api/*` → 503. Dependencies: `cors`, `express` only. No migrations, no scripts, no DB driver. |
| Env variable **names** | `backend/.env` and `.env.example`: `PORT`, `NODE_ENV`, `CORS_ORIGINS`. No `mobile/.env`. |
| Database connection | **none** |

### 2.3 Sibling project `varuag labs mobile` [LM-C]

| Part | State |
|---|---|
| Repo | separate Git repo; branch `redesign/glass-ui` @ `821d31f8`; backup tag `backup/pre-redesign-821d31f8`; working tree: 1 modified file (`.gitignore`) plus untracked docs/assets |
| `backend/` | Express 4, `pg`, `bcryptjs` (cost 12), `jsonwebtoken`, `joi`, `helmet`, `express-rate-limit`, `multer`, `pdfkit`, `expo-server-sdk`. Controllers / models / services / validators / 11 migrations / a migration runner / seed and provisioning scripts / Jest tests. |
| Env variable **names** (`backend/.env`) | `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `AUTH_RATE_LIMIT_MAX`, `UPLOAD_DIR`, `FRONTEND_URL` |
| Additional names in `.env.example` | `MAX_FILE_SIZE_MB`, `SMTP_HOST/PORT/USER/PASS/FROM`, `EXPO_ACCESS_TOKEN`, `API_RATE_LIMIT_USER_MAX`, `API_RATE_LIMIT_IP_MAX`, `AUTH_RATE_LIMIT_MAX_ATTEMPTS`, `EXPENSIVE_RATE_LIMIT_MAX` |
| `mobile/` | a different, older React Native app that **does** call the API (`services/api.js` with token refresh) |
| Database connection | the code connects through `DATABASE_URL` with TLS for `*.neon.tech` hosts. **Where `DATABASE_URL` points is [U] (not read).** [LM-R] says Neon was inspected read-only by an earlier session. |

### 2.4 How the repos relate

`varuag-os/mobile` is the **new** UI-review app. It was never wired to the sibling API. The two apps differ in role names, progress logic and data shapes (Section 3). Nothing in `varuag-os` uses the sibling backend today.

---

## 3. Conflicts found

| # | Topic | Earlier audit / `varuag-os` says | Reality in sibling / your instructions | Impact |
|---|---|---|---|---|
| 1 | **Which backend is "the" backend** | placeholder, schema deleted | full backend exists in sibling [LM-C] | the earlier audit's whole premise (rebuild from history) is wrong; the schema to extend is the sibling's |
| 2 | **`super_admin`** | "does not exist anywhere" | exists everywhere in sibling (74 code references, seeded role, `provision-super-admin.js`); you said to preserve it | earlier audit's role plan (convert Super Admin → admin, final set of three) is **withdrawn** |
| 3 | **Role set** | `admin`, `team_member`, `client` | sibling: `super_admin`, `admin`, `team_member`, `client`, **`intern`**. You listed four (no `intern`). `varuag-os` mobile has `admin`, `team`, `client`. | `intern` is in the sibling's code (29 refs) and internship module. It must not be silently dropped. Needs your decision. |
| 4 | **`team` vs `team_member`** | proposed renaming `team` → `team_member` in the database | sibling already uses `team_member` | the rename is needed only in `varuag-os` mobile code, not in the database |
| 5 | **Progress formula** | views derived from **task** weights (task → milestone → project) | approved rule: `Σ(phase weight × phase progress) / 100`, from `project_phases` only; "tasks and milestones never influence it" [LM-C `phaseProgressService.js`, migration 011 header] | the earlier audit's Section 9 and Phase 5.5/5.6 are wrong. `varuag-os` mobile (`selectors.ts`, my milestone/task forms and weight notes) follows the task-derived model and **conflicts** with the approved rule. No change made. |
| 6 | **Weights** | relative, divide by Σweights | phase weights are percentages, validated to total **exactly 100** before tracking is active; integer hundredths arithmetic | enforcement is required; relative weights are not allowed in the approved model |
| 7 | **Auth features "missing"** | no password reset, no audit log, no rate limiting, no validation, refresh reuse not detected | sibling has `password_reset_tokens`, `audit_logs`, rate limiters, Joi validators, helmet, refresh tokens hashed with a `family_id` | many "required new tables" in the earlier audit already exist |
| 8 | **Table count** | 25 | 46 in the sibling migration files; 43 "TABLE DATA" entries in a documented live dump [LM-R]; **39 per you**, not found anywhere | all counts differ; live count is [U] |
| 9 | **Migration files vs live database** | assumed files = database | sibling's own runner states live auth/project tables differ from files 001–009 and skips 006–009 [LM-C `migrate.js`]; code uses `users.role_id`, `account_status`, `roles.slug`, `refresh_tokens.token_hash`, none of which match file 001 | **the migration files are not a reliable description of the live schema** |
| 10 | **Role storage** | single `users.role` column | file 001 has a `user_roles` join table; live code uses one `users.role_id` per user | multi-role vs single-role is [U] until inspected |
| 11 | **Admin provisioning** | hash-and-insert by hand | interactive CLI `provision-super-admin.js` exists (hidden password prompt, no public endpoint) | use the CLI; which role `gauravkale216@gmail.com` should hold is an open question |
| 12 | **`admin` permissions** | "full admin" | `docs/ROLES-PERMISSIONS.md` has **no `admin` column**; code uses `admin` in 17 places; [LM-R] says "admin role untouched"; payment settings may **not** be edited by `admin` | the `admin` permission set is undocumented; do not change it |
| 13 | **Public registration** | not examined | `POST /api/auth/register` returns 403 ("disabled") | good; no action |
| 14 | **TLS** | not examined | database connection uses `rejectUnauthorized: false` for Neon [LM-C `database.js`] | a security gap (Section 9) |

---

## 4. Current migration inventory

### 4.1 `varuag-os` [OS-C]
**None.** `backend/migrations/` and `backend/scripts/` are empty. [OS-G] history: `001`–`005` + a fresh-database-only runner (25 tables, tracks history in `vos_schema_migrations`). Not applicable to the live database [U].

### 4.2 Sibling [LM-C], `backend/migrations/` (11 files, 46 `CREATE TABLE` statements, all distinct names)

| File | Tables created | Notes |
|---|---|---|
| 001 | `roles`, `users`, `user_roles`, `refresh_tokens`, `password_reset_tokens` | seeds roles `super_admin`, `team_member`, `client`, `intern` (**no `admin` seeded**); stores raw `token` (live code uses `token_hash`) |
| 002 | `permissions`, `role_permissions` | seeds 9 permissions, all granted to `super_admin` |
| 003 | `audit_logs` | |
| 004 | `clients`, `leads`, `lead_activities` | `clients.city` exists |
| 005 | `projects`, `project_members`, `milestones`, `tasks`, `task_assignments` | |
| 006 | `comments`, `activity_logs`, `documents` | **skipped by the runner on a reconciled DB** |
| 007 | `quotations`, `quotation_items`, `invoices`, `invoice_items`, `payments`, `expenses` | **skipped by the runner on a reconciled DB**; tax columns and invoice number exist in the file; live shape [U] |
| 008 | `batches`, `enrolments`, `class_sessions`, `learning_resources`, `assignments`, `submissions`, `evaluations`, `attendance`, `certificates` | **skipped on a reconciled DB** (internship) |
| 009 | `support_tickets`, `ticket_messages`, `announcements`, `notifications` | **skipped on a reconciled DB** |
| 010 | `milestone_members`, `task_submissions`, `task_reviews`, `task_status_history`, `project_attachments` | adds `projects.project_code`, `category`, `archived_at/by`, `project_manager_id`; weighted milestones (`milestones.weight_percent`, `task_weighting_mode`); `activity_logs.client_visible` |
| 011 | `project_phases`, `phase_members`, `phase_progress_history` | adds `projects.auto_completed`; trigger `trg_phase_history_guard` (history immutable); additive and idempotent |

### 4.3 Runner behaviour [LM-C `scripts/migrate.js`]
- Tracks applied files in **`_migrations`**; records baseline detections in **`_schema_reconciliations`** (baselines `existing_auth_schema_v1`, `existing_projects_tasks_schema_v1`).
- Checks that the live DB has required columns (e.g. `users.role_id`, `full_name`, `account_status`; `refresh_tokens.token_hash`, `family_id`; `roles.slug`; `permissions.module/action`) and **skips** 001–003, 004–005 and 006–009 accordingly.
- Supports `up`, `down` and `--dry-run`. (You asked for forward-only; the `down` blocks exist but need not be used.)
- Not run by me.

### 4.4 State of 010 and 011 on Neon
- [LM-R] (report dated 2026-11-05): `_migrations` contained **only `010`**, and **011 had not been applied**, awaiting your approval.
- Current status of 011 on Neon: **[U]**. Do not assume it was applied.

---

## 5. Current API inventory

### 5.1 `varuag-os` [OS-C]
`GET /health` → `{ok:true, dataService:'not-configured'}`; everything under `/api/*` → `503`. Port default 5001.

### 5.2 Sibling [LM-C]: 153 route handlers

Global middleware: `helmet`, request logging, JSON body limit 10 MB, general API limiter on `/api`, CORS configured, 404 and error handlers. `super_admin` bypasses every `requireRole` and `requirePermission` check by design.

| Mount | # | Routes |
|---|---|---|
| `/api` | 1 | `GET /health` |
| `/api/auth` | 8 | `POST /register` (**always 403**), `/login`, `/refresh`, `/forgot-password`, `/reset-password`, `/logout`; `GET /me`, `/network-info` |
| `/api/users` | 12 | `GET /team-members`, `/permissions/catalog`, `/`, `/:id`, `/:id/assignments`, `/:id/permissions`; `POST /`, `/:id/revoke-sessions`; `PUT /:id`, `/:id/permissions`; `PATCH /:id/status`; `DELETE /:id` |
| `/api/clients` | 6 | `GET /`, `/:id`, `/:id/projects`; `POST /`; `PUT /:id`; `DELETE /:id` |
| `/api/projects` | 26 | CRUD + `PATCH /:id/status`, `/:id/archive`, `/:id/restore`; members (`GET/POST /:id/members`, `DELETE …/:userId`); `GET /:id/tasks`; milestones (`GET/POST /:id/milestones`, `PUT /:id/milestones/weights`); `GET /:id/progress`, `/:id/progress/history`, `/:id/deadlines`, `/:id/timeline`; **phases** (`GET/POST /:id/phases`, `PUT /:id/phases/order`, `POST /:id/phases/import-milestones`); attachments (`GET/POST /:id/attachments`, `DELETE …/:attachmentId`) |
| `/api/phases` | 9 | `GET /mine`, `/:id`, `/:id/history`; `PUT /:id`; `PATCH /:id/progress`, `/history/:historyId/client-visibility`; `POST /:id/members`; `DELETE /:id`, `/:id/members/:userId` |
| `/api/milestones` | 4 | `GET /:id`; `PUT /:id`, `/:id/task-weights`; `DELETE /:id` |
| `/api/tasks` | 9 | `GET /`, `/my`, `/:id`; `POST /`, `/:id/submit`, `/:id/review`; `PUT /:id`; `PATCH /:id/status`; `DELETE /:id` |
| `/api/project-management` | 9 | `GET /me`, `/overview`, `/milestones`, `/workload`, `/calendar`, `/reports/:type`, `/activity`, `/assignable-users`; `POST /reminders/run` |
| `/api/finance` | 17 | `/invoices` (list, create, get, `PATCH …/status`, `POST …/send`, `DELETE`, `GET …/pdf`), `/payments` (list, create), `/expenses` (list, create, get, `PATCH …/status`, approve, reject, delete), `GET /summary` |
| `/api/invoices` | 7 | duplicate of the finance invoice routes |
| `/api/payments` | 2 | `GET /`, `POST /` |
| `/api/expenses` | 7 | duplicate of the finance expense routes |
| `/api/support` and `/api/tickets` | 21 | same router mounted twice: tickets list/my/get/create/update/assign/close/reopen/delete, messages list/create |
| `/api/announcements` | 5 | CRUD |
| `/api/notifications` | 4 | `GET /`; `PATCH /:id/read`; `POST /read-all`, `/device-token` |
| `/api/reports` | 6 | `GET /dashboard`, `/summary`, `/projects`, `/tasks`, `/team`, `/support` |

Observations: invoice and expense routes are **duplicated** under `/api/finance`, `/api/invoices`, `/api/expenses`. Not found in the route files: an endpoint for editing a task's completion date, soft delete of tasks/milestones, or payment-settings management (specified in [LM-R], not built).

---

## 6. Historical schema versus current schema

| | **A. `varuag-os` history** [OS-G] | **B. Sibling migration files** [LM-C] | **C. Live Neon** |
|---|---|---|---|
| Design | fresh database, forward-only, runner refuses legacy DBs | incremental, reconciles with an existing DB | **[U]** |
| Tables | 25 (+ 3 views, 4 sequences, 3 functions, 17 triggers) | 46 statements / 46 distinct names (+ `_migrations`, `_schema_reconciliations` created by the runner) | documented dump: **43 "TABLE DATA"** [LM-R]; you recall **39**; **[U]** |
| Roles | `admin`, `team`, `client` | `super_admin`, `team_member`, `client`, `intern` seeded; `admin` used in code but **not seeded in files**; local clones had `admin, client, intern, super_admin, team_member` [LM-R] | **[U]** |
| Role storage | `users.role` + CHECK | `user_roles` join table in file 001; **code** uses `users.role_id` | **[U]** (code suggests `role_id`) |
| Permissions | none (role checks only) | `permissions` + `role_permissions` (per-user overrides via `/users/:id/permissions`) | **[U]** |
| Refresh tokens | hashed, `replaced_by` | file: raw `token`; **code**: `token_hash` + `family_id` | **[U]** |
| User status | `users.status` | file: `is_active`; **code**: `account_status` | **[U]** |
| Progress | task-weight views | file 010 weighted milestones; **011 phases** (official) | 011 **[U]** (not applied as of the last report) |
| IDs | `gen_random_uuid()` | file 001 uses `uuid_generate_v4()` (needs `uuid-ossp`); 011 uses `gen_random_uuid()` | **[U]** |
| Finance | invoices / items / payments / expenses with DB-enforced payment rules | file 007 (skipped on live) | **[U]** |
| Audit | `activity_log` (never written) | `audit_logs`, `activity_logs`, `phase_progress_history` (immutable) | **[U]** |

**Reading across the three columns:** the sibling code, not its migration files, is the best evidence of the live shape, and even that is unverified.

---

## 7. Known and unknown Neon state

### Known (only as **claims in earlier reports**, 2026-11-05, not re-verified [LM-R])
- Neon was inspected read-only (counts and schema); `_migrations` listed **only `010_project_management_v2.sql`**; **no phase tables** existed.
- Data then: 1 project ("Real estate website"), 1 milestone, 1 task, 3 users, 1 client, 2 project members, 9 activity logs, 4 notifications.
- A schema + data dump of Neon was taken (150 KB, "43 tables of data", restore verified). **It contains password hashes and sits in a temporary scratchpad path** named in that report. Move it to a safe place and never commit it.
- Backups elsewhere: a `~/Documents/varuag-backups/` folder is mentioned (not inspected).
- Migration 011 was rehearsed on a local clone; the 85-test database suite passed 3 times on a local Postgres, **not Neon**.
- Local disposable databases exist on your Mac (`pm_v3_test`, `pm_v3_restore_verify`, `varuag_filetest_*`, `varuag_proposal_test`, `varuag_readonly_role_test`) and a local role `varuag_readonly`. None are Neon. I did not open them.

### Unknown (**[U]**)
Everything about Neon **today**: the exact table list and count (39 / 43 / 46?), whether 011 has since been applied, whether payment-settings or storage proposals were applied, which roles and users exist (including whether an `admin` row exists), the live shape of finance, support and notification tables, the PostgreSQL version, plan limits and backup retention.

---

## 8. Missing database features (against the approved design and the `varuag-os` mobile app)

Judged against **file and code evidence**, because the live schema is unknown. Re-check each against the Section 11 query results.

| Need (source) | Evidence of support | Gap / action |
|---|---|---|
| Phase-based official progress (approved D1) | tables + pure calculator in 011 and `phaseProgressService.js`; history immutable | 011 not confirmed on Neon. Phases must be created by an admin. Weights must total exactly 100 to activate tracking. |
| Roles `super_admin`, `admin`, `team_member`, `client` | roles seeded (except `admin` in files) | confirm all four exist live; document `admin` permission set; decide on `intern` |
| Project type / category | `projects.category` (010) | map the mobile's four types to it |
| Client `city` | `clients.city` (004) | verify live |
| Task **manual completion date** and edit | no such column found in migration files by keyword; no route to edit it | new nullable columns + API; must not feed progress |
| Soft delete for tasks/milestones | no `deleted_at` found; `DELETE /tasks/:id`, `DELETE /milestones/:id` exist (hard or soft [U]) | decide and implement; `archive`/`restore` exist for projects only |
| Milestone "Completed" while progress incomplete | milestones are legacy "task groupers" (phases are official) | define what milestones mean in the UI now |
| Payment settings (UPI/bank), edited only by `super_admin` | **specified and tested on a clone, not applied** [LM-R]; forward and rollback SQL in `docs/db-review/proposed/` | needs your approval; **`admin` must not edit** |
| File storage | proposal and feasibility only; undecided; local `UPLOAD_DIR` disk in code | provider and plan limits needed |
| Invoice numbering rule | `invoices.invoice_number` UNIQUE (file 007); generator logic **not reviewed** | inspect live invoices and the model before designing |
| Invoice items: quantity, GST rate; payment reference/UTR; custom expense category; receipts | tax columns and `receipt_url` appear in file 007 | confirm live shape; reconcile with the new mobile forms |
| Invoice/payment integrity rules (verified-payment immutability, cap) | existed only in the `varuag-os` history design | verify whether the live finance tables have equivalents |
| Password reset | `password_reset_tokens`, forgot/reset routes | needs working email (SMTP names exist in `.env.example`); status [U] |
| Audit trail | `audit_logs`, `phase_progress_history` | logging is "best effort" per [LM-R]; sensitive actions need atomic audit |
| Push notifications | `POST /notifications/device-token`, `expo-server-sdk` | `varuag-os` mobile has no push |

---

## 9. Security gaps (from reading code; nothing exploited or tested live)

**Sibling backend [LM-C]**
1. **TLS certificate verification is disabled** for Neon (`rejectUnauthorized: false`). Exposes the DB link to interception on untrusted networks. Already noted by the sibling's own report as a pending item.
2. **`super_admin` bypasses every role and permission check.** One compromised or phished owner account means full access. Sensitive changes need re-authentication (specified for payment settings, not built).
3. **Duplicate route sets** (`/api/finance/*`, `/api/invoices`, `/api/expenses`; `/api/support` and `/api/tickets`) risk divergent authorization if one copy is changed.
4. **Login timing** differs for unknown emails (returns before the bcrypt compare), and a deactivated-account message reveals that an account exists.
5. **Unreviewed routes** needing a check: `GET /api/auth/network-info`, `POST /api/project-management/reminders/run`, `PUT /api/users/:id/permissions`.
6. **Audit is best-effort**, so a logging failure can leave a change unrecorded.
7. **Local disk uploads** (`UPLOAD_DIR`) are lost on ephemeral hosts and bypass any database-level control.
8. JSON body limit of 10 MB on every route.
9. A database dump with password hashes exists in a temporary directory (Section 7).
10. Positive findings: bcrypt cost 12; public registration disabled; Joi validation; helmet; several rate limiters; refresh tokens stored hashed with a rotation family; reset flow revokes sessions; `phase_progress_history` is trigger-protected against edits.

**`varuag-os` [OS-C]**
11. The mobile app contains a hard-coded demo password and demo accounts; the role is kept in local storage; the web build honours `?role=`. Remove before connecting to any real API.
12. Earlier in this conversation a version of `varuag-os/backend/.env` containing database and signing-secret entries was displayed. **Treat those credentials as exposed and rotate them if still valid.** The file now holds only `PORT`, `NODE_ENV`, `CORS_ORIGINS`.

---

## 10. Data migration risks

1. **Live data is real.** One project, one client and three users existed on 2026-11-05 [LM-R]. Every step is additive; nothing may drop, truncate or rewrite.
2. **Applying files to the wrong baseline.** Running old migration files against the live database could create conflicting duplicates. Only the sibling runner (baseline-aware) should be used, and only after Section 11.
3. **011 is not yet confirmed applied.** Phases exist only after it, and the official progress shown to users is `0% / no phases` until an admin creates phases and weights totalling exactly 100.
4. **Terminology.** "Phase" (official, in `project_phases`) differs from "milestone" (legacy grouper). The `varuag-os` UI uses "milestone" and task-derived progress; rewiring changes visible numbers.
5. **Role changes.** Do not rename, merge or delete roles. Deleting a role with users is blocked by a NO ACTION foreign key [LM-R]. `admin`'s permissions are undocumented.
6. **Single vs multiple roles per user** (`users.role_id` vs `user_roles`) must be confirmed before any role work.
7. **Rollback is lossy after use.** Migration 011's `down` block drops phase data and progress history. After admins enter data, rollback means restoring a backup, not running `down`.
8. **Finance mismatch.** Files 006–009 are skipped on live, so invoice, payment and support tables have an unknown shape; the new mobile finance forms cannot be mapped yet.
9. **Mobile IDs.** `varuag-os` demo IDs are strings like `u-admin`; the live database uses UUIDs.
10. **Numbering and receipts** (invoice and receipt formats) must continue the live sequence; formats in the two repos differ.

---

## 11. Exact read-only SQL queries to inspect Neon

Nothing here writes. Run them yourself, **one at a time**, in the Neon SQL editor. Prefer a connection that is read-only by default (the sibling repo has an unrun `docs/db-review/neon-readonly-role.sql` proposal; creating that role is a change you must approve). Start each session with the two guard lines. **Never `SELECT *` from `users`, `refresh_tokens` or `password_reset_tokens`.** Several queries assume column names the sibling **code** uses (`role_id`, `account_status`, `slug`); if one errors, run R6 first and adjust.

```sql
-- Guard (run first, in the same session)
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';
```

```sql
-- R1 environment and identity of this connection
SELECT current_database() AS db, current_user AS usr, version() AS pg_version;
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb FROM pg_roles WHERE rolname = current_user;
```
```sql
-- R2 extensions
SELECT extname, extversion FROM pg_extension ORDER BY extname;
```
```sql
-- R3 object counts by kind (r=table, v=view, i=index, S=sequence, m=matview, p=partitioned)
SELECT n.nspname AS schema, c.relkind, count(*) AS n
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
GROUP BY 1,2 ORDER BY 1,2;
```
```sql
-- R4 base tables (settles the 39 / 43 / 46 question)
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2;
```
```sql
-- R5 migration history and phase tables present?
SELECT to_regclass('public._migrations')               AS migrations,
       to_regclass('public._schema_reconciliations')   AS reconciliations,
       to_regclass('public.vos_schema_migrations')     AS vos_history,
       to_regclass('public.project_phases')            AS project_phases,
       to_regclass('public.phase_members')             AS phase_members,
       to_regclass('public.phase_progress_history')    AS phase_history;
-- only if the first two are not NULL:
SELECT * FROM _migrations ORDER BY 1;
SELECT name, strategy, verified_at, details FROM _schema_reconciliations ORDER BY verified_at;
```
```sql
-- R6 all columns (compare with the migration files and the mobile app's fields)
SELECT table_name, ordinal_position, column_name, data_type,
       character_maximum_length, numeric_precision, numeric_scale, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```
```sql
-- R7 constraints (PK, FK, UNIQUE, CHECK)
SELECT conrelid::regclass AS table_name, conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE connamespace = 'public'::regnamespace
ORDER BY 1, 2;
```
```sql
-- R8 foreign-key delete behaviour (a=no action, r=restrict, c=cascade, n=set null, d=set default)
SELECT conrelid::regclass AS child, confrelid::regclass AS parent, conname, confdeltype
FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace
ORDER BY 1, 2;
```
```sql
-- R9 indexes
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY 1, 2;
```
```sql
-- R10 triggers
SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY 1, 2;
```
```sql
-- R11 functions, views, sequences
SELECT p.proname, pg_get_function_arguments(p.oid) AS args, l.lanname
FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
WHERE p.pronamespace = 'public'::regnamespace ORDER BY 1;
SELECT table_name, view_definition FROM information_schema.views WHERE table_schema = 'public' ORDER BY 1;
SELECT sequence_name, data_type FROM information_schema.sequences WHERE sequence_schema = 'public' ORDER BY 1;
```
```sql
-- R12 roles and permission counts (no personal data)
SELECT * FROM roles ORDER BY 1;
SELECT count(*) AS permissions FROM permissions;
SELECT r.slug, count(*) AS granted
FROM role_permissions rp JOIN roles r ON r.id = rp.role_id GROUP BY 1 ORDER BY 1;
```
```sql
-- R13 users per role and status (counts only)
SELECT r.slug AS role, u.account_status, count(*) AS users
FROM users u JOIN roles r ON r.id = u.role_id
GROUP BY 1, 2 ORDER BY 1, 2;
-- if the database instead uses the user_roles join table:
SELECT r.name AS role, count(*) AS users
FROM user_roles ur JOIN roles r ON r.id = ur.role_id GROUP BY 1 ORDER BY 1;
```
```sql
-- R14 owner / admin accounts (no password hash is selected)
SELECT u.id, u.email, r.slug AS role, u.account_status
FROM users u JOIN roles r ON r.id = u.role_id
WHERE r.slug IN ('super_admin', 'admin') ORDER BY r.slug, u.email;
```
```sql
-- R15 data volume (approximate, then exact for key tables that exist per R4)
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;
SELECT 'projects' AS t, count(*) FROM projects UNION ALL
SELECT 'milestones', count(*) FROM milestones UNION ALL
SELECT 'tasks', count(*) FROM tasks UNION ALL
SELECT 'clients', count(*) FROM clients UNION ALL
SELECT 'users', count(*) FROM users UNION ALL
SELECT 'project_members', count(*) FROM project_members;  -- delete lines for tables that do not exist
```
```sql
-- R16 phases and official progress inputs (only if R5 shows project_phases)
SELECT project_id, count(*) AS phases, sum(weight_percent) AS weight_total
FROM project_phases GROUP BY project_id ORDER BY project_id;
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'auto_completed';
```
```sql
-- R17 session / token health (no token values)
SELECT count(*) AS total,
       count(*) FILTER (WHERE revoked_at IS NULL AND expires_at > now()) AS live
FROM refresh_tokens;
```
```sql
-- R18 who can touch what (privileges on public tables)
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee <> 'PUBLIC'
ORDER BY grantee, table_name, privilege_type;
```
```sql
-- R19 finance shape check, only if invoices exist (latest numbers, no amounts or client data)
SELECT invoice_number FROM invoices ORDER BY created_at DESC LIMIT 10;
```
```sql
ROLLBACK;
```

---

## 12. Proposed forward-only migrations, in dependency order

**Descriptions only. No executable SQL is written.** Numbering continues the sibling runner (`012` onward). Nothing starts until Section 11 results are reviewed, a Neon branch plus a fresh dump exist, and you approve each step. Hard constraints for every step:

- **Official progress stays `Σ(phase weight × phase progress) / 100` from `project_phases` only. No task, task completion or milestone change may alter it.**
- **Roles `super_admin`, `admin`, `team_member`, `client` are neither merged nor renamed, and no permission is changed.** `intern` stays unless you decide otherwise.
- Additive only: no drops, no truncation, no data rewrite.

| Step | Migration (description) | Depends on | Why / feature | Safe for existing data? |
|---|---|---|---|---|
| 0 | **No SQL.** Run R1–R19; reconcile counts; decide the open questions in Section 14 | none | everything below depends on the real schema | read-only |
| 1 | Restore the sibling's migration state if needed: confirm `_migrations`; if 011 is absent, apply the **existing, already rehearsed** 011 | 0, backup | phase tables are the approved progress model | additive; tested on a clone [LM-R] |
| 2 | Confirm / add the `admin` role row and any missing permission names, **without changing** existing grants | 0, 1 | `admin` is used in code but not seeded in files | additive |
| 3 | Payment settings: review then apply the existing `payment-settings.forward.sql` (single UPI + single bank account, versioned, audited; `super_admin` edit only) | 2 | Record Payment shows real payment details | additive; tested on a clone [LM-R] |
| 4 | Tasks: nullable completion fields (`completed_on` date, `completed_by`, completion mode) and any rule changes needed for manual completion | 0 | Mark as Completed with calendar | additive; **no progress effect** |
| 5 | Soft delete for tasks and milestones (`deleted_at`, `deleted_by`), plus filters in list queries and counts | 4 | delete actions without losing history | additive |
| 6 | Align client / project fields the mobile needs (city, project type) with what live already has | 0 | forms and lists | additive; mostly mapping |
| 7 | Finance alignment (only after R6 shows the live shape): invoice line fields, payment reference, custom expense category, numbering, immutability of verified payments | 0, 3 | the new invoice, payment and expense forms | depends on live shape [U] |
| 8 | Audit hardening: make sensitive-action audit atomic; protect audit tables from edits | 2 | traceability for owner-only actions | additive |
| 9 | File attachments: **blocked** until a storage provider and plan limits are chosen | storage decision | receipts, proofs, submissions | n/a |
| 10 | Indexes for any new filter columns | 4, 5 | performance | additive |

Non-database prerequisites (code, not part of the migrations): align `varuag-os` mobile with `team_member`, `super_admin` and phases; replace task-derived progress selectors; replace the demo session with API login; remove the demo password and `?role=` switch; fix the TLS verification setting; review the Section 9 route items.

---

## 13. Tests and rollback plan

**Before anything**
1. Neon branch plus a fresh `pg_dump -Fc`; verify the restore into a throwaway database; store the dump outside the repo (it contains password hashes).
2. Apply every step to the **branch** first; run the sibling runner with `--dry-run`.

**Tests** (reuse the sibling suite and extend it)
- `npm run test:db` on a restored copy (earlier: 85 passed on a local copy [LM-R]); integration tests for auth, projects/tasks, finance, support, reports.
- New cases: official progress unchanged by task completion, task deletion and milestone edits (the key invariant); phase weights ≠ 100 keep tracking inactive; the 20/20/40/20 example gives 20%; completion date stored and editable without touching progress.
- Roles: for each of `super_admin`, `admin`, `team_member`, `client`, call every route and compare with `docs/ROLES-PERMISSIONS.md`; confirm `admin` cannot edit payment settings; clients see only their own data.
- Security: rate limits, invalid input returns 400 not 500, refresh rotation and reuse, password reset, TLS verification enabled.
- Data: row counts before and after each step match; checksums of core tables unchanged.

**Rollback**
- Preferred: restore from the Neon branch or the dump taken in step 1.
- `down` blocks exist but **011's `down` loses phase data and history**, so use it only before real data is entered.
- Never edit an applied migration file; corrections are new files.
- After each step, record the `_migrations` list and counts so a restore point is identifiable.

---

## 14. Open questions

1. What does Neon contain **today**? (Run R1–R19.) Which number is right: 39, 43 or 46?
2. Has migration 011 been applied since the last report? Have the payment-settings or storage proposals been applied?
3. **Is `intern` to be kept?** You listed four roles; the code and internship module use a fifth.
4. What exactly may `admin` do? The permissions document has no `admin` column.
5. Which role should `gauravkale216@gmail.com` hold: the existing owner (`super_admin`) or `admin`? Provision with the existing CLI, not by hand-inserting a hash.
6. Does each user have one role (`users.role_id`) or several (`user_roles`)?
7. The approved progress rule is explicit, but how should the **UI** treat milestones now: remove them, keep them as task groupers, or rename to phases? (This changes the milestone and task screens already built in `varuag-os`.)
8. Finance: confirm the live invoice, payment and expense shapes and the numbering rule before any change.
9. Storage provider and plan limits.
10. Are the credentials shown in the earlier session output still valid, and have they been rotated?
11. Do you want the sibling backend and the `varuag-os` mobile app joined (and if so, which mobile app is the product)?

---

**What I did not do:** modify code, migrations, environment files or data; open any `.env`; connect to Neon or any database; run any migration, seed or provisioning script; commit or push. The only file created is this one.
