import type { ChipTone } from '@/components/Chips';

type Meta = { label: string; tone: ChipTone };

const META: Record<string, Meta> = {
  // projects
  planning: { label: 'Planning', tone: 'neutral' },
  active: { label: 'Active', tone: 'blue' },
  on_hold: { label: 'On hold', tone: 'neutral' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  // milestones
  pending: { label: 'Pending', tone: 'neutral' },
  // tasks
  todo: { label: 'To do', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'blue' },
  blocked: { label: 'Blocked', tone: 'danger' },
  in_review: { label: 'In review', tone: 'gold' },
  changes_requested: { label: 'Changes asked', tone: 'gold' },
  done: { label: 'Verified', tone: 'success' },
  // invoices & payments
  draft: { label: 'Draft', tone: 'neutral' },
  issued: { label: 'Issued', tone: 'blue' },
  void: { label: 'Void', tone: 'neutral' },
  paid: { label: 'Paid', tone: 'success' },
  unpaid: { label: 'Unpaid', tone: 'blue' },
  partially_paid: { label: 'Part paid', tone: 'gold' },
  overdue: { label: 'Overdue', tone: 'danger' },
  verified: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  verifying: { label: 'Verifying', tone: 'gold' },
  approved: { label: 'Approved', tone: 'success' },
  // tickets
  open: { label: 'Open', tone: 'gold' },
  waiting_on_client: { label: 'Waiting on you', tone: 'gold' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  // updates
  pending_approval: { label: 'Awaiting approval', tone: 'gold' },
  published: { label: 'Published', tone: 'success' },
  // accounts
  suspended: { label: 'Suspended', tone: 'danger' },
  disabled: { label: 'Disabled', tone: 'neutral' },
  archived: { label: 'Archived', tone: 'neutral' },
  // priority
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'neutral' },
  high: { label: 'High', tone: 'gold' },
  urgent: { label: 'Urgent', tone: 'danger' },
};

export function statusMeta(status: string): Meta {
  return META[status] ?? { label: status.replace(/_/g, ' '), tone: 'neutral' };
}

export const paymentMethodLabel: Record<string, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  online: 'Online',
};
