-- ============================================================
-- Varuag OS · 005 · Support tickets, announcements, notifications
-- ============================================================

CREATE SEQUENCE ticket_number_seq;

CREATE TABLE support_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number  text NOT NULL UNIQUE
                 DEFAULT ('VL-T' || lpad(nextval('ticket_number_seq')::text, 5, '0')),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  project_id     uuid REFERENCES projects(id) ON DELETE SET NULL,
  raised_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_to    uuid REFERENCES users(id) ON DELETE SET NULL,
  subject        text NOT NULL CHECK (length(btrim(subject)) > 0),
  description    text NOT NULL CHECK (length(btrim(description)) > 0),
  priority       text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status         text NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'in_progress', 'waiting_on_client', 'resolved', 'closed')),
  resolved_at    timestamptz,
  closed_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER SEQUENCE ticket_number_seq OWNED BY support_tickets.ticket_number;

CREATE INDEX support_tickets_client_idx ON support_tickets (client_id, created_at DESC);
CREATE INDEX support_tickets_open_idx ON support_tickets (status, priority)
  WHERE status NOT IN ('resolved', 'closed');

CREATE TRIGGER support_tickets_set_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER support_tickets_assignee_internal BEFORE INSERT OR UPDATE OF assigned_to ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION ensure_internal_user('assigned_to');

CREATE TABLE ticket_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  body         text NOT NULL CHECK (length(btrim(body)) > 0 AND length(body) <= 8000),
  -- Internal notes are never shown to the client.
  is_internal  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ticket_messages_ticket_idx ON ticket_messages (ticket_id, created_at);

CREATE TABLE announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL CHECK (length(btrim(title)) > 0),
  body          text NOT NULL CHECK (length(btrim(body)) > 0),
  audience      text NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'team', 'client')),
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX announcements_feed_idx ON announcements (audience, published_at DESC)
  WHERE published_at IS NOT NULL;

-- In-app notifications (push delivery uses push_tokens + notification_preferences).
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Same dedupe_key for the same user is stored once (prevents duplicate notices on retries).
  dedupe_key  text,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX notifications_dedupe_key ON notifications (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;
CREATE INDEX notifications_unread_idx ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
