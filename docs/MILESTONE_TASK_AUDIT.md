# Milestone, Task and Progress Audit

Status: read-only audit. No code, database record or data was changed. Awaiting approval before any implementation.

Legend: **[V]** verified by reading the code or git history. **[A]** assumption, not verifiable from the current repo.

## 0. Read this first: what the system is today

- **[V] The mobile app has no backend connection.** Every project, milestone and task lives in an in-memory store (`mobile/src/store/DemoStore.tsx`) seeded from `mobile/src/data/demo.ts`. Changes vanish on reload. There is no `fetch` in `mobile/src`.
- **[V] The backend is a placeholder.** `backend/src/server.js` serves `/health` and returns `503` for everything under `/api`. `backend/migrations/` and `backend/scripts/` are empty. There is no database driver in `backend/package.json`.
- **[V] The database work was removed in commit `b0fc832` ("db change").** The earlier schema and API still exist in git history: migrations at commit `52bb168`, API routes at `8228534`. This audit reads the schema from `52bb168:backend/migrations/001`–`005`.
- **[A] Whether the live Neon database matches those migrations is unknown.** I did not connect to it. `backend/.env` still holds Neon credentials, but I used none of them, so every "database" statement below describes the migration files in git history, not a live check.

Consequence: "backend is the source of truth for progress" is true only of the **removed** SQL views. Today the mobile app computes progress itself, and nothing is the source of truth beyond the in-memory state.

## 1. Existing milestone functionality

| Capability | Mobile (today) | Old API / DB (git history) |
|---|---|---|
| Create | **[V]** Yes, admin, `NewMilestoneSheet` → `createMilestone`. Fields: title, weight, start, due, description, client-visible. | **[V]** No API endpoint existed. Table `milestones` exists. |
| Edit name, description, weight, dates | **[V] No.** There is no edit sheet. `updateMilestone(id, patch)` exists in the store but only the status buttons call it. | **[V]** No endpoint. |
| Weight | **[V]** Free number, default `10`, must be `> 0`. Weights are **relative**, not percentages. They do not need to total 100, and nothing shows or checks a total. | **[V]** `weight numeric(6,2) CHECK (weight > 0)`. The SQL comment says the same: relative weights. |
| Start and due dates | **[V]** Plain text `YYYY-MM-DD`. Validation is a regex only, so `2026-02-31` passes. Due-before-start is **not** checked for milestones. | **[V]** `milestones_dates` constraint rejects due before start, so the database would reject what the UI allows. |
| Manual progress | **[V] Not supported.** A milestone has no progress field. | **[V]** None. |
| Mark completed | **[V]** Admin can set the status chip to `completed` (the milestone screen's Status option group). This changes only the label. | **[V]** `status` allows `pending`, `in_progress`, `completed`, `on_hold`. |
| Completion date | **[V]** Not captured. The mobile `Milestone` type has no completion field. | **[V]** Column `completed_at timestamptz` exists, but nothing sets it. |
| Delete | **[V] No.** | **[V]** No endpoint. |

## 2. Existing task functionality

| Capability | Mobile (today) | Old API / DB |
|---|---|---|
| Create | **[V]** Admin, `NewTaskSheet` → `createTask`. Starts as `todo`. | **[V]** No endpoint. |
| Edit (title, weight, dates...) | **[V] No edit UI.** | **[V]** No endpoint. |
| Assign | **[V]** Only at creation (choose one team member). Cannot reassign later. Notifies the assignee. | **[V]** `assignee_id` exists. A trigger restricts it to internal users. |
| Change status | **[V] Partly, only through fixed steps** (section 3). | **[V]** `PATCH /api/tasks/:id/status` accepted any status string. |
| Mark completed manually | **[V] Not possible.** | **[V]** `POST /api/tasks/:id/verify` (admin) set `status='done'`, `verified_at=now()`. |
| Actual completion date | **[V] Not possible.** The only date written is `verifiedAt`, set to "now" when an admin approves a submission. | **[V]** Only `verified_at`, set to `now()`. |
| Change completion date later | **[V] Not possible.** | **[V]** Not possible. |
| Delete | **[V] No.** | **[V]** No endpoint. |

### Why the expected manual-completion workflow is missing

**[V]** The app was built around **submit → admin review**, not "mark complete":

- The **task assignee** can only press Start task (`todo` → `in_progress`), report a blocker, or Submit work (→ `in_review`).
- The **admin** sees a button only when the task is `in_review`: Review submission → verified (`done`) or changes requested.
- The store has `setTaskStatus(taskId, status)`, but the UI calls it for exactly one transition (Start task).
- `done` is shown with the label **"Verified"**, not "Completed" (`mobile/src/lib/status.ts`).
- An admin cannot complete a task that has no submission, and no one can choose a completion date.

## 3. Current status options

Tasks **[V]** (`TaskStatus`): `todo` (To do), `in_progress`, `blocked`, `in_review`, `changes_requested` (Changes asked), `done` (displayed "Verified"), `cancelled`. Your terms map to Pending = `todo`, In Progress = `in_progress`, Completed = `done`.

Milestones **[V]**: `pending`, `in_progress`, `on_hold`, `completed`.

Transitions that exist in the UI **[V]**:

- `todo` → `in_progress` (assignee, Start task)
- `in_progress`/`todo`/`changes_requested` → `in_review` (assignee, Submit)
- `in_review` → `done` or `changes_requested` (admin)
- any → `blocked` (Report blocker)
- `blocked` → `in_progress` (admin, Mark resolved)

`cancelled` is excluded from progress but **no screen sets it**.

## 4. Current completion workflow

1. Admin creates a task and assigns it.
2. Assignee starts it, then submits notes, links and files.
3. Admin verifies (`done`, `verifiedAt = now`) or requests changes.
4. Only `done` counts toward progress.

**Verification of "Do not assume completion date = today":** the completion date is always "now", because the app has no date input there. `nowIso()` also pins the **date part to the fixed `DEMO_TODAY` (2026-11-05)** and only the time to the real clock, so every "now" in the demo is 5 Nov 2026.

## 5. Current date handling

- **[V]** Dates are `YYYY-MM-DD` strings. Entry is free text (`Field`), except the new Create Project form, which uses a calendar.
- **[V]** `isDate` is a regex only, so impossible dates pass.
- **[V]** Milestone and task forms do not enforce due ≥ start, nor that a task falls inside its milestone or project dates.
- **[V]** The project's start and due fields have a database CHECK (`due_date >= start_date`).
- **[V]** `DEMO_TODAY` is hard-coded and must be replaced by the real clock when the API is connected (the file comment says so).
- **[V]** The database types are `date` for planning dates and `timestamptz` for events (`verified_at`, `completed_at`).

## 6. Current progress calculation

Mobile `mobile/src/lib/selectors.ts` **[V]**:

```
milestone % = Σ weight(done tasks) ÷ Σ weight(non-cancelled tasks) × 100
project %   = Σ (milestone weight × milestone %) ÷ Σ milestone weights
```

The removed SQL views (`milestone_progress`, `project_progress`) implement the same formulas **[V]**. The two were written to agree, but there is no running backend to prove agreement.

Findings against your intended formula (`Σ(weight × milestone progress) / 100`):

| Check | Result |
|---|---|
| Your example: Discovery 20/20/40/20, Discovery 100% | **[V] Gives 20%** if Discovery has tasks and all are verified. This works because the divisor equals 100. |
| Weights that do not total 100 | **[V]** Handled safely (divides by the actual total). Your literal "÷ 100" would give wrong results here, so the current divisor is better. |
| Milestone progress is manually editable | **[V] No.** It is derived only from tasks. |
| Setting a milestone to "Completed" updates project progress | **[V] No.** Status is ignored by the maths. The chip can say "Completed" while progress is 0%. |
| Milestone with no tasks | **[V]** Always 0%, and it can never complete. |
| Task completion affects milestone progress | **[V] Yes**, only for `done` tasks, weighted by task weight. |
| New project starts at 0% | **[V]** Yes (no milestones → 0). |
| Editing weights recalculates | **[V]** Would, but there is no edit UI. |
| Reopening a completed milestone | **[V]** Not possible: there is no reopen action and no completed-date field to reset. |
| Historical completion dates preserved | **[V]** `verifiedAt` is kept in memory. Nothing records a milestone completion date. |
| Mobile vs backend consistent | **[A]** Cannot be tested; no backend is running. |
| Rounding | **[V]** Both round to 2 decimals. |

**Decision needed (impact report, nothing changed):** you described progress as "milestone weight × milestone progress" where milestones can be marked complete. The existing model derives progress from **task weights**. If you want a milestone's progress to be settable independently of its tasks, we need rules for the overlap (see Section 11 and Question 2 in Section 13).

## 7. Database schema and required changes

Existing columns **[V]** (from `52bb168` migration 002): `milestones` has `status`, `weight`, `start_date`, `due_date`, `completed_at`, `sort_order`. `tasks` has `status` (CHECK list), `due_date`, `start_date`, `submitted_at`, `verified_at`, `verified_by`, `actual_hours`, plus the constraint **`tasks_done_is_verified`**: `status <> 'done' OR verified_at IS NOT NULL`.

Needed changes (proposed, not applied):

1. **`tasks.completed_on date`** (nullable), the user-chosen actual completion date. The existing `verified_at` is a system timestamp of admin approval and must not be reused as the "actual" date. **A new field is required.**
2. **Status naming:** keep `done`, relabel to "Completed" in the UI. A separate "verified" notion stays only if you keep the review flow (see Section 13).
3. Relax or extend `tasks_done_is_verified` so a manual completion can set `done` with `verified_at` (set to the admin's confirmation time) and `verified_by`. Without this, manual completion by an admin hits a constraint error.
4. **`milestones.completed_at`** already exists. Make it settable and clearable on reopen. Consider a matching `completed_on date`.
5. Add a milestone progress override only if you choose that model (`progress_override numeric(5,2)` nullable).
6. **Soft delete:** `deleted_at timestamptz`, `deleted_by uuid` on `milestones` and `tasks` (see Section 10).
7. **Projects:** the schema requires `completed_at` when `status = 'completed'`. The mobile `updateProjectStatus` does not set it, so it would fail once connected.
8. Re-create the migrations from history (they are currently deleted from the working tree).

## 8. Backend API changes required

Today there is **no** API for any of this **[V]**. Required for a database-backed version: list/get projects with progress, create/update/delete milestones, create/update/delete tasks, `POST /tasks/:id/complete` with `{completedOn}`, `PATCH /tasks/:id/completion-date`, reopen endpoints, with admin-only authorization and server-side validation (allowed statuses, date order, weights).

Defects found in the **removed** old API **[V]** that must not be reintroduced:

- `PATCH /api/tasks/:id/status` accepted any string and could set `done` without `verified_at`, which the database constraint would reject with a 500.
- It also let a team member push their own task to arbitrary states without a transition check.
- There were no endpoints at all for create, edit or delete of milestones and tasks.

## 9. Mobile UI changes required

1. **Task screen:** show current status and a Mark as Completed action. It opens a calendar (reuse the calendar built for Create Project) defaulting to today, with a confirm step. Saves status and `completedOn`.
2. A way to **edit the completion date later** (admin).
3. **Edit** sheets for milestones and tasks (title, description, weight, dates, assignee).
4. **Delete** with a confirm dialog (a `Confirm` component already exists in `components/Form.tsx`).
5. Replace the free-text date fields with the calendar, with due-after-start checks.
6. Reword "Verified" to "Completed" if the review step is removed, or show both.
7. Show the weight as a share (for example "20% of project") and the total of weights, with a warning if it is not 100.

## 10. Delete functionality and data integrity

Nothing is deleted anywhere today **[V]**. Dependencies from the migrations **[V]**:

| Deleting | What follows |
|---|---|
| Milestone | `tasks.milestone_id` is **CASCADE**, so all its tasks go. Through tasks, **CASCADE** removes `task_submissions`, `task_blockers`, `task_status_history`. `files.milestone_id` and `project_updates.milestone_id` are **SET NULL** (rows survive, orphaned from the milestone). |
| Task | **CASCADE** removes its submissions, blockers and status history. `files.task_id` and `project_messages.task_id` are **SET NULL**. |
| Either | Project progress changes retroactively (completed work disappears from the totals). |
| Either | Notifications store `href` links in the demo store, so they would point at missing tasks. In the schema, `notifications.data` is JSON with no foreign key, so no constraint stops dangling links. |
| Either | `activity_log.entity_id` has no foreign key, so history rows stay but reference a missing entity. |

**Recommendation: soft delete.** A hard delete cascades away the submission and review history, status history and blocker records, and silently lowers project progress. Use `deleted_at`, exclude deleted rows in the progress views and lists, and keep permanent deletion for admins on rows that have no completed work or history. Require a confirm dialog and, for tasks with submissions or completed status, a stronger warning.

## 11. Exact bugs and missing functionality found

1. No edit or delete for milestones or tasks (mobile or API).
2. No manual task completion and no completion date (Section 4).
3. A milestone set to `completed` has no effect on progress, and the chip can contradict the percent. The percent screen shows `completed` only when percent is 100, but otherwise shows the stored status, so "Completed" can appear at 0%.
4. A milestone with no tasks is stuck at 0% and cannot be completed.
5. Milestone and task date entry is unvalidated free text. Impossible dates pass, and due-before-start is allowed for milestones where the database forbids it.
6. `nowIso()` pins every timestamp to 5 Nov 2026.
7. `cancelled` is a status no screen can set.
8. Task reassignment is impossible after creation.
9. Weights are relative but nothing displays the total or warns when it is not 100.
10. The `projects.completed_at` rule would break project completion once connected.
11. The old status endpoint had the validation gaps listed in Section 8.
12. The in-memory store has no authorization. Role checks exist only as UI conditions (`role === 'admin'`), so server-side enforcement is entirely absent.

## 12. What works and what does not

**Works today (in the demo app):** creating milestones and tasks; assigning at creation; start / submit / review workflow; blockers; milestone and project progress from verified task weights (including your 20/20/40/20 example when tasks are verified); client-visible milestones; role-based screens.

**Does not work / missing:** manual completion, completion dates, editing, deleting, reassigning, any persistence, any backend, calendar date entry for milestones and tasks, weight-total feedback.

## 13. Recommended implementation plan (awaiting approval)

Decisions needed from you:

1. Keep the **review step** (assignee submits, admin verifies), or switch to direct manual completion? Recommendation: keep both. Admins complete directly; assignees submit for review.
2. Progress model: keep it **derived from task weights** (recommended, one source of truth), or let milestones carry their own manual progress? A hybrid needs a precedence rule.
3. Soft vs permanent delete (recommended: soft, Section 10).
4. Should weights be shown and forced as percentages totalling 100?

Plan, in order:

1. Decide the four questions above.
2. Re-create the migrations from `52bb168` and add the Section 7 changes. Check them against a **disposable** database first, not production.
3. Build the backend: validated, role-checked endpoints and the progress views as the single source of truth.
4. Mobile: Mark as Completed with calendar and confirm, edit completion date, edit and delete sheets, calendar date inputs, weight totals.
5. Fix the small bugs (items 3, 5, 6, 7, 8 above).
6. Test the progress examples, the date edge cases, the delete cascade, and permissions per role.
7. Connect the mobile app to the API and remove the in-memory store.

Nothing in this plan has been started.
