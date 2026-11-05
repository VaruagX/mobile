-- ============================================================
-- Varuag OS · 002 · Project → Milestones → Tasks
--
-- Progress rule (single source of truth: the views at the bottom):
--   milestone % = Σ weight of tasks that are done (admin-verified)
--                 ÷ Σ weight of all non-cancelled tasks in the milestone
--   project %   = Σ (milestone weight × milestone %) ÷ Σ milestone weights
-- Weights are relative (they do not need to add up to 100).
-- A task only counts once an admin verifies it, so clients only ever
-- see approved progress.
-- ============================================================

CREATE SEQUENCE project_code_seq;

CREATE TABLE projects (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE
                 DEFAULT ('VL-P' || lpad(nextval('project_code_seq')::text, 4, '0')),
  name           text NOT NULL CHECK (length(btrim(name)) > 0),
  description    text,
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  manager_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'planning'
                 CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority       text NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date     date,
  due_date       date,
  completed_at   timestamptz,
  archived_at    timestamptz,
  budget_amount  numeric(12, 2) CHECK (budget_amount IS NULL OR budget_amount >= 0),
  currency       char(3) NOT NULL DEFAULT 'INR',
  created_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_dates CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date),
  CONSTRAINT projects_completed_at CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);

ALTER SEQUENCE project_code_seq OWNED BY projects.code;

CREATE INDEX projects_client_idx ON projects (client_id);
CREATE INDEX projects_open_idx ON projects (status, due_date) WHERE archived_at IS NULL;

CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER projects_manager_internal BEFORE INSERT OR UPDATE OF manager_id ON projects
  FOR EACH ROW EXECUTE FUNCTION ensure_internal_user('manager_id');

-- Internal people working on a project (admins and team only).
CREATE TABLE project_members (
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  added_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX project_members_user_idx ON project_members (user_id);

CREATE TRIGGER project_members_internal BEFORE INSERT OR UPDATE OF user_id ON project_members
  FOR EACH ROW EXECUTE FUNCTION ensure_internal_user('user_id');

CREATE TABLE milestones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           text NOT NULL CHECK (length(btrim(title)) > 0),
  description     text,
  sort_order      integer NOT NULL DEFAULT 0,
  weight          numeric(6, 2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold')),
  start_date      date,
  due_date        date,
  completed_at    timestamptz,
  client_visible  boolean NOT NULL DEFAULT true,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT milestones_dates CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)
);

CREATE INDEX milestones_project_idx ON milestones (project_id, sort_order);

CREATE TRIGGER milestones_set_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id     uuid NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  title            text NOT NULL CHECK (length(btrim(title)) > 0),
  description      text,
  assignee_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  weight           numeric(6, 2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  priority         text NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status           text NOT NULL DEFAULT 'todo'
                   CHECK (status IN ('todo', 'in_progress', 'blocked', 'in_review',
                                     'changes_requested', 'done', 'cancelled')),
  sort_order       integer NOT NULL DEFAULT 0,
  start_date       date,
  due_date         date,
  estimated_hours  numeric(7, 2) CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  actual_hours     numeric(7, 2) CHECK (actual_hours IS NULL OR actual_hours >= 0),
  submitted_at     timestamptz,
  verified_at      timestamptz,
  verified_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_dates CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date),
  -- "done" means verified by an admin; that is what makes it count toward progress.
  CONSTRAINT tasks_done_is_verified CHECK (status <> 'done' OR verified_at IS NOT NULL)
);

CREATE INDEX tasks_milestone_idx ON tasks (milestone_id, sort_order);
CREATE INDEX tasks_assignee_open_idx ON tasks (assignee_id, due_date)
  WHERE status NOT IN ('done', 'cancelled');

CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tasks_assignee_internal BEFORE INSERT OR UPDATE OF assignee_id ON tasks
  FOR EACH ROW EXECUTE FUNCTION ensure_internal_user('assignee_id');

-- Work handed in by a team member for admin review. One pending submission per task.
CREATE TABLE task_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submitted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  revision      integer NOT NULL CHECK (revision >= 1),
  notes         text NOT NULL CHECK (length(btrim(notes)) > 0),
  links         jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(links) = 'array'),
  actual_hours  numeric(7, 2) CHECK (actual_hours IS NULL OR actual_hours >= 0),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'verified', 'changes_requested', 'withdrawn')),
  reviewed_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  review_note   text,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_submissions_revision_key UNIQUE (task_id, revision),
  CONSTRAINT task_submissions_reviewed CHECK (
    status IN ('pending', 'withdrawn') OR reviewed_at IS NOT NULL
  ),
  CONSTRAINT task_submissions_changes_have_note CHECK (
    status <> 'changes_requested' OR length(btrim(coalesce(review_note, ''))) > 0
  )
);

CREATE UNIQUE INDEX task_submissions_one_pending ON task_submissions (task_id) WHERE status = 'pending';

-- Blockers reported by the team.
CREATE TABLE task_blockers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reported_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  description      text NOT NULL CHECK (length(btrim(description)) > 0),
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolution_note  text,
  resolved_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_blockers_resolved CHECK (status = 'open' OR resolved_at IS NOT NULL)
);

CREATE INDEX task_blockers_open_idx ON task_blockers (task_id) WHERE status = 'open';

-- Append-only status trail for tasks.
CREATE TABLE task_status_history (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  task_id      uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_status  text,
  to_status    text NOT NULL,
  changed_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX task_status_history_task_idx ON task_status_history (task_id, created_at);

-- ------------------------------------------------------------
-- Progress views
-- ------------------------------------------------------------
CREATE VIEW milestone_progress AS
SELECT
  m.id          AS milestone_id,
  m.project_id,
  m.weight      AS milestone_weight,
  count(t.id) FILTER (WHERE t.status <> 'cancelled')                 AS task_count,
  count(t.id) FILTER (WHERE t.status = 'done')                       AS done_count,
  coalesce(sum(t.weight) FILTER (WHERE t.status <> 'cancelled'), 0)  AS total_task_weight,
  coalesce(sum(t.weight) FILTER (WHERE t.status = 'done'), 0)        AS done_task_weight,
  coalesce(
    round(
      100 * coalesce(sum(t.weight) FILTER (WHERE t.status = 'done'), 0)
          / nullif(sum(t.weight) FILTER (WHERE t.status <> 'cancelled'), 0),
      2),
    0)::numeric(5, 2)                                                AS progress_percent
FROM milestones m
LEFT JOIN tasks t ON t.milestone_id = m.id
GROUP BY m.id;

CREATE VIEW project_progress AS
SELECT
  p.id AS project_id,
  count(mp.milestone_id)                                        AS milestone_count,
  count(mp.milestone_id) FILTER (WHERE mp.progress_percent = 100) AS milestones_done,
  coalesce(
    round(sum(mp.milestone_weight * mp.progress_percent) / nullif(sum(mp.milestone_weight), 0), 2),
    0)::numeric(5, 2)                                           AS progress_percent
FROM projects p
LEFT JOIN milestone_progress mp ON mp.project_id = p.id
GROUP BY p.id;
