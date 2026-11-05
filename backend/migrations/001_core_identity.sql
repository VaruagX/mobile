-- ============================================================
-- Varuag OS · 001 · Core identity: clients, users, sessions, devices
-- Roles are exactly: admin, team, client.
-- Forward-only. The runner wraps this file in one transaction.
-- ============================================================

-- Shared trigger: keep updated_at current on every UPDATE.
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Client companies. A client company can have one or more client-role logins.
CREATE TABLE clients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     text NOT NULL CHECK (length(btrim(company_name)) > 0),
  contact_name     text,
  email            text,
  phone            text,
  billing_address  text,
  gstin            text,
  status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'suspended', 'archived')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Every person who can sign in. Accounts are provisioned by an admin (no public sign-up).
CREATE TABLE users (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role                  text NOT NULL CHECK (role IN ('admin', 'team', 'client')),
  client_id             uuid REFERENCES clients(id) ON DELETE RESTRICT,
  name                  text NOT NULL CHECK (length(btrim(name)) > 0),
  email                 text NOT NULL CHECK (position('@' IN email) > 1),
  password_hash         text NOT NULL,
  phone                 text,
  avatar_url            text,
  job_title             text,
  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'suspended', 'disabled')),
  must_change_password  boolean NOT NULL DEFAULT true,
  last_login_at         timestamptz,
  created_by            uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- Client logins must belong to a client company; admin/team logins must not.
  CONSTRAINT users_client_link CHECK ((role = 'client') = (client_id IS NOT NULL))
);

CREATE UNIQUE INDEX users_email_key ON users (lower(email));
CREATE INDEX users_client_idx ON users (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX users_role_idx ON users (role) WHERE status = 'active';

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Refresh tokens are stored hashed and rotated; a reused token can revoke its chain.
CREATE TABLE refresh_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  replaced_by  uuid REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

-- Expo push tokens, one row per device.
CREATE TABLE push_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE,
  platform      text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX push_tokens_user_idx ON push_tokens (user_id);

CREATE TABLE notification_preferences (
  user_id          uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_enabled     boolean NOT NULL DEFAULT true,
  task_updates     boolean NOT NULL DEFAULT true,
  project_updates  boolean NOT NULL DEFAULT true,
  billing_updates  boolean NOT NULL DEFAULT true,
  support_updates  boolean NOT NULL DEFAULT true,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER notification_preferences_set_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Reusable guard: the user referenced by column TG_ARGV[0] must be an admin or team member.
-- Used to stop clients being added to project teams, assigned tasks, or tickets.
CREATE FUNCTION ensure_internal_user() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  uid uuid := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
BEGIN
  IF uid IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = uid AND role IN ('admin', 'team')
  ) THEN
    RAISE EXCEPTION 'User % must be an admin or team member', uid
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
