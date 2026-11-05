/**
 * In-memory store for the UI review build. All forms write here so every flow can be
 * exercised end to end. It resets when the app reloads. In the integration stage each
 * action below becomes an API call with the same name and arguments.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createDemoState } from '@/data/demo';
import type {
  AppNotification,
  Client,
  DemoState,
  Expense,
  FileItem,
  Invoice,
  Milestone,
  Payment,
  PaymentMethod,
  Priority,
  Project,
  ProjectUpdate,
  Task,
  TaskStatus,
  Ticket,
  User,
} from '@/data/types';
import { DEMO_TODAY, nowIso } from '@/lib/format';
import { findMilestone, findProject, invoiceBalance } from '@/lib/selectors';

let seq = 100;
const newId = (prefix: string) => `${prefix}-${(++seq).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

type Actions = ReturnType<typeof buildActions>;
type Ctx = { state: DemoState; actions: Actions };

const StoreContext = createContext<Ctx | null>(null);

function buildActions(set: (fn: (s: DemoState) => DemoState) => void, get: () => DemoState) {
  const notify = (s: DemoState, n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): DemoState => ({
    ...s,
    notifications: [{ ...n, id: newId('n'), createdAt: nowIso(), read: false }, ...s.notifications],
  });

  return {
    reset: () => set(() => createDemoState()),

    // ---------- projects ----------
    createProject(input: Omit<Project, 'id' | 'code'>) {
      const id = newId('p');
      set((s) => ({
        ...s,
        projects: [{ ...input, id, code: `VL-P${String(s.projects.length + 3).padStart(4, '0')}` }, ...s.projects],
      }));
      return id;
    },
    updateProjectStatus(projectId: string, status: Project['status']) {
      set((s) => ({ ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, status } : p)) }));
    },
    setProjectMembers(projectId: string, memberIds: string[]) {
      set((s) => ({ ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, memberIds } : p)) }));
    },
    createMilestone(input: Omit<Milestone, 'id' | 'order' | 'status'>) {
      const id = newId('m');
      set((s) => {
        const order = s.milestones.filter((m) => m.projectId === input.projectId).length + 1;
        return { ...s, milestones: [...s.milestones, { ...input, id, order, status: 'pending' }] };
      });
      return id;
    },
    updateMilestone(id: string, patch: Partial<Milestone>) {
      set((s) => ({ ...s, milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    },

    // ---------- tasks ----------
    createTask(input: Omit<Task, 'id' | 'status'>) {
      const id = newId('t');
      set((s) => {
        let next: DemoState = { ...s, tasks: [...s.tasks, { ...input, id, status: 'todo' }] };
        if (input.assigneeId) {
          const project = findProject(s, findMilestone(s, input.milestoneId)?.projectId);
          next = notify(next, { userId: input.assigneeId, kind: 'task', title: 'Task assigned', body: `${input.title} · ${project?.name ?? ''}`, href: `/task/${id}` });
        }
        return next;
      });
      return id;
    },
    setTaskStatus(taskId: string, status: TaskStatus) {
      set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) }));
    },
    submitTask(taskId: string, userId: string, notes: string, links: string[], files: { name: string; size: number; mime: string }[]) {
      set((s) => {
        const task = s.tasks.find((t) => t.id === taskId);
        const projectId = task ? findMilestone(s, task.milestoneId)?.projectId : undefined;
        const fileItems: FileItem[] = files.map((f) => ({
          id: newId('f'), projectId, taskId, name: f.name, size: f.size, mime: f.mime, visibility: 'internal', uploadedBy: userId, createdAt: nowIso(),
        }));
        const revision = s.submissions.filter((x) => x.taskId === taskId).length + 1;
        let next: DemoState = {
          ...s,
          files: [...fileItems, ...s.files],
          submissions: [
            { id: newId('s'), taskId, revision, notes, links, fileIds: fileItems.map((f) => f.id), status: 'pending', submittedBy: userId, createdAt: nowIso() },
            ...s.submissions,
          ],
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: 'in_review' } : t)),
        };
        next = notify(next, { userId: 'u-admin', kind: 'task', title: 'Work submitted for review', body: `${task?.title ?? 'A task'} (revision ${revision})`, href: `/task/${taskId}` });
        return next;
      });
    },
    reviewSubmission(taskId: string, decision: 'verified' | 'changes_requested', note: string) {
      set((s) => {
        const pending = s.submissions.find((x) => x.taskId === taskId && x.status === 'pending');
        const task = s.tasks.find((t) => t.id === taskId);
        let next: DemoState = {
          ...s,
          submissions: s.submissions.map((x) => (x.id === pending?.id ? { ...x, status: decision, reviewNote: note || undefined, reviewedAt: nowIso() } : x)),
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: decision === 'verified' ? 'done' : 'changes_requested', verifiedAt: decision === 'verified' ? nowIso() : undefined }
              : t
          ),
        };
        if (task?.assigneeId) {
          next = notify(next, {
            userId: task.assigneeId,
            kind: 'task',
            title: decision === 'verified' ? 'Work verified' : 'Changes requested',
            body: decision === 'verified' ? `${task.title} now counts toward progress.` : `${task.title}: ${note}`,
            href: `/task/${taskId}`,
          });
        }
        return next;
      });
    },
    reportBlocker(taskId: string, userId: string, description: string) {
      set((s) => {
        const task = s.tasks.find((t) => t.id === taskId);
        let next: DemoState = {
          ...s,
          blockers: [{ id: newId('b'), taskId, reportedBy: userId, description, status: 'open', createdAt: nowIso() }, ...s.blockers],
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: 'blocked' } : t)),
        };
        next = notify(next, { userId: 'u-admin', kind: 'task', title: 'Blocker reported', body: `${task?.title ?? 'Task'}: ${description}`, href: `/task/${taskId}` });
        return next;
      });
    },
    resolveBlocker(blockerId: string, resolution: string) {
      set((s) => {
        const blocker = s.blockers.find((b) => b.id === blockerId);
        return {
          ...s,
          blockers: s.blockers.map((b) => (b.id === blockerId ? { ...b, status: 'resolved', resolution } : b)),
          tasks: s.tasks.map((t) => (t.id === blocker?.taskId && t.status === 'blocked' ? { ...t, status: 'in_progress' } : t)),
        };
      });
    },

    // ---------- files, updates, messages ----------
    addFiles(projectId: string, userId: string, files: { name: string; size: number; mime: string }[], visibility: FileItem['visibility']) {
      set((s) => ({
        ...s,
        files: [
          ...files.map((f) => ({ id: newId('f'), projectId, name: f.name, size: f.size, mime: f.mime, visibility, uploadedBy: userId, createdAt: nowIso() })),
          ...s.files,
        ],
      }));
    },
    setFileVisibility(fileId: string, visibility: FileItem['visibility']) {
      set((s) => ({ ...s, files: s.files.map((f) => (f.id === fileId ? { ...f, visibility } : f)) }));
    },
    createUpdate(input: Pick<ProjectUpdate, 'projectId' | 'milestoneId' | 'title' | 'body' | 'authorId'>, publish: boolean) {
      set((s) => {
        const project = findProject(s, input.projectId);
        const update: ProjectUpdate = {
          ...input,
          id: newId('up'),
          fileIds: [],
          createdAt: nowIso(),
          status: publish ? 'published' : 'pending_approval',
          publishedAt: publish ? nowIso() : undefined,
        };
        let next: DemoState = { ...s, updates: [update, ...s.updates] };
        if (publish && project) {
          for (const u of s.users.filter((x) => x.clientId === project.clientId)) {
            next = notify(next, { userId: u.id, kind: 'project', title: 'New update on your project', body: input.title, href: '/updates' });
          }
        } else {
          next = notify(next, { userId: 'u-admin', kind: 'project', title: 'Update awaiting approval', body: input.title, href: `/project/${input.projectId}?tab=updates` });
        }
        return next;
      });
    },
    publishUpdate(updateId: string) {
      set((s) => {
        const update = s.updates.find((u) => u.id === updateId);
        const project = findProject(s, update?.projectId);
        let next: DemoState = {
          ...s,
          updates: s.updates.map((u) => (u.id === updateId ? { ...u, status: 'published', publishedAt: nowIso() } : u)),
        };
        for (const u of s.users.filter((x) => x.clientId === project?.clientId)) {
          next = notify(next, { userId: u.id, kind: 'project', title: 'New update on your project', body: update?.title ?? '', href: '/updates' });
        }
        return next;
      });
    },
    sendMessage(projectId: string, authorId: string, body: string) {
      set((s) => ({ ...s, messages: [...s.messages, { id: newId('msg'), projectId, authorId, body, createdAt: nowIso() }] }));
    },

    // ---------- people ----------
    createClient(input: Omit<Client, 'id' | 'since' | 'status'>, withLogin: boolean) {
      const id = newId('c');
      set((s) => {
        const users: User[] = withLogin
          ? [{ id: newId('u'), role: 'client', clientId: id, name: input.contactName, email: input.email, phone: input.phone, status: 'active', joinedOn: DEMO_TODAY }]
          : [];
        return { ...s, clients: [{ ...input, id, since: DEMO_TODAY, status: 'active' }, ...s.clients], users: [...s.users, ...users] };
      });
      return id;
    },
    setClientStatus(clientId: string, status: Client['status']) {
      set((s) => ({ ...s, clients: s.clients.map((c) => (c.id === clientId ? { ...c, status } : c)) }));
    },
    createMember(input: Pick<User, 'name' | 'email' | 'phone' | 'jobTitle' | 'role'>) {
      const id = newId('u');
      set((s) => ({ ...s, users: [...s.users, { ...input, id, status: 'active', joinedOn: DEMO_TODAY }] }));
      return id;
    },
    setUserStatus(userId: string, status: User['status']) {
      set((s) => ({ ...s, users: s.users.map((u) => (u.id === userId ? { ...u, status } : u)) }));
    },
    updateProfile(userId: string, patch: Pick<User, 'name' | 'phone'>) {
      set((s) => ({ ...s, users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) }));
    },

    // ---------- finance ----------
    createInvoice(input: Omit<Invoice, 'id' | 'number'>) {
      const id = newId('i');
      set((s) => {
        const number = `VL-INV-2026-${String(s.invoices.length + 11).padStart(4, '0')}`;
        let next: DemoState = { ...s, invoices: [{ ...input, id, number }, ...s.invoices] };
        if (input.status === 'issued') {
          for (const u of s.users.filter((x) => x.clientId === input.clientId)) {
            next = notify(next, { userId: u.id, kind: 'billing', title: 'Invoice issued', body: `${number} · ${input.title}`, href: `/invoice/${id}` });
          }
        }
        return next;
      });
      return id;
    },
    issueInvoice(invoiceId: string) {
      set((s) => {
        const inv = s.invoices.find((i) => i.id === invoiceId);
        let next: DemoState = {
          ...s,
          invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, status: 'issued', issueDate: DEMO_TODAY } : i)),
        };
        for (const u of s.users.filter((x) => x.clientId === inv?.clientId)) {
          next = notify(next, { userId: u.id, kind: 'billing', title: 'Invoice issued', body: `${inv?.number} · ${inv?.title}`, href: `/invoice/${invoiceId}` });
        }
        return next;
      });
    },
    voidInvoice(invoiceId: string) {
      set((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, status: 'void' } : i)) }));
    },
    /** Client-submitted or admin-recorded manual payment. Admin-recorded can be verified at once. */
    recordPayment(
      input: { invoiceId: string; amount: number; method: PaymentMethod; paidOn: string; reference?: string; note?: string; proofName?: string },
      userId: string,
      verifyNow: boolean
    ): { ok: true } | { ok: false; error: string } {
      const current = get();
      const inv = current.invoices.find((i) => i.id === input.invoiceId);
      if (!inv || inv.status !== 'issued') return { ok: false, error: 'Payments can only be recorded against an issued invoice.' };
      const bal = invoiceBalance(current, inv);
      const room = bal.balance - (verifyNow ? 0 : bal.pending);
      if (!(input.amount > 0)) return { ok: false, error: 'Enter an amount greater than zero.' };
      if (input.amount > room + 0.001) {
        return { ok: false, error: `Amount is more than the balance still open (₹${room.toLocaleString('en-IN')}).` };
      }
      set((s) => {
        const receipts = s.payments.filter((p) => p.receiptNumber).length;
        const payment: Payment = {
          ...input,
          id: newId('pay'),
          submittedBy: userId,
          createdAt: nowIso(),
          status: verifyNow ? 'verified' : 'pending',
          verifiedAt: verifyNow ? nowIso() : undefined,
          receiptNumber: verifyNow ? `VL-RCPT-${String(receipts + 4).padStart(4, '0')}` : undefined,
        };
        let next: DemoState = { ...s, payments: [payment, ...s.payments] };
        if (!verifyNow) {
          next = notify(next, { userId: 'u-admin', kind: 'billing', title: 'Payment submitted', body: `₹${input.amount.toLocaleString('en-IN')} for ${inv.number}`, href: `/payment/${payment.id}` });
        }
        return next;
      });
      return { ok: true };
    },
    verifyPayment(paymentId: string) {
      set((s) => {
        const p = s.payments.find((x) => x.id === paymentId);
        const inv = s.invoices.find((i) => i.id === p?.invoiceId);
        const receipts = s.payments.filter((x) => x.receiptNumber).length;
        const receiptNumber = `VL-RCPT-${String(receipts + 4).padStart(4, '0')}`;
        let next: DemoState = {
          ...s,
          payments: s.payments.map((x) => (x.id === paymentId ? { ...x, status: 'verified', verifiedAt: nowIso(), receiptNumber } : x)),
        };
        if (p) {
          next = notify(next, { userId: p.submittedBy, kind: 'billing', title: 'Payment verified', body: `Receipt ${receiptNumber} for ${inv?.number}`, href: `/invoice/${inv?.id}` });
        }
        return next;
      });
    },
    rejectPayment(paymentId: string, reason: string) {
      set((s) => {
        const p = s.payments.find((x) => x.id === paymentId);
        let next: DemoState = {
          ...s,
          payments: s.payments.map((x) => (x.id === paymentId ? { ...x, status: 'rejected', rejectionReason: reason } : x)),
        };
        if (p) next = notify(next, { userId: p.submittedBy, kind: 'billing', title: 'Payment not verified', body: reason, href: `/invoice/${p.invoiceId}` });
        return next;
      });
    },
    createExpense(input: Omit<Expense, 'id' | 'status'>) {
      set((s) => ({ ...s, expenses: [{ ...input, id: newId('e'), status: 'pending' }, ...s.expenses] }));
    },
    setExpenseStatus(id: string, status: Expense['status']) {
      set((s) => ({ ...s, expenses: s.expenses.map((e) => (e.id === id ? { ...e, status } : e)) }));
    },

    // ---------- support ----------
    createTicket(input: { clientId: string; projectId?: string; raisedBy: string; subject: string; description: string; priority: Priority }) {
      const id = newId('tk');
      set((s) => {
        const ticket: Ticket = {
          ...input,
          id,
          number: `VL-T${String(s.tickets.length + 10).padStart(5, '0')}`,
          status: 'open',
          createdAt: nowIso(),
          messages: [{ id: newId('tm'), authorId: input.raisedBy, body: input.description, createdAt: nowIso() }],
        };
        return notify({ ...s, tickets: [ticket, ...s.tickets] }, { userId: 'u-admin', kind: 'support', title: 'New ticket', body: input.subject, href: `/ticket/${id}` });
      });
      return id;
    },
    replyTicket(ticketId: string, authorId: string, body: string, internal = false) {
      set((s) => ({
        ...s,
        tickets: s.tickets.map((t) =>
          t.id === ticketId ? { ...t, messages: [...t.messages, { id: newId('tm'), authorId, body, createdAt: nowIso(), internal }] } : t
        ),
      }));
    },
    setTicketStatus(ticketId: string, status: Ticket['status']) {
      set((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, status } : t)) }));
    },
    assignTicket(ticketId: string, userId: string) {
      set((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, assignedTo: userId, status: t.status === 'open' ? 'in_progress' : t.status } : t)) }));
    },

    // ---------- notifications ----------
    markRead(id: string) {
      set((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    },
    markAllRead(userId: string) {
      set((s) => ({ ...s, notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }));
    },
    createAnnouncement(input: { title: string; body: string; audience: 'all' | 'team' | 'client'; authorId: string }) {
      set((s) => ({ ...s, announcements: [{ ...input, id: newId('a'), publishedAt: nowIso() }, ...s.announcements] }));
    },
  };
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createDemoState);
  const ref = useRef(state);
  ref.current = state;
  const set = useCallback((fn: (s: DemoState) => DemoState) => setState(fn), []);
  const actions = useMemo(() => buildActions(set, () => ref.current), [set]);
  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside DemoStoreProvider');
  return ctx;
}
