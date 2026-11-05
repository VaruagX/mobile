-- ============================================================
-- Varuag OS · 003 · Files, client updates, team messages, activity
-- ============================================================

-- Uploaded files (deliverables, shared files, payment proofs, receipts).
-- Only metadata lives here; the bytes live in object storage (provider chosen later).
CREATE TABLE files (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id      uuid REFERENCES milestones(id) ON DELETE SET NULL,
  task_id           uuid REFERENCES tasks(id) ON DELETE SET NULL,
  submission_id     uuid REFERENCES task_submissions(id) ON DELETE SET NULL,
  storage_provider  text NOT NULL,
  storage_key       text NOT NULL,
  original_name     text NOT NULL CHECK (length(btrim(original_name)) > 0),
  mime_type         text NOT NULL,
  size_bytes        bigint NOT NULL CHECK (size_bytes >= 0 AND size_bytes <= 104857600), -- 100 MB cap
  checksum_sha256   text,
  -- internal: admin/team only. client: visible to the project's client.
  visibility        text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'client')),
  status            text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'deleted')),
  uploaded_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CONSTRAINT files_storage_key UNIQUE (storage_provider, storage_key),
  CONSTRAINT files_deleted CHECK (status <> 'deleted' OR deleted_at IS NOT NULL)
);

CREATE INDEX files_project_idx ON files (project_id, created_at DESC) WHERE status = 'ready';
CREATE INDEX files_task_idx ON files (task_id) WHERE task_id IS NOT NULL;
CREATE INDEX files_submission_idx ON files (submission_id) WHERE submission_id IS NOT NULL;

-- Progress updates written for the client. Clients only ever see status = 'published',
-- and publishing requires an admin's approval.
CREATE TABLE project_updates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id  uuid REFERENCES milestones(id) ON DELETE SET NULL,
  author_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  title         text NOT NULL CHECK (length(btrim(title)) > 0),
  body          text NOT NULL CHECK (length(btrim(body)) > 0),
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'pending_approval', 'published', 'archived')),
  approved_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at   timestamptz,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_updates_published CHECK (
    status <> 'published' OR (approved_at IS NOT NULL AND published_at IS NOT NULL)
  )
);

CREATE INDEX project_updates_client_feed_idx ON project_updates (project_id, published_at DESC)
  WHERE status = 'published';

CREATE TRIGGER project_updates_set_updated_at BEFORE UPDATE ON project_updates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE project_update_files (
  update_id  uuid NOT NULL REFERENCES project_updates(id) ON DELETE CASCADE,
  file_id    uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  PRIMARY KEY (update_id, file_id)
);

-- Internal team communication: one thread per project, optionally about a task.
CREATE TABLE project_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id     uuid REFERENCES tasks(id) ON DELETE SET NULL,
  author_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  body        text NOT NULL CHECK (length(btrim(body)) > 0 AND length(body) <= 4000),
  edited_at   timestamptz,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_messages_thread_idx ON project_messages (project_id, created_at DESC);

CREATE TRIGGER project_messages_author_internal BEFORE INSERT ON project_messages
  FOR EACH ROW EXECUTE FUNCTION ensure_internal_user('author_id');

-- Append-only audit / activity feed. client_visible rows can appear in the client portal.
CREATE TABLE activity_log (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id      uuid REFERENCES projects(id) ON DELETE CASCADE,
  actor_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  action          text NOT NULL,
  entity_type     text NOT NULL,
  entity_id       uuid,
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_visible  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_log_project_idx ON activity_log (project_id, created_at DESC);
CREATE INDEX activity_log_actor_idx ON activity_log (actor_id, created_at DESC);
