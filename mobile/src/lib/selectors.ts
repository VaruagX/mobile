/**
 * Derived progress and balance values for the in-memory demo data.
 */
import type { DemoState, Invoice, Milestone, Project, Task } from '@/data/types';
import { daysFromToday } from './format';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function tasksOfMilestone(s: DemoState, milestoneId: string): Task[] {
  return s.tasks.filter((t) => t.milestoneId === milestoneId);
}

export function milestonesOfProject(s: DemoState, projectId: string): Milestone[] {
  return s.milestones.filter((m) => m.projectId === projectId).sort((a, b) => a.order - b.order);
}

export function tasksOfProject(s: DemoState, projectId: string): Task[] {
  const ids = new Set(milestonesOfProject(s, projectId).map((m) => m.id));
  return s.tasks.filter((t) => ids.has(t.milestoneId));
}

/** milestone % = Σ weight of verified tasks ÷ Σ weight of non-cancelled tasks. */
export function milestoneProgress(s: DemoState, milestoneId: string) {
  const tasks = tasksOfMilestone(s, milestoneId).filter((t) => t.status !== 'cancelled');
  const total = tasks.reduce((a, t) => a + t.weight, 0);
  const done = tasks.filter((t) => t.status === 'done');
  const doneWeight = done.reduce((a, t) => a + t.weight, 0);
  return {
    percent: total ? round2((100 * doneWeight) / total) : 0,
    taskCount: tasks.length,
    doneCount: done.length,
  };
}

/** project % = Σ(milestone weight × milestone %) ÷ Σ milestone weights. */
export function projectProgress(s: DemoState, projectId: string) {
  const ms = milestonesOfProject(s, projectId);
  const totalWeight = ms.reduce((a, m) => a + m.weight, 0);
  const parts = ms.map((m) => ({ milestone: m, ...milestoneProgress(s, m.id) }));
  const weighted = parts.reduce((a, p) => a + p.milestone.weight * p.percent, 0);
  const current = parts.find((p) => p.percent < 100);
  return {
    percent: totalWeight ? round2(weighted / totalWeight) : 0,
    parts,
    milestoneCount: ms.length,
    milestonesDone: parts.filter((p) => p.percent === 100).length,
    current: current?.milestone,
  };
}

export function projectHealth(s: DemoState, p: Project): 'completed' | 'delayed' | 'blocked' | 'on_track' {
  if (p.status === 'completed') return 'completed';
  const tasks = tasksOfProject(s, p.id);
  if (tasks.some((t) => t.status === 'blocked')) return 'blocked';
  if (daysFromToday(p.dueDate) < 0) return 'delayed';
  return 'on_track';
}

export function invoiceTotals(inv: Invoice) {
  const subtotal = inv.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const tax = inv.items.reduce((a, i) => a + (i.quantity * i.unitPrice * i.taxRate) / 100, 0);
  return { subtotal: round2(subtotal), tax: round2(tax), total: round2(subtotal + tax) };
}

export type PaymentState = 'draft' | 'void' | 'paid' | 'overdue' | 'partially_paid' | 'unpaid';

/** Only verified payments reduce the balance. */
export function invoiceBalance(s: DemoState, inv: Invoice) {
  const { total } = invoiceTotals(inv);
  const payments = s.payments.filter((p) => p.invoiceId === inv.id);
  const paid = round2(payments.filter((p) => p.status === 'verified').reduce((a, p) => a + p.amount, 0));
  const pending = round2(payments.filter((p) => p.status === 'pending').reduce((a, p) => a + p.amount, 0));
  let state: PaymentState;
  if (inv.status === 'draft') state = 'draft';
  else if (inv.status === 'void') state = 'void';
  else if (paid >= total) state = 'paid';
  else if (inv.dueDate && daysFromToday(inv.dueDate) < 0) state = 'overdue';
  else if (paid > 0) state = 'partially_paid';
  else state = 'unpaid';
  return { total, paid, pending, balance: round2(total - paid), state, payments };
}

export function financeSummary(s: DemoState, clientId?: string) {
  const invoices = s.invoices.filter((i) => i.status === 'issued' && (!clientId || i.clientId === clientId));
  let invoiced = 0;
  let collected = 0;
  let pending = 0;
  let overdue = 0;
  for (const inv of invoices) {
    const b = invoiceBalance(s, inv);
    invoiced += b.total;
    collected += b.paid;
    pending += b.pending;
    if (b.state === 'overdue') overdue += b.balance;
  }
  return {
    invoiced: round2(invoiced),
    collected: round2(collected),
    outstanding: round2(invoiced - collected),
    pendingVerification: round2(pending),
    overdue: round2(overdue),
    collectedPercent: invoiced ? Math.round((100 * collected) / invoiced) : 0,
  };
}

export function projectsForUser(s: DemoState, userId: string, role: 'admin' | 'team' | 'client', clientId?: string): Project[] {
  if (role === 'admin') return s.projects;
  if (role === 'client') return s.projects.filter((p) => p.clientId === clientId);
  return s.projects.filter((p) => p.memberIds.includes(userId) || p.managerId === userId);
}

export const findUser = (s: DemoState, id?: string) => s.users.find((u) => u.id === id);
export const findClient = (s: DemoState, id?: string) => s.clients.find((c) => c.id === id);
export const findProject = (s: DemoState, id?: string) => s.projects.find((p) => p.id === id);
export const findMilestone = (s: DemoState, id?: string) => s.milestones.find((m) => m.id === id);
export const projectOfTask = (s: DemoState, t: Task) => findProject(s, findMilestone(s, t.milestoneId)?.projectId);

export const TASK_ORDER: Record<string, number> = {
  changes_requested: 0,
  blocked: 1,
  in_progress: 2,
  todo: 3,
  in_review: 4,
  done: 5,
  cancelled: 6,
};
