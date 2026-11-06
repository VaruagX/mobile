# Varuag OS: Complete Database and Backend Audit

Read-only audit. No code, database or credential was changed, and the live Neon database was never contacted. No secret value appears in this report; environment variable **names** are mentioned where relevant.

## Evidence labels

| Tag | Meaning |
|---|---|
| **[G]** | Found in Git history (commits `52bb168` "push it to git", `8228534` "Integrate mobile app with authenticated backend API", `b0fc832` "db change"). Not in the working tree today. |
| **[C]** | Found in the current working tree. |
| **[I]** | Inferred from application code, not stated anywhere. |
| **[U]** | UNKNOWN / NOT VERIFIED. Includes everything about the live Neon database. |

---

## 1. Executive summary

- **The backend is not connected to any database.** [C] `backend/src/server.js` serves `/health` and returns `503` for every `/api/*` request. `backend/package.json` lists only `cors` and `express`: no `pg`, no `jsonwebtoken`, no `bcryptjs`. `backend/migrations/` and `backend/scripts/` are empty. `backend/.env` currently holds only `CORS_ORIGINS`, `NODE_ENV` and `PORT`.
- **The mobile app is not connected to the backend.** [C] There is no `fetch` or API client in `mobile/src`. Every screen reads and writes an in-memory store (`src/store/DemoStore.tsx`) seeded from `src/data/demo.ts`. Changes vanish on reload. Login accepts three hard-coded demo accounts with one hard-coded demo password.
- **A full authenticated API and a 25-table PostgreSQL schema did exist** and were deleted in commit `b0fc832`. [G] They are recoverable from `52bb168` (schema, migration runner, DB module) and `8228534` (22-endpoint API, JWT auth).
- **The old schema covers roughly 80% of the intended application.** It is well designed (UUID keys, CHECK constraints, trigger-enforced payment rules, progress views), but it has real gaps against the current mobile app and your requirements (Section 14 and 15). The main ones: no project type column, no client city, no task/milestone soft delete, no task completion date, a constraint that blocks manual task completion, no business or payment-account settings, no password reset, and `team` instead of `team_member` as the role name.
- **No `super_admin` role or account exists anywhere in source or Git history.** [G][C] The schema's role CHECK allows only `admin`, `team`, `client`. If a Super Admin exists in Neon, the live database was created differently from these files. Whether it exists is **[U]** and must be checked in Neon before any role change.
- **The old API had serious authorization gaps** (Section 13), so it should not be restored as-is. The most serious: team members could read all invoices and tickets; any user could attach a file to any project; any task could be verified without a submission; there was no input validation, and `cors()` was open to every origin.
- **Recommendation:** treat the old schema as a base, apply it only through forward migrations (never edit applied files), add the changes in Section 17 in dependency order on a **Neon branch first**, and build the missing API with the fixes in Section 13 before connecting the mobile app.

---

## 2. Current application architecture

| Layer | State | Evidence |
|---|---|---|
| Mobile app | React Native + Expo SDK 57, Expo Router, TypeScript, no networking | [C] `mobile/package.json`, `mobile/README.md` |
| Mobile data | In-memory store + demo seed. `Session.tsx` checks demo accounts and persists only the chosen role in AsyncStorage | [C] |
| Backend | Express 5 placeholder: `/health`, `/api/*` → 503, CORS allow-list from `CORS_ORIGINS` | [C] |
| Backend (previous) | Express + `pg` (Neon pooling), `bcryptjs`, `jsonwebtoken`, 22 endpoints | [G] `8228534` |
| Database (previous design) | PostgreSQL on Neon, raw SQL migrations 001–005, forward-only runner | [G] `52bb168` |
| Live Neon database | **[U]** | not contacted |

### Which functionality is real, database-backed, in-memory or UI-only

| Module | Real backend API today | DB queries today | In-memory demo | Hard-coded / mock | UI only (not implemented) |
|---|---|---|---|---|---|
| Login | no | no | yes (3 demo accounts) | demo password constant in `Session.tsx`; web `?role=` preview switch | |
| Change password | no | no | | | yes (shows a toast) |
| Notification preferences | no | no | local state | | yes (not saved) |
| Clients, team members | no | no | yes | | |
| Projects, milestones, tasks, submissions, blockers | no | no | yes | | |
| Invoices, payments, expenses | no | no | yes | UPI ID and bank details shown to clients are demo text | |
| Files | no | no | file **names** only | | picker lists names; no upload |
| Updates, messages, tickets, announcements | no | no | yes | | |
| Notifications | no | no | yes | | push not implemented (`expo-notifications` is not installed) |
| Reports, dashboards | no | no | computed from in-memory state | | |
| Public welcome / leadership | n/a | n/a | | static `site.ts` | |
| Online payment gateway | no | no | | | yes (“coming later”) |
| Activity / audit log | no | no | | | not written anywhere, even in the old API |

---

## 3. Actual backend connection status

1. **Working database connection: none.** [C] No driver, no connection module, no credentials in `backend/.env` (key names present: `CORS_ORIGINS`, `NODE_ENV`, `PORT`).
2. **The previous connection design** [G]: `pg` Pool, `DATABASE_URL` from env, `max: 10`, statement timeout 15 s, parameterised queries only, transaction helper, and a migration runner that refuses to run on a database that already has Varuag tables but no history table (`vos_schema_migrations`).
3. **Credentials note.** An earlier session in this conversation displayed a version of `backend/.env` that contained database and signing-secret entries (`DATABASE_URL`, `JWT_SECRET`, `DATABASE_RUNTIME_URL`, `DB_CONTEXT_KEY_ID`, `DB_CONTEXT_SIGNING_SECRET`, `NEON_DEVELOPMENT_DB_HOST`). Those entries are no longer in the file. Treat those credentials as exposed and rotate them if they are still valid. `.env` is git-ignored and was never committed. [G] (`git log --all -- backend/.env` is empty.)
4. **Unexplained design hints [U].** The names `DATABASE_RUNTIME_URL` and `DB_CONTEXT_*` suggest a separate restricted database role and a signed per-request database context. Nothing in the code or history uses them, and the empty folders `backend/security/` and `backend/test/helpers/` suggest unfinished work. Do not assume any of this exists in Neon.

---

## 4. Existing database schema found in source / Git history

All of Section 4 is **[G]** from commit `52bb168`, migrations 001–005, applied in order by the runner. None of it is in the working tree. Whether it exists in Neon is **[U]**.

**Shared objects**
- Functions: `set_updated_at()` (trigger), `ensure_internal_user()` (trigger; the column name is passed as the trigger argument), `check_payment_rules()` (trigger).
- Sequences: `project_code_seq`, `invoice_number_seq`, `receipt_number_seq`, `ticket_number_seq`.
- Views: `milestone_progress`, `project_progress`, `invoice_balances`.
- Runner history table: `vos_schema_migrations` (created by the runner, not by a migration file).
- Extensions: none required (`gen_random_uuid()` is built in from PostgreSQL 13).

### Identity (001)

| Table | Columns (type) | Keys / constraints / indexes |
|---|---|---|
| `clients` | id uuid, company_name text, contact_name text, email text, phone text, billing_address text, gstin text, status text, notes text, created_at, updated_at (timestamptz) | PK id; CHECK company_name not blank; CHECK status IN (`active`,`suspended`,`archived`); trigger `updated_at` |
| `users` | id uuid, role text, client_id uuid, name text, email text, password_hash text, phone, avatar_url, job_title, status text, must_change_password bool default true, last_login_at, created_by uuid, created_at, updated_at | PK id; FK client_id → clients RESTRICT; FK created_by → users SET NULL; CHECK role IN (`admin`,`team`,`client`); CHECK status IN (`active`,`suspended`,`disabled`); CHECK `(role='client') = (client_id IS NOT NULL)`; CHECK email has `@`; UNIQUE index on `lower(email)`; indexes on client_id and on role (active) |
| `refresh_tokens` | id, user_id, token_hash text UNIQUE, expires_at, revoked_at, replaced_by uuid, user_agent, created_at | FK user_id → users CASCADE; FK replaced_by → refresh_tokens SET NULL; partial index on live tokens |
| `push_tokens` | id, user_id, token UNIQUE, platform (`android`,`ios`,`web`), last_seen_at, created_at | FK user_id CASCADE |
| `notification_preferences` | user_id PK, push_enabled, task_updates, project_updates, billing_updates, support_updates (bool, default true), updated_at | FK user_id CASCADE |

### Projects, milestones, tasks (002)

| Table | Columns (type) | Keys / constraints / indexes |
|---|---|---|
| `projects` | id, code text UNIQUE default `'VL-P'+lpad(nextval)`, name, description, client_id, manager_id, status, priority, start_date, due_date (date), completed_at, archived_at (timestamptz), budget_amount numeric(12,2), currency char(3) default `INR`, created_by, created_at, updated_at | FK client_id RESTRICT; manager_id/created_by SET NULL; CHECK status IN (`planning`,`active`,`on_hold`,`completed`,`cancelled`); priority IN (`low`,`medium`,`high`,`urgent`); `due_date >= start_date`; `status<>'completed' OR completed_at IS NOT NULL`; budget ≥ 0; manager must be internal (trigger); indexes on client and on open projects |
| `project_members` | project_id, user_id, role (`lead`,`member`), added_by, added_at | PK (project_id, user_id); FKs CASCADE (project, user), SET NULL (added_by); user must be internal (trigger) |
| `milestones` | id, project_id, title, description, sort_order int, weight numeric(6,2) default 1, status (`pending`,`in_progress`,`completed`,`on_hold`), start_date, due_date, completed_at, client_visible bool default true, created_by, created_at, updated_at | FK project CASCADE; CHECK weight > 0; `due_date >= start_date`; index (project_id, sort_order) |
| `tasks` | id, milestone_id, title, description, assignee_id, weight numeric(6,2) default 1, priority, status (`todo`,`in_progress`,`blocked`,`in_review`,`changes_requested`,`done`,`cancelled`), sort_order, start_date, due_date, estimated_hours, actual_hours, submitted_at, verified_at, verified_by, created_by, created_at, updated_at | FK milestone **CASCADE**; assignee/verified_by/created_by SET NULL; CHECK weight > 0; dates; **`tasks_done_is_verified`: `status<>'done' OR verified_at IS NOT NULL`**; assignee must be internal (trigger); partial index on open tasks per assignee |
| `task_submissions` | id, task_id, submitted_by, revision int ≥ 1, notes, links jsonb (array), actual_hours, status (`pending`,`verified`,`changes_requested`,`withdrawn`), reviewed_by, review_note, reviewed_at, created_at | FK task CASCADE; UNIQUE (task_id, revision); one pending per task (partial unique index); reviewed rows need reviewed_at; changes need a note |
| `task_blockers` | id, task_id, reported_by, description, status (`open`,`resolved`), resolution_note, resolved_by, resolved_at, created_at | FK task CASCADE; resolved needs resolved_at |
| `task_status_history` | id bigint identity, task_id, from_status, to_status, changed_by, note, created_at | FK task CASCADE. **Nothing wrote to it in the old API.** |

**Progress views (002)**, the single source of truth in the old design:
- `milestone_progress`: per milestone, `progress_percent = 100 × Σ weight(status='done') ÷ Σ weight(status<>'cancelled')`, 0 when there are no active tasks.
- `project_progress`: `Σ(milestone weight × milestone progress) ÷ Σ milestone weights`; counts `milestones_done` where progress = 100.

### Files, updates, messages, audit (003)

| Table | Notes |
|---|---|
| `files` | id, project_id (CASCADE), milestone_id / task_id / submission_id (SET NULL), storage_provider, storage_key (UNIQUE with provider), original_name, mime_type, size_bytes ≤ 100 MB, checksum_sha256, visibility (`internal`,`client`), status (`uploading`,`ready`,`deleted`), uploaded_by, created_at, deleted_at. Metadata only; the **storage provider is undecided** ("chosen later"). |
| `project_updates` | client-facing updates; status (`draft`,`pending_approval`,`published`,`archived`); published requires approved_at and published_at; partial index for the client feed |
| `project_update_files` | join (update_id, file_id), CASCADE |
| `project_messages` | internal team thread per project, optional task_id; body ≤ 4000; edited_at, deleted_at (soft); author must be internal |
| `activity_log` | id bigint identity, project_id (**CASCADE**), actor_id, action, entity_type, entity_id uuid (no FK), meta jsonb, client_visible bool, created_at. Described as append-only but nothing enforces it, and **nothing wrote to it**. |

### Finance (004)

| Table / view | Notes |
|---|---|
| `invoices` | id, invoice_number text UNIQUE (assigned by the API, no default), client_id (RESTRICT), project_id / milestone_id (SET NULL), title, status (`draft`,`issued`,`void`), issue_date, due_date, currency, subtotal / discount_total / tax_total / total numeric(12,2) ≥ 0, notes, terms, created_by, issued_at, voided_at, void_reason, timestamps. CHECK: issued needs issue_date and issued_at; void needs voided_at and void_reason; `due_date >= issue_date`. |
| `invoice_items` | invoice_id (CASCADE), sort_order, description, quantity numeric(10,2) > 0, unit_price numeric(12,2) ≥ 0, tax_rate numeric(5,2) 0–100, line_total numeric(12,2) |
| `payments` | invoice_id (RESTRICT), amount numeric(12,2) > 0, method (`upi`,`bank_transfer`,`cash`,`online`), channel (`manual`,`gateway`), status (`pending`,`verified`,`rejected`), paid_on date, reference, payer_note, proof_file_id, submitted_by, verified_by, verified_at, rejection_reason, receipt_number UNIQUE, receipt_file_id, gateway_provider, gateway_payment_id, timestamps. CHECKs: gateway ⇔ method `online`; verified needs verified_at and receipt_number; rejected needs a reason. Unique index on gateway reference. |
| `check_payment_rules()` trigger | payments only against **issued** invoices; verified payments can never exceed the invoice total; a verified payment’s amount, invoice, method and status cannot change |
| `invoice_balances` view | amount_paid (verified), amount_pending_verification, balance_due, payment_state (`draft`,`void`,`paid`,`overdue`,`partially_paid`,`unpaid`) using `Asia/Kolkata` for “today” |
| `expenses` | category text (free text), description, amount > 0, expense_date, project_id (SET NULL), receipt_file_id, status (`pending`,`approved`,`rejected`), created_by, reviewed_by, reviewed_at, timestamps. Comment says admin only. |

### Support and notifications (005)

| Table | Notes |
|---|---|
| `support_tickets` | ticket_number UNIQUE default `'VL-T'+lpad(nextval,5)`, client_id (RESTRICT), project_id, raised_by, assigned_to (internal only), subject, description, priority, status (`open`,`in_progress`,`waiting_on_client`,`resolved`,`closed`), resolved_at, closed_at |
| `ticket_messages` | ticket_id (CASCADE), author_id, body ≤ 8000, is_internal bool |
| `announcements` | title, body, audience (`all`,`team`,`client`), created_by, published_at (nullable), created_at |
| `notifications` | user_id (CASCADE), type text, title, body, data jsonb, dedupe_key (unique per user), read_at, created_at |

### The 22 API endpoints that existed [G] (`8228534`)

`GET /health`; auth: `POST /api/auth/login`, `/refresh`, `/logout`, `GET /api/auth/me`; `GET /api/dashboard`; `GET /api/projects`, `/api/projects/:id`, `/api/projects/:id/tasks`; `PATCH /api/tasks/:id/status`; `POST /api/tasks/:id/verify`; `GET /api/invoices`; `POST /api/invoices/:id/payments`; `POST /api/payments/:id/verify`; `GET /api/notifications`; `GET`/`POST /api/projects/:id/messages`; `POST /api/projects/:id/updates`; `POST /api/files`, `POST /api/files/:id/complete`; `GET`/`POST /api/support/tickets`.

---

## 5. Complete proposed database table list

**Existing, kept (25 tables):** `clients`, `users`, `refresh_tokens`, `push_tokens`, `notification_preferences`, `projects`, `project_members`, `milestones`, `tasks`, `task_submissions`, `task_blockers`, `task_status_history`, `files`, `project_updates`, `project_update_files`, `project_messages`, `activity_log`, `invoices`, `invoice_items`, `payments`, `expenses`, `support_tickets`, `ticket_messages`, `announcements`, `notifications`.

**New, required:**

| Table | Purpose | Depended on by |
|---|---|---|
| `password_reset_tokens` | hashed, single-use, expiring reset tokens | forgot / reset password; first-login password change |
| `business_settings` | legal name, address, state, GSTIN, invoice prefix, default GST %, default invoice terms, logo file | invoice header and footer, PDF, reports |
| `payment_accounts` | the business UPI IDs and bank accounts shown to clients | Record Payment (client view) |
| `invoice_counters` (or per-year sequences) | gap-free-by-design invoice numbering per financial year | Create Invoice |
| `audit_log` | global append-only log (user created, role changed, invoice voided, payment verified, login events). `activity_log` is project-scoped and cascades away with a project. | admin audit, security review |

**New, optional (decide first, see Section 20):** `invoice_status_history`, `login_attempts` (or lockout columns on `users`), `task_assignees` (only if a task may have several assignees), `project_types` and `expense_categories` lookup tables (alternatives to a CHECK / free text).

---

## 6. Table-by-table requirements (changes to existing tables)

| Table | Add / change | Reason |
|---|---|---|
| `users` | role value `team` → **`team_member`** (CHECK, `ensure_internal_user`, API, mobile); add `password_changed_at`; optional lockout columns; guard so at least one active `admin` always remains | your intended role set; no password-change tracking; no last-admin protection |
| `clients` | add **`city`** (mobile reads it everywhere); optional `state` for GST; status change must also cascade to the client’s logins | mobile `Client.city` has no column; suspended clients’ users can still log in |
| `projects` | add **project type** (`website`, `web_app`, `mobile_app`, `branding`; mobile sends “Website / Web app / Mobile app / Branding”); keep manager_id and project_members in sync (see Section 9) | `Project.category` has no column |
| `milestones` | add `deleted_at`, `deleted_by`; `completed_on date`; decide milestone status derivation | soft delete; completion date; “Completed” while progress is incomplete |
| `tasks` | add `deleted_at`, `deleted_by`; **`completed_on date`**, `completed_by`, `completion_mode` (`reviewed` / `manual`); **relax `tasks_done_is_verified`** | manual completion with a chosen date; the constraint currently blocks it |
| `task_status_history` | write one row for every status change; make append-only | audit; currently never written |
| `activity_log` | change `project_id` FK from CASCADE to SET NULL (or RESTRICT); make append-only; start writing | deleting a project erases its audit trail |
| `invoices` | immutability after issue; invoice-number source; optional place-of-supply / state; total consistency checks | financial integrity |
| `invoice_items` | optional `hsn_sac` code; guard edits after issue | GST invoices; integrity |
| `payments` | block DELETE; align receipt number format; optional paid_on ≤ today guard | verified payments can currently be deleted; receipt format differs between old API and mobile |
| `expenses` | require reviewer when status ≠ pending; keep `created_by` populated | approval audit |
| `files` | storage provider must be chosen before this table can be used; optional `ticket_id` | receipts, proofs, submissions all depend on it |
| `notifications` | none required; mobile `kind` maps to `type`, `href` maps into `data` | mapping only |

---

## 7. Authentication and role requirements

### What existed [G]
- **Login:** email + password; `lower(email)` match; account must be `active`; `bcryptjs` compare; updates `last_login_at`. Response contains the user, an access token and a refresh token.
- **Access token:** JWT signed with `JWT_SECRET`, 15 minutes, claims `sub`, `role`, `clientId`. The middleware re-reads the user from the database on every request, so a suspended user is blocked immediately.
- **Refresh token:** random value, stored as SHA-256 hash, 30 days, rotated inside a transaction with `FOR UPDATE`; the old token is revoked and linked through `replaced_by`.
- **Logout:** revokes only the supplied refresh token.
- **Role checks:** an `allow(...roles)` middleware on some routes.

### What did not exist [G] (confirmed missing)
- Registration or any user-creation endpoint (accounts were meant to be admin-provisioned, but no provisioning code or seed script exists in history).
- Change-password, forgot-password and reset-password endpoints (the table has `must_change_password`; nothing reads or clears it; the mobile “Change password” sheet is UI only).
- Account lockout, login rate limiting, “log out everywhere”.
- Refresh-token **reuse detection**: the schema comment says a reused token can revoke its chain; the code just rejects it.

### Target role structure
Roles: `admin`, `team_member`, `client`. No `super_admin`.

Everything that names a role must change together:
- The `users.role` CHECK constraint and the `users_client_link` constraint (the latter only mentions `client`, so it is unaffected).
- `ensure_internal_user()` hard-codes `('admin','team')`; it is called by triggers on projects.manager_id, project_members.user_id, tasks.assignee_id, project_messages.author_id and support_tickets.assigned_to.
- `announcements.audience` allows `team`; decide whether it becomes `team_member`.
- The JWT `role` claim, `allow('admin','team')` calls, and mobile `Role` type, `HOME_ROUTE`, `DEMO_ACCOUNTS`, `RoleTabs` and every `role === 'team'` check.
- Mobile persists the role in AsyncStorage (`vos.session.role`). That is a convenience only; once the API exists the role must come from the verified token, not local storage. The web-only `?role=` preview switch must be removed from production builds.

### Super Admin dependencies
Because no `super_admin` appears anywhere in code or history, **the dependencies cannot be listed from source. [U]** Before any role change, in Neon (read-only):
1. List the distinct values in `users.role` and count rows per value.
2. Check whether a CHECK constraint on `users.role` exists, and whether it matches migration 001.
3. Identify the Super Admin row’s id and every table referencing it. From the schema, user-referencing foreign keys are: `users.created_by` (SET NULL), `refresh_tokens` / `push_tokens` / `notification_preferences` / `notifications` (CASCADE), `project_members.user_id` (CASCADE) and `added_by` (SET NULL), `projects.manager_id` / `created_by`, `milestones.created_by`, `tasks.assignee_id` / `verified_by` / `created_by`, `task_submissions`, `task_blockers`, `task_status_history.changed_by`, `files.uploaded_by`, `project_updates.author_id` / `approved_by`, `project_messages.author_id`, `activity_log.actor_id`, `invoices.created_by`, `payments.submitted_by` / `verified_by`, `expenses.created_by` / `reviewed_by`, `support_tickets.raised_by` / `assigned_to`, `ticket_messages.author_id`, `announcements.created_by` (all SET NULL unless noted).
4. The safe path is to **change that account’s role to `admin` in place**, which keeps its id and all attribution. Do **not** delete it: a delete would cascade away its tokens and notifications, null all attribution, and could leave the system without an admin.
5. There is no database guard against removing or demoting the last active admin; add one.

---

## 8. Admin account provisioning requirements

Target admin email: `gauravkale216@gmail.com` (not created by this audit).

Safe process for the future setup (no password appears in this report or in any SQL file):
1. Generate the password hash **outside the database**, in a one-off local script using the same library as login (`bcryptjs`, cost factor 12 or higher). The cost factor used previously is **[U]**: no hashing code exists in history.
2. The password is entered interactively or read from a throw-away environment variable. It must never be written to a file, to Git, to chat, or to an SQL text.
3. The setup inserts one `users` row: role `admin`, `client_id` null, status `active`, `must_change_password = true`, the **hash** only, email stored as given (uniqueness is on `lower(email)`).
4. If a Super Admin already holds this email, update that row’s role instead of inserting (the unique email index would reject a second row).
5. Requires, before first real use: a working change-password endpoint (not yet built), so the temporary password can be replaced.
6. Pasting only the hash into the Neon SQL editor is acceptable; the plaintext never reaches Neon’s query history.

Admin capabilities map to endpoints that **do not exist yet** (Section 14): create/manage team members and clients, projects, assignments, milestones, tasks, invoices, payments, expenses, dashboards.

---

## 9. Project, milestone and task requirements

### Required structure vs what exists

| Requirement | Exists? | Gap |
|---|---|---|
| Projects: client, priority, start/due, budget | yes | **no project type column** |
| Project members | yes (`project_members`) | `projects.manager_id` and `project_members.role='lead'` overlap; pick one source of truth |
| Milestones with weights, dates, client visibility | yes | no soft delete; no completion date as a date; status can contradict progress |
| Tasks: weight, priority, assignee, status, due date | yes | no soft delete; no completion date; **constraint blocks manual completion** |
| Task submissions, reviews | yes | the old API never created or reviewed submissions |
| Blockers | yes | never exposed by the old API |
| Status history | yes | never written |
| Activity log | yes | never written; cascades with a project |
| Multiple assignees per task | **no** (single `assignee_id`) | only needed if you want it **[U]** |
| Task assignee must be a project member | **no** (only “internal user” is enforced) | mobile restricts it in the UI; the database does not |

### Progress calculation
- Intended: `milestone = completed task weight ÷ total active task weight × 100`; `project = weighted average of milestone progress by milestone weight`.
- **Existing views [G] and mobile selectors [C] already implement exactly this**, treating `done` as completed and `cancelled` as inactive. They agree with each other and with your intended rule.
- Conflicts and edge cases:
  1. `done` currently means **admin-verified**. Manual completion needs `done` to be reachable without a submission, so the constraint must change (see below).
  2. A milestone with no active tasks counts as 0% but **still counts in the project’s weight denominator**, so a project can never reach 100% while an empty milestone exists.
  3. Neither view excludes soft-deleted rows (there are none yet) or `on_hold` milestones.
  4. Milestone `status` is independent of progress; nothing keeps `completed` consistent. A cross-table rule cannot be a CHECK; use a trigger that recomputes it from task changes, or **derive the displayed status from progress** and keep stored status for `pending` / `on_hold` only.
  5. Weights are relative, not percentages, and nothing enforces a total of 100. Decide whether to enforce, display, or normalise.
  6. Project completion: `projects_completed_at` requires `completed_at` when status is `completed`; the mobile store does not set it.

### Required constraint and column changes for the manual-completion workflow
- Add `tasks.completed_on date`, `completed_by`, and a mode (`reviewed` / `manual`); add `milestones.completed_on date`. Keep `verified_at` as the **system** timestamp of approval; never reuse it as the user-chosen completion date.
- Replace `tasks_done_is_verified` with a rule that `done` requires `completed_on` **and** either an approver (`verified_at`/`verified_by`) or a manual completer (`completed_by`).
- A completion date must not be in the future, and should not be before the project start (enforce in the API; a trigger is optional).
- Editing a completion date must write an audit row (old value, new value, actor).
- Reopening a task clears the completion fields but keeps the history rows.

### Soft delete
- Add `deleted_at`, `deleted_by` to `milestones` and `tasks`; every query, partial index and both progress views must filter `deleted_at IS NULL`.
- Today both foreign keys are `ON DELETE CASCADE`: a hard delete erases submissions, blockers and status history, and silently lowers project progress. Hard delete should be limited to an admin-only purge of rows with no completed work or history.
- Related rows (`files`, `project_messages`, `project_updates`, notifications `data`) use SET NULL or carry no foreign key, so they keep dangling references. Soft delete avoids this.

---

## 10. Client and team member requirements

- **Client records vs login accounts.** [G] They are linked only by `users.client_id`. `clients.email` has no uniqueness and no link to a specific user; nothing guarantees a client has a login or that its contact email matches it. The mobile store creates the user with the client’s email when “portal login” is on. **They are not synchronised by any constraint.**
- **Suspending or archiving a client does not block its users.** [G] Login and the auth middleware check only `users.status`. Needs either a join to `clients.status` or a cascade done by the API, plus revoking refresh tokens.
- **Client city** is used on screens and in the new invoice and project forms but has no column.
- **Search** (name, company) is done in memory in the mobile app. At this data size ordinary queries are enough; a trigram index is optional.
- **Team members:** `users` with role `team`; `job_title` exists; `project_members` links them to projects. Activation and deactivation use `users.status`, which is enforced on every request. Needs: a user-creation endpoint, an edit endpoint, and a rule that deactivating a user revokes their refresh tokens.
- **Ownership and access:** the old API restricted clients by `client_id` but **not team members** to their assigned projects (Section 13).

---

## 11. Invoice, payment and expense requirements

### Invoices
- **Numbering.** The schema has `invoice_number UNIQUE` and a sequence, but **the numbering rule was never implemented**: the old API has no invoice-creation endpoint. The mobile demo uses `VL-INV-2026-` plus a number derived from the list length, which can collide after deletions. The “existing numbering rule” is therefore **[U]**; only the `VL-INV-<year>-<4 digits>` pattern is observable. A global sequence plus a year in the text will not restart each year; if numbering must restart per financial year (April–March for Indian GST), use a counter table updated in the same transaction as the insert. Number gaps are possible with sequences after rollbacks, which matters if consecutive numbering is a compliance requirement.
- **Line items:** quantity, unit price, GST rate per line, `line_total`. Totals are computed by application code (`invoiceTotals`: rounds subtotal and tax separately). **The database does not verify** that `line_total` equals quantity × price × (1 + rate), nor that the header totals equal the item sums. One agreed rounding rule is needed (per line or per invoice) so mobile, API and reports agree to the paisa.
- **GST:** only a per-line percentage exists. There is no CGST / SGST / IGST split, no place of supply, no supplier GSTIN setting and no HSN/SAC codes. Confirm whether these are required (Section 20).
- **Statuses:** stored `draft`, `issued`, `void`. `paid`, `overdue`, `partially_paid`, `unpaid` are **derived** by `invoice_balances`. “Cancelled” in your list corresponds to `void`.
- **Immutability:** nothing stops editing items or totals after an invoice is issued. Voiding an invoice that has verified payments is also not blocked.
- **History:** no invoice status history; rely on `audit_log` once it is written.
- **Deletion:** payments are `ON DELETE RESTRICT` against invoices, but a draft or payment-free issued invoice can be hard-deleted, leaving a number gap.

### Payments
- Manual flow: client or admin records a payment as `pending`; admin verifies (receipt number issued) or rejects with a reason. Admin can also record and verify in one step, which requires inserting the row already verified with a receipt number.
- Only **verified** payments reduce the balance; partial payments are supported; the trigger caps verified payments at the invoice total and freezes verified rows.
- **Gaps:** the database enforces only the verified cap. The mobile rule “pending + verified must not exceed the total” (and the new “not in the future / not before issue” date rules) is **not** enforced by the database, and the old payment endpoint had no amount, method or balance validation. A verified payment cannot be updated but **can be deleted**. Receipt format differs: old API `VL-REC-00001`, mobile demo `VL-RCPT-0007`.
- UPI transaction ID and bank UTR live in `payments.reference`; cash needs none. Reference length rules exist only in the mobile form.

### Expenses
- Fields: category (free text), description, amount, date, optional project, optional receipt file, status `pending` / `approved` / `rejected`, creator, reviewer.
- A custom category is already possible (free text); `reports` sums amounts only, so custom categories do not break it.
- `project_id` is SET NULL when a project is deleted, silently dropping the association.
- Receipt attachment depends on file storage, which does not exist.
- No tax model for expenses exists in the schema or the mobile app.

### Consistency
- Mobile and schema use the same statuses and the same progress / balance formulas, so there is no known calculation conflict, **except** the paise-rounding question and the receipt format above.

---

## 12. Other module requirements

| Module | Needed | Missing |
|---|---|---|
| Notifications | table exists; mobile `kind` + `href` map to `type` + `data` | creation logic, mark-read, preference save, push-token registration, and the push delivery job (`expo-notifications` is not installed) |
| Messages | `project_messages` (internal) | create/edit/delete endpoints with project-membership checks |
| File attachments | `files` metadata | **storage provider undecided**; no signed upload/download URLs; blocks receipts, payment proofs, submissions and update attachments |
| Support tickets | tables exist | ticket status changes, internal-note handling, link to files, project/client consistency check |
| Dashboard statistics | old `/api/dashboard` returned four counts | role-scoped finance and project summaries (could be views) |
| Business settings | **none** | `business_settings` |
| UPI / bank settings | **none** (mobile shows hard-coded demo text) | `payment_accounts` |
| User profiles | `users` columns exist | edit endpoint, avatar upload (needs storage) |
| Activity logs | table exists, never written | writers for create/update/delete/status/verify; global `audit_log` |
| Audit logs | none global | `audit_log`, append-only |

---

## 13. Security findings

### In the previous API [G] (report only, nothing fixed)

| # | Severity | Finding |
|---|---|---|
| 1 | High | **`POST /api/files` has no access check.** Any authenticated user, including a client, can register a file against any project, task or submission id. Client uploads are forced to `visibility='client'`, so a client could inject files into another client’s project feed. |
| 2 | High | **Team members can read all invoices** (`GET /api/invoices` filters only for clients) and all support tickets. Finance data is exposed to the wrong role. |
| 3 | High | **`POST /api/tasks/:id/verify` verifies any task** regardless of its status or whether a submission exists, bypassing the review workflow; it neither updates the submission row, writes history, nor notifies. |
| 4 | High | **`PATCH /api/tasks/:id/status` accepts any string** and lets any project member move any task in the project (not only their own). Setting `done` violates the database constraint and returns a 500. It writes no history. |
| 5 | Medium | Team members can list **all projects**, not only theirs (`projectScope` restricts clients only); project messages and updates are not checked against project membership. |
| 6 | Medium | **Clients receive internal data:** `GET /api/projects/:id/tasks` returns every task, and `/api/projects/:id` returns milestones regardless of `client_visible`. List endpoints use `SELECT *`, which also exposes `budget_amount`, `manager_id`, `created_by` and invoice notes to clients. Whether clients may see budgets is a business decision. |
| 7 | Medium | **No input validation anywhere.** Invalid enums, dates and amounts reach the database and surface as generic 500s. `POST` payments accepts any amount or method. |
| 8 | Medium | **No rate limiting, lockout or security headers.** `cors()` allowed every origin in `8228534` (the current placeholder has an allow-list). The JWT algorithm is not pinned in `verify`. |
| 9 | Medium | **Refresh-token reuse detection is claimed in a schema comment but not implemented.** A stolen, already-rotated token is merely rejected; its chain stays valid. |
| 10 | Medium | Login does not compare against a dummy hash for unknown emails, so response time can reveal which emails exist. |
| 11 | Medium | **Suspended or archived clients’ users can still sign in** (only `users.status` is checked). |
| 12 | Low | `POST /api/support/tickets` accepts any `projectId`, so a client can attach a ticket to another client’s project. |
| 13 | Low | Nothing writes `activity_log` or `task_status_history`, so there is no audit trail. |
| 14 | Info | **SQL injection: none found.** Every query is parameterised; the only interpolated fragments are fixed strings built in code. |
| 15 | Info | Password hashing uses `bcryptjs`; the cost factor is **[U]**. Refresh tokens are stored hashed (SHA-256). Access tokens are 15 minutes and the user is re-checked on every request, which is good. |

### In the current app / repo [C]
- The mobile app contains a **hard-coded demo password** and demo accounts. They must be removed when the API replaces local login.
- Role is stored client-side in AsyncStorage and the web build honours `?role=`. Neither is acceptable as a trust boundary.
- `backend/.env` credentials were exposed in an earlier session output (Section 3).
- **Database level:** there is **no Row Level Security**; isolation depends entirely on the API. Foreign-key integrity is otherwise strong (RESTRICT on clients and invoices, SET NULL for attribution). Payment protection at the database level is good (verified cap and immutability) but incomplete (deletes, pending cap, dates).

### Sensitive payment information
UTR / UPI references and proof files should be visible only to admins and the paying client; the old API did not return payments at all, so no rule existed. Bank account details intended for clients should be served from `payment_accounts`, to authenticated users only, and never logged.

---

## 14. Missing APIs and database functionality

The old API covered 22 endpoints. **Not implemented anywhere**, so all of these are missing:

- **Auth:** change password, forgot / reset password, admin creates user, edit user, activate / deactivate user, revoke sessions, push-token registration.
- **People:** create / edit / suspend client; client login creation and sync; team member CRUD; project member management.
- **Projects:** create, edit, status change, archive; project type.
- **Milestones:** create, edit, reorder, set status, soft delete, restore.
- **Tasks:** create, edit, reassign, set priority, manual completion with date, edit completion date, reopen, soft delete, restore; submit work; review (verify / request changes); report and resolve blockers; status history writes.
- **Finance:** create / edit draft invoices and items, issue, void, number generation, payment reject, record-and-verify, expenses (create, list, approve, reject), reports and summaries.
- **Comms:** announcements, ticket replies and status, notification mark-read and preferences, message edit / delete.
- **Platform:** file upload and download URLs (storage provider needed), settings (business and payment accounts), audit writers, search endpoints, health with DB check.

---

## 15. Existing constraints that must change

1. `users.role` CHECK: `team` → `team_member` (and `ensure_internal_user()` with it).
2. `tasks_done_is_verified`: must allow manual completion with a chosen `completed_on` (Section 9).
3. `activity_log.project_id` ON DELETE CASCADE: audit history must survive project deletion.
4. `milestones` / `tasks` ON DELETE CASCADE: hard-delete path must be restricted in favour of soft delete.
5. `projects_completed_at`: the API must set `completed_at` whenever status becomes `completed`.
6. `milestone_progress` / `project_progress`: filter soft-deleted rows; decide on empty milestones and `on_hold`.
7. `announcements.audience` value `team` (follows the role decision).
8. Optional: the payments rules trigger should also cap pending + verified, and guard dates, to match the mobile form.

---

## 16. Data migration and backward-compatibility risks

Three possible live states, all **[U]**:
- **A. Neon is empty or new.** Apply restored 001–005 plus new forward migrations. Lowest risk.
- **B. Neon already has 001–005 applied** (runner history table present). The runner **checksums** applied files, so the originals must be restored **byte-for-byte** from `52bb168`, and every change must be a **new** file (006 onwards). Editing 001–005 would stop the runner. The working tree no longer contains them.
- **C. Neon holds a different or legacy schema** (the runner’s guard mentions a legacy Varuag Labs database; a Super Admin row would also point here). Do not apply anything until its real schema has been inventoried.

Other risks:
- Renaming role `team` → `team_member` changes stored data, a constraint, a function, the JWT claim and the mobile code in one release. Stage it so old and new values are both accepted during the change, and change the mobile app and the API together.
- Adding NOT NULL columns (project type, task completion fields) to tables with rows needs defaults or a backfill.
- Replacing views drops dependent privileges; recreate them in the same migration.
- Soft delete changes every query and index; any client or report not updated would keep showing deleted rows.
- The mobile app’s demo IDs (`u-admin`, `p-realty`) are strings, not UUIDs; real data will have UUIDs, so any code that assumes demo IDs must go.
- Numbering: switching to per-year counters must continue after the highest existing number in live data.
- Receipt format reconciliation (`VL-REC-` vs `VL-RCPT-`) affects stored numbers only if live rows exist.

---

## 17. Proposed SQL operations, grouped by dependency

Descriptions only. No SQL has been written or run. Each phase depends on the ones before it. For each change: **why / screen or feature / tables and APIs affected / safe for existing rows? / data migration?**

**Phase 0: read-only discovery in Neon (before anything else)**

| # | Check | Why | Safe | Migration |
|---|---|---|---|---|
| 0.1 | List all tables, columns, constraints, indexes, views, functions, sequences, extensions | find which state (A / B / C) is live | read-only | none |
| 0.2 | Inspect `vos_schema_migrations` (if present) and compare checksums with `52bb168` | decide whether 001–005 are applied unmodified | read-only | none |
| 0.3 | Distinct `users.role` values and row counts; locate the Super Admin row and everything referencing it | role-change plan (Section 7) | read-only | none |
| 0.4 | Row counts per table | scope of backfills | read-only | none |
| 0.5 | Confirm PostgreSQL version and Neon retention / branching availability | rollback plan | read-only | none |

**Phase 1: safety net**

| # | Operation | Why | Safe | Migration |
|---|---|---|---|---|
| 1.1 | Create a Neon **branch** from the live database and apply everything there first | rehearsal; instant rollback | yes | none |
| 1.2 | Take a logical export (`pg_dump`) before any live change | independent backup | yes | none |

**Phase 2: base schema (only if state A, or restoring missing objects)**

| # | Operation | Why | Safe | Migration |
|---|---|---|---|---|
| 2.1 | Restore migrations 001–005 unchanged from `52bb168` | establishes the base | yes on empty DB; on state B skip | none |

**Phase 3: identity and roles**

| # | Operation | Why / feature | Tables affected | Safe | Migration |
|---|---|---|---|---|---|
| 3.1 | Allow `team_member` alongside `team` in the role CHECK and in `ensure_internal_user()` | intended roles; every admin and team screen | `users`, five trigger tables | yes (additive) | none yet |
| 3.2 | Convert existing `team` rows to `team_member`; convert any Super Admin to `admin` **in place** | final role set; keeps ids | `users` | yes if ids kept | yes (data) |
| 3.3 | Remove `team` from the CHECK and function, rename `announcements.audience` `team` if chosen | finish the rename | `users`, `announcements` | yes after 3.2 | yes (data) |
| 3.4 | Guard: at least one active `admin` must remain | prevent lock-out | `users` | yes | none |
| 3.5 | Add `password_changed_at`; optional lockout columns | change-password, lockout | `users` | yes | none |
| 3.6 | Create `password_reset_tokens` | forgot / reset password | new | yes | none |
| 3.7 | Optional: refresh-token family column for reuse detection | session security | `refresh_tokens` | yes | none |
| 3.8 | Provision the admin account (hash generated outside the DB, Section 8) | first login | `users` | yes | none |

**Phase 4: clients and settings**

| # | Operation | Why / feature | Tables | Safe | Migration |
|---|---|---|---|---|---|
| 4.1 | Add `clients.city` (and optional `state`) | client lists, project and invoice forms | `clients` | yes (nullable) | backfill optional |
| 4.2 | Create `business_settings`, `payment_accounts` | invoice header, Record Payment (client view) | new | yes | seed values by admin |
| 4.3 | Rule so suspending a client also suspends its logins (API or trigger) | access control | `clients`, `users`, `refresh_tokens` | yes | none |

**Phase 5: projects, milestones, tasks**

| # | Operation | Why / feature | Tables | Safe | Migration |
|---|---|---|---|---|---|
| 5.1 | Add project type column and CHECK | New Project form, project screens | `projects` | yes (default needed) | backfill existing |
| 5.2 | Add `deleted_at`, `deleted_by` to `milestones`, `tasks`; partial indexes | delete actions, safe soft delete | both | yes | none |
| 5.3 | Add `completed_on`, `completed_by`, completion mode to `tasks`; `completed_on` to `milestones` | Mark as Completed with calendar | both | yes (nullable) | backfill `completed_on` from `verified_at` for existing `done` rows |
| 5.4 | Replace `tasks_done_is_verified` with the new completion rule | manual completion | `tasks` | yes if 5.3 backfill is done first | yes |
| 5.5 | Replace `milestone_progress` and `project_progress` (exclude deleted; decide empty / on-hold milestones) | accurate progress | views | yes (views carry no data) | none |
| 5.6 | Milestone status derivation (trigger or computed) | “Completed” must match progress | `milestones`, `tasks` | yes | recompute existing |
| 5.7 | Optional trigger: task assignee must be a project member | matches the mobile rule | `tasks`, `project_members` | check existing rows first | maybe |
| 5.8 | Trigger or API write of `task_status_history`; make it append-only | history | `task_status_history` | yes | none |
| 5.9 | Change `activity_log.project_id` FK to SET NULL; append-only; start writing | audit survives deletion | `activity_log` | yes | none |
| 5.10 | Optional `task_assignees` | only if multiple assignees are wanted | new | yes | copy `assignee_id` |

**Phase 6: finance**

| # | Operation | Why / feature | Tables | Safe | Migration |
|---|---|---|---|---|---|
| 6.1 | Create `invoice_counters` and the numbering procedure | Create Invoice numbering | new | yes | start after highest live number |
| 6.2 | Guard against editing items and totals after issue; block void when verified payments exist | integrity | `invoices`, `invoice_items` | yes | none |
| 6.3 | Optional checks that line and header totals match the items | catch bad writes | both | verify existing rows first | possibly |
| 6.4 | Extend the payment rules trigger: cap pending + verified, date guards; block `DELETE` | match the mobile form; protect records | `payments` | yes | none |
| 6.5 | Align receipt-number format | consistency | `payments` | yes | only if live rows |
| 6.6 | Expense rule: reviewer required when status ≠ pending | audit | `expenses` | check existing rows | maybe |
| 6.7 | Optional `invoice_status_history`; optional HSN/SAC and place-of-supply columns | GST compliance / history | invoices, items | yes | none |

**Phase 7: audit and platform**

| # | Operation | Why / feature | Tables | Safe | Migration |
|---|---|---|---|---|---|
| 7.1 | Create global `audit_log`, append-only | admin audit | new | yes | none |
| 7.2 | Revoke UPDATE / DELETE on audit tables from the application role | tamper resistance | `audit_log`, `activity_log` | yes | none |
| 7.3 | Choose a storage provider, then confirm `files` columns | receipts, proofs, submissions | `files` | n/a | n/a |
| 7.4 | Optional `files.ticket_id` | ticket attachments | `files` | yes | none |
| 7.5 | Indexes for new filters (soft delete, search) | performance | several | yes | none |

---

## 18. Verification and testing plan

1. **Rehearse on a Neon branch.** Apply every phase there; run the discovery checks again.
2. **Constraint tests (each wrapped in a transaction and rolled back):** a client row without `client_id`; a team user assigned to nothing invalid; `done` without completion date rejected; manual completion accepted; a payment above the balance rejected; a verified payment edit and delete rejected; duplicate invoice number rejected; last admin removal rejected.
3. **Progress tests:** the 20/20/40/20 example gives 20%; deleting a task and a milestone recomputes; an empty milestone behaves as decided; reopening a milestone updates the project.
4. **Role tests:** admin, team member and client each call every endpoint; a client never receives another client’s data, internal tasks, budgets (if hidden) or payments of others; a team member sees only assigned projects and no finance.
5. **Auth tests:** wrong password, suspended user, suspended client, expired and reused refresh token, lockout, password change and reset.
6. **Finance tests:** GST by line, rounding to the paisa, partial payment, full payment, payment above balance, numbering under concurrent creation.
7. **Security tests:** SQL injection strings in every input, oversized bodies, invalid enums returning 400 rather than 500, CORS allow-list, rate limiting.
8. **Mobile regression:** replace the demo store screen by screen behind the API; compare displayed progress and balances with the database views.

---

## 19. Rollback and backup plan

- Before any live change: Neon **branch** or point-in-time restore point, plus a logical `pg_dump`. Retention length depends on the Neon plan (**[U]**).
- Migrations are **forward-only** and each runs in a single transaction (PostgreSQL DDL is transactional), so a failed file leaves nothing half-applied.
- There are no down migrations. Rollback means restoring from the branch or restore point taken in Phase 1, not reversing SQL.
- Never edit an applied migration file; corrections are new files.
- Keep the old schema’s tables and data until the new application has run on the branch for a full test cycle.
- For the role rename and the completion-rule change, keep the old and new forms accepted side by side until both the API and the mobile app have shipped.

---

## 20. Questions or unknowns requiring confirmation

1. **What is actually in Neon today?** Run the Phase 0 checks. Is the schema 001–005, something else, or empty?
2. **Does a Super Admin exist, and where is it defined?** The code and the schema never mention it.
3. Rename `team` to `team_member` everywhere (database, API, mobile), or keep `team` in storage and show `team_member` only in the API?
4. Keep the **submit-and-review** workflow alongside direct admin completion? (Recommended: keep both.)
5. Should a milestone’s displayed status be **derived** from progress, or stored and kept in sync by a trigger?
6. Empty milestones: exclude them from project progress, or count them as 0%?
7. Must milestone weights total 100 (enforced, shown as a warning, or normalised)?
8. Invoice numbering: per **financial year** (April–March) or calendar year? Must numbers be gap-free? What is the exact format?
9. GST: is a CGST / SGST / IGST split, place of supply, HSN/SAC and the business’s own GSTIN required on invoices?
10. Which rounding rule: per line or per invoice?
11. Should clients see project budgets and milestone weights?
12. Which file-storage provider (object storage service) will be used? Without it, receipts, proofs and submission files cannot be built.
13. Can one task have several assignees, or exactly one?
14. Should `projects.manager_id` or `project_members.role = 'lead'` be the single source of truth?
15. Hard delete: allowed at all for admins (purge of untouched rows), or soft delete only?
16. Are `DATABASE_RUNTIME_URL` and `DB_CONTEXT_*` part of a planned restricted-role / signed-context design? Should it be revived?
17. Password policy: minimum length, expiry, and whether email delivery (for reset) will be set up.
18. Should the demo accounts, the hard-coded demo password and the web `?role=` switch be removed when the API goes live? (Recommended: yes.)
19. Which of the credentials exposed in the earlier session are still valid and need rotating?

---

*Prepared as a read-only audit. Nothing has been implemented, and the live database has not been contacted. Waiting for approval before any further step.*
