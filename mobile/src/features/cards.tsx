import { View } from 'react-native';
import { router } from 'expo-router';
import { Banknote, FileText, Image as ImageIcon, Landmark, Paperclip, Smartphone, TriangleAlert } from 'lucide-react-native';
import type { FileItem, Invoice, Payment, Project, ProjectUpdate, Task, Ticket } from '@/data/types';
import { Card, IconTile } from '@/components/Surface';
import { Chip, StatusChip } from '@/components/Chips';
import { SegmentedProgress } from '@/components/Progress';
import { Avatar, ListRow } from '@/components/Layout';
import { Serif, Txt } from '@/components/Txt';
import { useColors } from '@/theme/ThemeProvider';
import { useStore } from '@/store/DemoStore';
import { dueLabel, fileSize, fmtDate, fmtDateTime, inr, relativeTime } from '@/lib/format';
import {
  findClient,
  findMilestone,
  findProject,
  findUser,
  invoiceBalance,
  milestonesOfProject,
  projectHealth,
  projectProgress,
} from '@/lib/selectors';
import { paymentMethodLabel, statusMeta } from '@/lib/status';

const pct = (n: number) => `${Math.round(n)}`;

export function ProjectCard({ project, onPress }: { project: Project; onPress?: () => void }) {
  const { state } = useStore();
  const prog = projectProgress(state, project.id);
  const health = projectHealth(state, project);
  const client = findClient(state, project.clientId);
  const current = prog.current;
  const due = dueLabel(project.dueDate, project.status === 'completed');
  const footer =
    health === 'blocked'
      ? { text: `Blocked · ${current?.title ?? ''}`, tone: 'danger' as const }
      : health === 'completed'
        ? { text: `Completed · ${prog.milestoneCount} milestones`, tone: 'success' as const }
        : { text: `Milestone ${prog.milestonesDone + 1} of ${prog.milestoneCount} · ${current?.title ?? '—'} · ${due.text}`, tone: due.tone };
  return (
    <Card onPress={onPress ?? (() => router.push(`/project/${project.id}`))} accessibilityLabel={`${project.name}, ${pct(prog.percent)} percent`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt variant="mono" tone="gold" numberOfLines={1}>
            {client?.company}
          </Txt>
          <Txt variant="title" style={{ marginTop: 6, fontSize: 18 }} numberOfLines={2}>
            {project.name}
          </Txt>
        </View>
        <Txt variant="h3" style={{ fontSize: 24, letterSpacing: -1 }}>
          {pct(prog.percent)}
          <Txt variant="bodySm" tone="muted">
            %
          </Txt>
        </Txt>
      </View>
      <View style={{ marginTop: 14 }}>
        <SegmentedProgress segments={prog.parts.map((p) => ({ weight: p.milestone.weight, percent: p.percent, title: p.milestone.title }))} />
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Txt variant="bodySm" tone={footer.tone === 'success' ? 'success' : footer.tone === 'danger' ? 'danger' : footer.tone === 'gold' ? 'gold' : 'muted'} numberOfLines={1} style={{ flex: 1 }}>
          {footer.text}
        </Txt>
        <StatusChip status={project.status} />
      </View>
    </Card>
  );
}

export function TaskCard({ task, showProject = true }: { task: Task; showProject?: boolean }) {
  const { state } = useStore();
  const c = useColors();
  const m = findMilestone(state, task.milestoneId);
  const p = findProject(state, m?.projectId);
  const assignee = findUser(state, task.assigneeId);
  const due = dueLabel(task.dueDate, task.status === 'done');
  const lastReview = state.submissions.find((s) => s.taskId === task.id && s.status === 'changes_requested');
  const blocker = state.blockers.find((b) => b.taskId === task.id && b.status === 'open');
  const attention = task.status === 'changes_requested' || task.status === 'blocked';
  return (
    <Card highlight={attention} onPress={() => router.push(`/task/${task.id}`)} accessibilityLabel={`${task.title}, ${statusMeta(task.status).label}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Txt variant="monoSm" tone="faint" numberOfLines={1} style={{ flex: 1 }}>
          {showProject ? `${p?.name} / ${m?.title}` : m?.title}
        </Txt>
        <StatusChip status={task.status} />
      </View>
      <Txt variant="title" style={{ marginTop: 10 }} numberOfLines={2}>
        {task.title}
      </Txt>
      {task.status === 'changes_requested' && lastReview?.reviewNote ? (
        <Txt variant="bodySm" tone="muted" style={{ marginTop: 8 }} numberOfLines={3}>
          “{lastReview.reviewNote}” · Admin
        </Txt>
      ) : null}
      {blocker ? (
        <View style={{ marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <TriangleAlert size={14} color={c.danger} style={{ marginTop: 2 }} />
          <Txt variant="bodySm" tone="muted" style={{ flex: 1 }} numberOfLines={2}>
            {blocker.description}
          </Txt>
        </View>
      ) : null}
      <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {assignee && showProject ? <Avatar name={assignee.name} size={22} tone="blue" /> : null}
          <Txt variant="bodySm" weight="medium" tone={due.tone === 'muted' ? 'muted' : due.tone} numberOfLines={1}>
            {due.text}
          </Txt>
        </View>
        <Txt variant="monoSm" tone="faint">{`Weight ${task.weight}`}</Txt>
      </View>
    </Card>
  );
}

export function InvoiceCard({ invoice, showClient }: { invoice: Invoice; showClient?: boolean }) {
  const { state } = useStore();
  const b = invoiceBalance(state, invoice);
  const client = findClient(state, invoice.clientId);
  return (
    <Card onPress={() => router.push(`/invoice/${invoice.id}`)} accessibilityLabel={`${invoice.number}, ${inr(b.total)}, ${statusMeta(b.state).label}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Chip label={invoice.number} />
        <StatusChip status={b.state} />
      </View>
      <Txt variant="title" style={{ marginTop: 12 }} numberOfLines={1}>
        {invoice.title}
      </Txt>
      {showClient ? (
        <Txt variant="bodySm" tone="muted" style={{ marginTop: 2 }}>
          {client?.company}
        </Txt>
      ) : null}
      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Txt variant="monoSm" tone="faint">
            {b.state === 'paid' ? 'Total' : 'Balance due'}
          </Txt>
          <Txt variant="h3" style={{ marginTop: 4, fontSize: 22 }}>
            {inr(b.state === 'paid' ? b.total : b.balance)}
          </Txt>
        </View>
        <Txt variant="bodySm" tone={b.state === 'overdue' ? 'danger' : 'muted'}>
          {invoice.status === 'draft' ? 'Not issued' : `Due ${fmtDate(invoice.dueDate)}`}
        </Txt>
      </View>
      {b.pending > 0 ? (
        <Txt variant="caption" tone="gold" style={{ marginTop: 8 }}>
          {inr(b.pending)} awaiting verification
        </Txt>
      ) : null}
    </Card>
  );
}

const METHOD_ICON = { upi: Smartphone, bank_transfer: Landmark, cash: Banknote, online: Smartphone };

export function PaymentRow({ payment, showInvoice, last, onPress }: { payment: Payment; showInvoice?: boolean; last?: boolean; onPress?: () => void }) {
  const { state } = useStore();
  const inv = state.invoices.find((i) => i.id === payment.invoiceId);
  const client = findClient(state, inv?.clientId);
  const subtitle = [
    showInvoice ? `${client?.company} · ${inv?.number}` : null,
    payment.status === 'verified' ? `Verified ${fmtDate(payment.verifiedAt)} · ${payment.receiptNumber}` : payment.status === 'pending' ? `Submitted ${fmtDate(payment.createdAt)}` : payment.rejectionReason,
  ]
    .filter(Boolean)
    .join('\n');
  return (
    <ListRow
      icon={METHOD_ICON[payment.method]}
      iconTone={payment.status === 'pending' ? 'gold' : payment.status === 'verified' ? 'success' : 'danger'}
      title={`${inr(payment.amount)} · ${paymentMethodLabel[payment.method]}`}
      subtitle={subtitle}
      right={<StatusChip status={payment.status === 'pending' ? 'verifying' : payment.status} />}
      onPress={onPress}
      last={last}
    />
  );
}

export function TicketRow({ ticket, last, showClient }: { ticket: Ticket; last?: boolean; showClient?: boolean }) {
  const { state } = useStore();
  const client = findClient(state, ticket.clientId);
  return (
    <ListRow
      title={ticket.subject}
      subtitle={`${ticket.number}${showClient ? ` · ${client?.company}` : ''} · ${relativeTime(ticket.messages[ticket.messages.length - 1]?.createdAt ?? ticket.createdAt)}`}
      right={<StatusChip status={ticket.status} />}
      onPress={() => router.push(`/ticket/${ticket.id}`)}
      last={last}
    />
  );
}

export function FileRow({ file, last, right, onPress }: { file: FileItem; last?: boolean; right?: React.ReactNode; onPress?: () => void }) {
  const { state } = useStore();
  const who = findUser(state, file.uploadedBy);
  const isImage = file.mime.startsWith('image/');
  return (
    <ListRow
      icon={isImage ? ImageIcon : file.mime === 'application/pdf' ? FileText : Paperclip}
      iconTone={file.visibility === 'client' ? 'gold' : 'neutral'}
      title={file.name}
      subtitle={`${fileSize(file.size)} · ${who?.name.split(' ')[0] ?? ''} · ${fmtDate(file.createdAt)}`}
      right={right ?? <Chip label={file.visibility === 'client' ? 'Shared' : 'Internal'} tone={file.visibility === 'client' ? 'gold' : 'neutral'} />}
      onPress={onPress}
      last={last}
    />
  );
}

export function UpdateCard({ update, showProject, action }: { update: ProjectUpdate; showProject?: boolean; action?: React.ReactNode }) {
  const { state } = useStore();
  const c = useColors();
  const m = findMilestone(state, update.milestoneId);
  const p = findProject(state, update.projectId);
  const files = state.files.filter((f) => update.fileIds.includes(f.id));
  const words = update.title.split(' ');
  const tail = words.length > 3 ? words.slice(-3).join(' ') : '';
  const head = tail ? words.slice(0, -3).join(' ') : update.title;
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Txt variant="monoSm" tone="faint" numberOfLines={1} style={{ flex: 1 }}>
          {[fmtDate(update.publishedAt ?? update.createdAt), showProject ? p?.name : null, m?.title].filter(Boolean).join(' · ')}
        </Txt>
        {update.status !== 'published' ? <StatusChip status={update.status} /> : null}
      </View>
      <Txt variant="h3" style={{ marginTop: 10, fontSize: 20, lineHeight: 25 }}>
        {head}
        {tail ? (
          <>
            {' '}
            <Serif size={23}>{tail}</Serif>
          </>
        ) : null}
      </Txt>
      <Txt variant="body" tone="muted" style={{ marginTop: 10, fontSize: 14, lineHeight: 22 }}>
        {update.body}
      </Txt>
      {files.length ? (
        <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.line, gap: 10 }}>
          <Txt variant="monoSm" tone="faint">
            Shared files
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {files.map((f) => (
              <Chip key={f.id} label={f.name} icon={FileText} />
            ))}
          </View>
        </View>
      ) : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </Card>
  );
}

export function MessageBubble({ authorId, body, createdAt, mine, internal }: { authorId: string; body: string; createdAt: string; mine: boolean; internal?: boolean }) {
  const { state } = useStore();
  const c = useColors();
  const author = findUser(state, authorId);
  return (
    <View style={{ flexDirection: mine ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end' }}>
      <Avatar name={author?.name ?? '?'} size={30} tone={author?.role === 'client' ? 'neutral' : mine ? 'blue' : 'gold'} />
      <View
        style={{
          maxWidth: '78%',
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 18,
          borderBottomRightRadius: mine ? 6 : 18,
          borderBottomLeftRadius: mine ? 18 : 6,
          backgroundColor: internal ? c.goldTint : mine ? c.card2 : c.card,
          borderWidth: 1,
          borderColor: internal ? c.goldBorder : c.line,
        }}
      >
        <Txt variant="caption" weight="semibold" tone={mine ? 'blue' : 'gold'}>
          {mine ? 'You' : author?.name}
          {internal ? <Txt variant="caption" tone="gold">{'  · Internal note'}</Txt> : null}
        </Txt>
        <Txt variant="body" style={{ marginTop: 3, fontSize: 14.5, lineHeight: 21 }}>
          {body}
        </Txt>
        <Txt variant="caption" tone="faint" style={{ marginTop: 4, fontSize: 11 }}>
          {fmtDateTime(createdAt)}
        </Txt>
      </View>
    </View>
  );
}

/** Milestone timeline (website process nodes: done = gold fill, current = gold ring + halo). */
export function MilestoneTimeline({ projectId, clientView, onPressMilestone }: { projectId: string; clientView?: boolean; onPressMilestone?: (id: string) => void }) {
  const { state } = useStore();
  const c = useColors();
  const prog = projectProgress(state, projectId);
  const ms = milestonesOfProject(state, projectId).filter((m) => !clientView || m.clientVisible);
  const currentId = prog.current?.id;
  return (
    <View>
      {ms.map((m, i) => {
        const part = prog.parts.find((p) => p.milestone.id === m.id);
        const percent = part?.percent ?? 0;
        const done = percent === 100;
        const current = m.id === currentId;
        const last = i === ms.length - 1;
        return (
          <View key={m.id} style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ alignItems: 'center', width: 31 }}>
              <View
                style={{
                  width: 31,
                  height: 31,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? c.gold : c.bg,
                  borderWidth: 1,
                  borderColor: done || current ? c.gold : c.lineStrong,
                  boxShadow: current ? '0px 0px 0px 6px rgba(214,179,74,0.14)' : undefined,
                }}
              >
                {done ? <Txt style={{ color: c.onGold, fontSize: 14, fontFamily: 'Geist_600SemiBold' }}>✓</Txt> : current ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.gold }} /> : null}
              </View>
              {!last ? <View style={{ flex: 1, width: 1, backgroundColor: done ? c.gold : c.lineStrong, minHeight: 18 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : 20 }}>
              {current ? (
                <Card padding={14} onPress={onPressMilestone ? () => onPressMilestone(m.id) : undefined} style={{ marginTop: -4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Txt variant="title">{m.title}</Txt>
                    <Txt variant="mono" tone="gold">{`${Math.round(percent)}%`}</Txt>
                  </View>
                  <View style={{ marginTop: 10, height: 4, borderRadius: 2, backgroundColor: c.lineStrong }}>
                    <View style={{ width: `${percent}%`, height: '100%', borderRadius: 2, backgroundColor: c.gold }} />
                  </View>
                  <Txt variant="bodySm" tone="muted" style={{ marginTop: 10 }}>
                    {`In progress · Due ${fmtDate(m.dueDate)}${clientView ? '' : ` · Weight ${m.weight}`}`}
                  </Txt>
                </Card>
              ) : (
                <View style={{ paddingTop: 5 }}>
                  <Txt
                    variant="title"
                    tone={done ? 'fg' : 'muted'}
                    onPress={onPressMilestone ? () => onPressMilestone(m.id) : undefined}
                    suppressHighlighting
                  >
                    {m.title}
                  </Txt>
                  <Txt variant="bodySm" tone={done ? 'muted' : 'faint'} style={{ marginTop: 2 }}>
                    {done
                      ? `Completed · ${fmtDate(m.dueDate)}`
                      : `${percent > 0 ? `${Math.round(percent)}% · ` : ''}Upcoming · Due ${fmtDate(m.dueDate)}`}
                    {clientView ? '' : ` · Weight ${m.weight}`}
                  </Txt>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export { IconTile };
