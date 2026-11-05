-- ============================================================
-- Varuag OS · 004 · Invoices, payments, receipts, expenses
--
-- Payment flow:
--   manual (UPI / bank transfer / cash): client or admin records it → status 'pending'
--     → admin verifies (receipt number issued) or rejects with a reason.
--   online (gateway, provider chosen later): channel 'gateway', method 'online'.
-- Only VERIFIED payments reduce an invoice's balance.
-- ============================================================

CREATE SEQUENCE invoice_number_seq;
CREATE SEQUENCE receipt_number_seq;

CREATE TABLE invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Assigned by the API (e.g. VL-INV-2026-0001) using invoice_number_seq.
  invoice_number  text NOT NULL UNIQUE,
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
  milestone_id    uuid REFERENCES milestones(id) ON DELETE SET NULL,
  title           text,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'void')),
  issue_date      date,
  due_date        date,
  currency        char(3) NOT NULL DEFAULT 'INR',
  subtotal        numeric(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total  numeric(12, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  tax_total       numeric(12, 2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total           numeric(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes           text,
  terms           text,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  issued_at       timestamptz,
  voided_at       timestamptz,
  void_reason     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_issued CHECK (status = 'draft' OR (issue_date IS NOT NULL AND issued_at IS NOT NULL)),
  CONSTRAINT invoices_void CHECK (status <> 'void' OR (voided_at IS NOT NULL AND void_reason IS NOT NULL)),
  CONSTRAINT invoices_dates CHECK (due_date IS NULL OR issue_date IS NULL OR due_date >= issue_date)
);

CREATE INDEX invoices_client_idx ON invoices (client_id, issue_date DESC);
CREATE INDEX invoices_project_idx ON invoices (project_id) WHERE project_id IS NOT NULL;

CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE invoice_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sort_order   integer NOT NULL DEFAULT 0,
  description  text NOT NULL CHECK (length(btrim(description)) > 0),
  quantity     numeric(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  tax_rate     numeric(5, 2) NOT NULL DEFAULT 0 CHECK (tax_rate BETWEEN 0 AND 100),
  line_total   numeric(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX invoice_items_invoice_idx ON invoice_items (invoice_id, sort_order);

CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount              numeric(12, 2) NOT NULL CHECK (amount > 0),
  method              text NOT NULL CHECK (method IN ('upi', 'bank_transfer', 'cash', 'online')),
  channel             text NOT NULL DEFAULT 'manual' CHECK (channel IN ('manual', 'gateway')),
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  paid_on             date NOT NULL,
  reference           text,          -- UPI transaction id, bank UTR, cash note
  payer_note          text,
  proof_file_id       uuid REFERENCES files(id) ON DELETE SET NULL,
  submitted_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  verified_by         uuid REFERENCES users(id) ON DELETE SET NULL,
  verified_at         timestamptz,
  rejection_reason    text,
  receipt_number      text UNIQUE,   -- assigned on verification from receipt_number_seq
  receipt_file_id     uuid REFERENCES files(id) ON DELETE SET NULL,
  gateway_provider    text,          -- deferred: set when an online gateway is integrated
  gateway_payment_id  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_channel_method CHECK ((channel = 'gateway') = (method = 'online')),
  CONSTRAINT payments_gateway_provider CHECK (channel = 'manual' OR gateway_provider IS NOT NULL),
  CONSTRAINT payments_verified CHECK (
    status <> 'verified' OR (verified_at IS NOT NULL AND receipt_number IS NOT NULL)
  ),
  CONSTRAINT payments_rejected CHECK (
    status <> 'rejected' OR length(btrim(coalesce(rejection_reason, ''))) > 0
  )
);

CREATE INDEX payments_invoice_idx ON payments (invoice_id, created_at DESC);
CREATE INDEX payments_pending_idx ON payments (created_at) WHERE status = 'pending';
CREATE UNIQUE INDEX payments_gateway_ref_key ON payments (gateway_provider, gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;

CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Business rules the database enforces even if the API has a bug:
--  * payments can only be recorded against issued invoices;
--  * verified payments can never exceed the invoice total;
--  * a verified payment is final (its amount, invoice and status cannot change).
CREATE FUNCTION check_payment_rules() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  inv_status text;
  inv_total  numeric(12, 2);
  already    numeric(12, 2);
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'verified' AND (
       NEW.status IS DISTINCT FROM OLD.status
    OR NEW.amount IS DISTINCT FROM OLD.amount
    OR NEW.invoice_id IS DISTINCT FROM OLD.invoice_id
    OR NEW.method IS DISTINCT FROM OLD.method
  ) THEN
    RAISE EXCEPTION 'A verified payment cannot be changed' USING ERRCODE = 'check_violation';
  END IF;

  SELECT status, total INTO inv_status, inv_total
  FROM invoices WHERE id = NEW.invoice_id
  FOR UPDATE;

  IF inv_status IS DISTINCT FROM 'issued' AND (TG_OP = 'INSERT' OR NEW.status = 'verified') THEN
    RAISE EXCEPTION 'Payments can only be recorded against an issued invoice'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status = 'verified' THEN
    SELECT coalesce(sum(amount), 0) INTO already
    FROM payments
    WHERE invoice_id = NEW.invoice_id AND status = 'verified' AND id <> NEW.id;

    IF already + NEW.amount > inv_total THEN
      RAISE EXCEPTION 'Verified payments (%) would exceed the invoice total (%)', already + NEW.amount, inv_total
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_rules BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION check_payment_rules();

-- Balance and payment state per invoice (business dates in India time).
CREATE VIEW invoice_balances AS
SELECT
  i.id     AS invoice_id,
  i.client_id,
  i.total,
  coalesce(sum(p.amount) FILTER (WHERE p.status = 'verified'), 0) AS amount_paid,
  coalesce(sum(p.amount) FILTER (WHERE p.status = 'pending'), 0)  AS amount_pending_verification,
  i.total - coalesce(sum(p.amount) FILTER (WHERE p.status = 'verified'), 0) AS balance_due,
  CASE
    WHEN i.status = 'draft' THEN 'draft'
    WHEN i.status = 'void'  THEN 'void'
    WHEN coalesce(sum(p.amount) FILTER (WHERE p.status = 'verified'), 0) >= i.total THEN 'paid'
    WHEN i.due_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'overdue'
    WHEN coalesce(sum(p.amount) FILTER (WHERE p.status = 'verified'), 0) > 0 THEN 'partially_paid'
    ELSE 'unpaid'
  END AS payment_state
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id;

-- Internal expenses (admin only).
CREATE TABLE expenses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category         text NOT NULL CHECK (length(btrim(category)) > 0),
  description      text NOT NULL CHECK (length(btrim(description)) > 0),
  amount           numeric(12, 2) NOT NULL CHECK (amount > 0),
  expense_date     date NOT NULL,
  project_id       uuid REFERENCES projects(id) ON DELETE SET NULL,
  receipt_file_id  uuid REFERENCES files(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expenses_date_idx ON expenses (expense_date DESC);

CREATE TRIGGER expenses_set_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
