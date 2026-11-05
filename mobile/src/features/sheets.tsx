import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { Button, IconButton } from '@/components/Button';
import { Field, FilePicker, MultiSelect, OptionGroup, Sheet, SwitchRow, type PickedFile } from '@/components/Form';
import { Card } from '@/components/Surface';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import type { FileItem, PaymentMethod, Priority } from '@/data/types';
import { DEMO_TODAY, inr } from '@/lib/format';
import { findMilestone, invoiceBalance, milestonesOfProject, invoiceTotals } from '@/lib/selectors';
import { useColors } from '@/theme/ThemeProvider';

type SheetProps = { visible: boolean; onClose: () => void };

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
const num = (s: string) => Number.parseFloat(s.replace(/[,₹\s]/g, ''));
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function useResetOnOpen(visible: boolean, reset: () => void) {
  useEffect(() => {
    if (visible) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
}

/* ---------------------------------------------------------------- projects */

export function NewProjectSheet({ visible, onClose }: SheetProps) {
  const { state, actions } = useStore();
  const { user } = useMe();
  const toast = useToast();
  const team = state.users.filter((u) => u.role === 'team' && u.status === 'active');
  const [f, setF] = useState({ name: '', clientId: state.clients[0]?.id ?? '', category: 'Website', priority: 'medium' as Priority, startDate: DEMO_TODAY, dueDate: '', budget: '', description: '', members: [] as string[] });
  const [err, setErr] = useState<Record<string, string>>({});
  useResetOnOpen(visible, () => {
    setF({ name: '', clientId: state.clients[0]?.id ?? '', category: 'Website', priority: 'medium', startDate: DEMO_TODAY, dueDate: '', budget: '', description: '', members: [] });
    setErr({});
  });
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Give the project a name.';
    if (!isDate(f.startDate)) e.startDate = 'Use YYYY-MM-DD.';
    if (!isDate(f.dueDate)) e.dueDate = 'Use YYYY-MM-DD.';
    else if (f.dueDate < f.startDate) e.dueDate = 'Due date must be after the start date.';
    if (f.budget && !(num(f.budget) >= 0)) e.budget = 'Enter a number.';
    setErr(e);
    if (Object.keys(e).length) return;
    const id = actions.createProject({
      name: f.name.trim(),
      clientId: f.clientId,
      category: f.category,
      priority: f.priority,
      startDate: f.startDate,
      dueDate: f.dueDate,
      budget: f.budget ? num(f.budget) : undefined,
      description: f.description.trim(),
      memberIds: f.members,
      managerId: user.id,
      status: 'planning',
    });
    toast('Project created. Add milestones next.');
    onClose();
    router.push(`/project/${id}?tab=milestones`);
  };
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow="New project" title="Start a project" footer={<Button label="Create project" full onPress={save} />}>
      <Field label="Project name" value={f.name} onChangeText={(name) => setF({ ...f, name })} placeholder="e.g. Clinic booking app" error={err.name} />
      <OptionGroup label="Client" value={f.clientId} onChange={(clientId) => setF({ ...f, clientId })} options={state.clients.map((c) => ({ value: c.id, label: c.company }))} />
      <OptionGroup label="Type" value={f.category} onChange={(category) => setF({ ...f, category })} options={['Website', 'Web app', 'Mobile app', 'Branding'].map((v) => ({ value: v, label: v }))} />
      <OptionGroup label="Priority" value={f.priority} onChange={(priority) => setF({ ...f, priority })} options={PRIORITIES} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Start" hint="YYYY-MM-DD" value={f.startDate} onChangeText={(startDate) => setF({ ...f, startDate })} error={err.startDate} autoCapitalize="none" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Due" hint="YYYY-MM-DD" value={f.dueDate} onChangeText={(dueDate) => setF({ ...f, dueDate })} placeholder="2027-01-31" error={err.dueDate} autoCapitalize="none" />
        </View>
      </View>
      <Field label="Budget" hint="optional" prefix="₹" value={f.budget} onChangeText={(budget) => setF({ ...f, budget })} keyboardType="numeric" error={err.budget} />
      <MultiSelect label="Team" values={f.members} onChange={(members) => setF({ ...f, members })} options={team.map((u) => ({ value: u.id, label: u.name }))} />
      <Field label="Description" value={f.description} onChangeText={(description) => setF({ ...f, description })} multiline placeholder="What are we building?" />
    </Sheet>
  );
}

export function NewMilestoneSheet({ visible, onClose, projectId }: SheetProps & { projectId: string }) {
  const { actions } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ title: '', weight: '10', startDate: '', dueDate: '', description: '', clientVisible: true });
  const [err, setErr] = useState<Record<string, string>>({});
  useResetOnOpen(visible, () => {
    setF({ title: '', weight: '10', startDate: '', dueDate: '', description: '', clientVisible: true });
    setErr({});
  });
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'Name the milestone.';
    if (!(num(f.weight) > 0)) e.weight = 'Weight must be more than 0.';
    if (f.startDate && !isDate(f.startDate)) e.startDate = 'Use YYYY-MM-DD.';
    if (f.dueDate && !isDate(f.dueDate)) e.dueDate = 'Use YYYY-MM-DD.';
    setErr(e);
    if (Object.keys(e).length) return;
    actions.createMilestone({
      projectId,
      title: f.title.trim(),
      weight: num(f.weight),
      startDate: f.startDate || undefined,
      dueDate: f.dueDate || undefined,
      description: f.description.trim() || undefined,
      clientVisible: f.clientVisible,
    });
    toast('Milestone added');
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow="New milestone" title="Add a milestone" footer={<Button label="Add milestone" full onPress={save} />}>
      <Field label="Title" value={f.title} onChangeText={(title) => setF({ ...f, title })} placeholder="e.g. Backend" error={err.title} />
      <Field label="Weight" hint="relative to other milestones" value={f.weight} onChangeText={(weight) => setF({ ...f, weight })} keyboardType="numeric" error={err.weight} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Start" hint="YYYY-MM-DD" value={f.startDate} onChangeText={(startDate) => setF({ ...f, startDate })} error={err.startDate} autoCapitalize="none" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Due" hint="YYYY-MM-DD" value={f.dueDate} onChangeText={(dueDate) => setF({ ...f, dueDate })} error={err.dueDate} autoCapitalize="none" />
        </View>
      </View>
      <Field label="Description" value={f.description} onChangeText={(description) => setF({ ...f, description })} multiline />
      <Card padding={0}>
        <SwitchRow label="Visible to client" description="Clients see this milestone and its approved progress." value={f.clientVisible} onValueChange={(clientVisible) => setF({ ...f, clientVisible })} />
      </Card>
    </Sheet>
  );
}

export function NewTaskSheet({ visible, onClose, projectId, milestoneId }: SheetProps & { projectId: string; milestoneId?: string }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const project = state.projects.find((p) => p.id === projectId);
  const milestones = milestonesOfProject(state, projectId);
  const people = state.users.filter((u) => (u.role === 'team' || u.role === 'admin') && u.status === 'active' && (project?.memberIds.includes(u.id) || u.role === 'admin'));
  const blank = { title: '', milestoneId: milestoneId ?? milestones[0]?.id ?? '', assigneeId: people.find((p) => p.role === 'team')?.id ?? '', weight: '10', priority: 'medium' as Priority, dueDate: '', description: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  useResetOnOpen(visible, () => {
    setF(blank);
    setErr({});
  });
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'Describe the task.';
    if (!f.milestoneId) e.title = 'Add a milestone first.';
    if (!(num(f.weight) > 0)) e.weight = 'Weight must be more than 0.';
    if (f.dueDate && !isDate(f.dueDate)) e.dueDate = 'Use YYYY-MM-DD.';
    setErr(e);
    if (Object.keys(e).length) return;
    actions.createTask({
      milestoneId: f.milestoneId,
      title: f.title.trim(),
      assigneeId: f.assigneeId || undefined,
      weight: num(f.weight),
      priority: f.priority,
      dueDate: f.dueDate || undefined,
      description: f.description.trim() || undefined,
    });
    toast('Task created and assigned');
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow={project?.name ?? 'New task'} title="Assign a task" footer={<Button label="Create task" full onPress={save} />}>
      <Field label="Task" value={f.title} onChangeText={(title) => setF({ ...f, title })} placeholder="e.g. Payment confirmation screen" error={err.title} />
      {!milestoneId ? (
        <OptionGroup label="Milestone" value={f.milestoneId} onChange={(id) => setF({ ...f, milestoneId: id })} options={milestones.map((m) => ({ value: m.id, label: m.title }))} />
      ) : null}
      <OptionGroup label="Assign to" value={f.assigneeId} onChange={(assigneeId) => setF({ ...f, assigneeId })} options={people.map((u) => ({ value: u.id, label: u.name.split(' ')[0] }))} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Weight" value={f.weight} onChangeText={(weight) => setF({ ...f, weight })} keyboardType="numeric" error={err.weight} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Due" hint="YYYY-MM-DD" value={f.dueDate} onChangeText={(dueDate) => setF({ ...f, dueDate })} error={err.dueDate} autoCapitalize="none" />
        </View>
      </View>
      <OptionGroup label="Priority" value={f.priority} onChange={(priority) => setF({ ...f, priority })} options={PRIORITIES} />
      <Field label="Details" value={f.description} onChangeText={(description) => setF({ ...f, description })} multiline placeholder="Acceptance criteria, links, notes" />
      <Txt variant="caption" tone="faint">
        A task counts toward progress only after an admin verifies the submitted work.
      </Txt>
    </Sheet>
  );
}

export function NewUpdateSheet({ visible, onClose, projectId }: SheetProps & { projectId: string }) {
  const { state, actions } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const milestones = milestonesOfProject(state, projectId);
  const [f, setF] = useState({ title: '', body: '', milestoneId: milestones.find((m) => m.status === 'in_progress')?.id ?? '' });
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setF({ title: '', body: '', milestoneId: milestones.find((m) => m.status === 'in_progress')?.id ?? '' });
    setErr(undefined);
  });
  const save = (publish: boolean) => {
    if (!f.title.trim() || !f.body.trim()) return setErr('Add a title and a message.');
    actions.createUpdate({ projectId, milestoneId: f.milestoneId || undefined, title: f.title.trim(), body: f.body.trim(), authorId: user.id }, publish);
    toast(publish ? 'Update published to the client' : 'Update sent for admin approval');
    onClose();
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Client update"
      title="Write an update"
      footer={
        role === 'admin' ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Save draft" variant="ghost" onPress={() => save(false)} style={{ flex: 1 }} />
            <Button label="Publish" onPress={() => save(true)} style={{ flex: 1 }} />
          </View>
        ) : (
          <Button label="Send for approval" full onPress={() => save(false)} />
        )
      }
    >
      <Field label="Title" value={f.title} onChangeText={(title) => setF({ ...f, title })} placeholder="e.g. Homepage ready for review" />
      <OptionGroup label="Milestone" value={f.milestoneId} onChange={(milestoneId) => setF({ ...f, milestoneId })} options={milestones.map((m) => ({ value: m.id, label: m.title }))} />
      <Field label="Message to the client" value={f.body} onChangeText={(body) => setF({ ...f, body })} multiline error={err} />
      <Txt variant="caption" tone="faint">
        Clients only see updates after an admin approves and publishes them.
      </Txt>
    </Sheet>
  );
}

export function UploadFilesSheet({ visible, onClose, projectId }: SheetProps & { projectId: string }) {
  const { actions } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [visibility, setVisibility] = useState<FileItem['visibility']>('internal');
  useResetOnOpen(visible, () => {
    setFiles([]);
    setVisibility('internal');
  });
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Files"
      title="Upload files"
      footer={
        <Button
          label={`Upload ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
          full
          disabled={!files.length}
          onPress={() => {
            actions.addFiles(projectId, user.id, files, visibility);
            toast(`${files.length} file${files.length === 1 ? '' : 's'} added`);
            onClose();
          }}
        />
      }
    >
      <FilePicker files={files} onChange={setFiles} />
      {role === 'admin' ? (
        <OptionGroup
          label="Who can see these files"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: 'internal', label: 'Team only' },
            { value: 'client', label: 'Shared with client' },
          ]}
        />
      ) : (
        <Txt variant="caption" tone="faint">
          Files you upload are internal. An admin decides what is shared with the client.
        </Txt>
      )}
      <Txt variant="caption" tone="faint">
        Demo build: files are listed but not stored. Storage is connected in the integration stage.
      </Txt>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- team workflow */

export function SubmitWorkSheet({ visible, onClose, taskId }: SheetProps & { taskId: string }) {
  const { state, actions } = useStore();
  const { user } = useMe();
  const toast = useToast();
  const task = state.tasks.find((t) => t.id === taskId);
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setNotes('');
    setLinks('');
    setFiles([]);
    setErr(undefined);
  });
  const save = () => {
    if (!notes.trim()) return setErr('Describe what you finished so the reviewer knows what to check.');
    const linkList = links.split(/\s+/).map((l) => l.trim()).filter(Boolean);
    const bad = linkList.find((l) => !/^https?:\/\//.test(l));
    if (bad) return setErr(`Links must start with https:// (${bad})`);
    actions.submitTask(taskId, user.id, notes.trim(), linkList, files);
    toast('Submitted for review');
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow={task?.title} title="Submit your work" footer={<Button label="Submit for review" full onPress={save} />}>
      <Field label="What did you finish?" value={notes} onChangeText={setNotes} multiline placeholder="What changed, how it was tested, anything the reviewer should know" error={err} />
      <Field label="Links" hint="one per line" value={links} onChangeText={setLinks} multiline autoCapitalize="none" placeholder="https://preview…" />
      <FilePicker files={files} onChange={setFiles} label="Deliverables" />
    </Sheet>
  );
}

export function BlockerSheet({ visible, onClose, taskId }: SheetProps & { taskId: string }) {
  const { actions } = useStore();
  const { user } = useMe();
  const toast = useToast();
  const [text, setText] = useState('');
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setText('');
    setErr(undefined);
  });
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Blocker"
      title="What is blocking you?"
      footer={
        <Button
          label="Report blocker"
          variant="danger"
          full
          onPress={() => {
            if (text.trim().length < 6) return setErr('Describe the blocker in a sentence.');
            actions.reportBlocker(taskId, user.id, text.trim());
            toast('Blocker reported to the admin');
            onClose();
          }}
        />
      }
    >
      <Field label="Blocker" value={text} onChangeText={setText} multiline placeholder="e.g. Waiting for API keys from the client" error={err} />
      <Txt variant="caption" tone="faint">
        The task is marked Blocked and the admin is notified.
      </Txt>
    </Sheet>
  );
}

export function ReviewSheet({ visible, onClose, taskId }: SheetProps & { taskId: string }) {
  const { actions } = useStore();
  const toast = useToast();
  const [decision, setDecision] = useState<'verified' | 'changes_requested'>('verified');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setDecision('verified');
    setNote('');
    setErr(undefined);
  });
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Review"
      title="Review submission"
      footer={
        <Button
          label={decision === 'verified' ? 'Verify work' : 'Request changes'}
          variant={decision === 'verified' ? 'primary' : 'ghost'}
          full
          onPress={() => {
            if (decision === 'changes_requested' && !note.trim()) return setErr('Tell the team member what to change.');
            actions.reviewSubmission(taskId, decision, note.trim());
            toast(decision === 'verified' ? 'Verified. Progress updated.' : 'Changes requested');
            onClose();
          }}
        />
      }
    >
      <OptionGroup
        label="Decision"
        value={decision}
        onChange={setDecision}
        options={[
          { value: 'verified', label: 'Verify' },
          { value: 'changes_requested', label: 'Request changes' },
        ]}
      />
      <Field label={decision === 'verified' ? 'Note (optional)' : 'What needs to change?'} value={note} onChangeText={setNote} multiline error={err} />
      <Txt variant="caption" tone="faint">
        Verified tasks count toward milestone and project progress, including what the client sees.
      </Txt>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- people */

export function NewClientSheet({ visible, onClose }: SheetProps) {
  const { actions } = useStore();
  const toast = useToast();
  const blank = { company: '', contactName: '', email: '', phone: '', city: '', gstin: '', login: true };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  useResetOnOpen(visible, () => {
    setF(blank);
    setErr({});
  });
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.company.trim()) e.company = 'Company name is required.';
    if (!f.contactName.trim()) e.contactName = 'Add a contact person.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email.';
    setErr(e);
    if (Object.keys(e).length) return;
    const id = actions.createClient({ company: f.company.trim(), contactName: f.contactName.trim(), email: f.email.trim(), phone: f.phone.trim(), city: f.city.trim(), gstin: f.gstin.trim() || undefined }, f.login);
    toast(f.login ? 'Client added with portal login' : 'Client added');
    onClose();
    router.push(`/clients/${id}`);
  };
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow="New client" title="Add a client" footer={<Button label="Add client" full onPress={save} />}>
      <Field label="Company" value={f.company} onChangeText={(company) => setF({ ...f, company })} error={err.company} />
      <Field label="Contact person" value={f.contactName} onChangeText={(contactName) => setF({ ...f, contactName })} autoComplete="name" error={err.contactName} />
      <Field label="Email" value={f.email} onChangeText={(email) => setF({ ...f, email })} keyboardType="email-address" autoCapitalize="none" error={err.email} />
      <Field label="Phone" value={f.phone} onChangeText={(phone) => setF({ ...f, phone })} keyboardType="phone-pad" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="City" value={f.city} onChangeText={(city) => setF({ ...f, city })} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="GSTIN" hint="optional" value={f.gstin} onChangeText={(gstin) => setF({ ...f, gstin })} autoCapitalize="none" />
        </View>
      </View>
      <Card padding={0}>
        <SwitchRow label="Create portal login" description="The contact can sign in to the client portal." value={f.login} onValueChange={(login) => setF({ ...f, login })} />
      </Card>
    </Sheet>
  );
}

export function NewMemberSheet({ visible, onClose }: SheetProps) {
  const { actions } = useStore();
  const toast = useToast();
  const blank = { name: '', email: '', phone: '', jobTitle: '', role: 'team' as 'team' | 'admin' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  useResetOnOpen(visible, () => {
    setF(blank);
    setErr({});
  });
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email.';
    setErr(e);
    if (Object.keys(e).length) return;
    const id = actions.createMember({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), jobTitle: f.jobTitle.trim(), role: f.role });
    toast('Account created. Share the login details securely.');
    onClose();
    router.push(`/members/${id}`);
  };
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow="New account" title="Add a team member" footer={<Button label="Create account" full onPress={save} />}>
      <Field label="Full name" value={f.name} onChangeText={(name) => setF({ ...f, name })} autoComplete="name" error={err.name} />
      <Field label="Work email" value={f.email} onChangeText={(email) => setF({ ...f, email })} keyboardType="email-address" autoCapitalize="none" error={err.email} />
      <Field label="Phone" value={f.phone} onChangeText={(phone) => setF({ ...f, phone })} keyboardType="phone-pad" />
      <Field label="Job title" value={f.jobTitle} onChangeText={(jobTitle) => setF({ ...f, jobTitle })} placeholder="e.g. Frontend developer" />
      <OptionGroup
        label="Role"
        value={f.role}
        onChange={(role) => setF({ ...f, role })}
        options={[
          { value: 'team', label: 'Team' },
          { value: 'admin', label: 'Admin' },
        ]}
      />
    </Sheet>
  );
}

/* ---------------------------------------------------------------- finance */

type Line = { description: string; amount: string; gst: string };

export function NewInvoiceSheet({ visible, onClose, clientId: fixedClient }: SheetProps & { clientId?: string }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const c = useColors();
  const [clientId, setClientId] = useState(fixedClient ?? state.clients[0]?.id ?? '');
  const projects = state.projects.filter((p) => p.clientId === clientId);
  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-20');
  const [notes, setNotes] = useState('Payment by UPI or bank transfer. Share the transaction reference in the app.');
  const [lines, setLines] = useState<Line[]>([{ description: '', amount: '', gst: '18' }]);
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setClientId(fixedClient ?? state.clients[0]?.id ?? '');
    setProjectId('');
    setTitle('');
    setDueDate('2026-11-20');
    setLines([{ description: '', amount: '', gst: '18' }]);
    setErr(undefined);
  });
  const items = lines.map((l) => ({ description: l.description.trim(), quantity: 1, unitPrice: num(l.amount) || 0, taxRate: num(l.gst) || 0 }));
  const totals = invoiceTotals({ items } as never);
  const save = (issue: boolean) => {
    if (!title.trim()) return setErr('Add an invoice title.');
    if (items.some((i) => !i.description || !(i.unitPrice > 0))) return setErr('Every line needs a description and an amount.');
    if (!isDate(dueDate)) return setErr('Due date must be YYYY-MM-DD.');
    const id = actions.createInvoice({
      clientId,
      projectId: projectId || undefined,
      title: title.trim(),
      status: issue ? 'issued' : 'draft',
      issueDate: issue ? DEMO_TODAY : undefined,
      dueDate,
      items,
      notes: notes.trim() || undefined,
    });
    toast(issue ? 'Invoice issued to the client' : 'Draft saved');
    onClose();
    router.push(`/invoice/${id}`);
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="New invoice"
      title="Create an invoice"
      footer={
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt variant="bodySm" tone="muted">
              Total incl. GST
            </Txt>
            <Txt variant="title">{inr(totals.total)}</Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Save draft" variant="ghost" onPress={() => save(false)} style={{ flex: 1 }} />
            <Button label="Issue" onPress={() => save(true)} style={{ flex: 1 }} />
          </View>
        </>
      }
    >
      {!fixedClient ? (
        <OptionGroup
          label="Client"
          value={clientId}
          onChange={(v) => {
            setClientId(v);
            setProjectId('');
          }}
          options={state.clients.map((cl) => ({ value: cl.id, label: cl.company }))}
        />
      ) : null}
      {projects.length ? (
        <OptionGroup label="Project" value={projectId} onChange={setProjectId} options={[{ value: '', label: 'None' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
      ) : null}
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Backend milestone" />
      <Txt variant="bodySm" weight="medium">
        Line items
      </Txt>
      {lines.map((l, i) => (
        <View key={i} style={{ gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="monoSm" tone="faint">{`Item ${i + 1}`}</Txt>
            {lines.length > 1 ? <IconButton icon={Trash2} label={`Remove item ${i + 1}`} size={34} onPress={() => setLines(lines.filter((_, j) => j !== i))} /> : null}
          </View>
          <Field label="Description" value={l.description} onChangeText={(description) => setLines(lines.map((x, j) => (j === i ? { ...x, description } : x)))} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 2 }}>
              <Field label="Amount" hint="before GST" prefix="₹" value={l.amount} onChangeText={(amount) => setLines(lines.map((x, j) => (j === i ? { ...x, amount } : x)))} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="GST %" value={l.gst} onChangeText={(gst) => setLines(lines.map((x, j) => (j === i ? { ...x, gst } : x)))} keyboardType="numeric" />
            </View>
          </View>
        </View>
      ))}
      <Button label="Add line" icon={Plus} variant="ghost" size="sm" onPress={() => setLines([...lines, { description: '', amount: '', gst: '18' }])} />
      <Field label="Due date" hint="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} autoCapitalize="none" />
      <Field label="Notes on invoice" value={notes} onChangeText={setNotes} multiline error={err} />
    </Sheet>
  );
}

const METHODS: { value: Exclude<PaymentMethod, 'online'>; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
];

/** Manual payment: clients submit it for verification; admins can record and verify at once. */
export function RecordPaymentSheet({ visible, onClose, invoiceId }: SheetProps & { invoiceId: string }) {
  const { state, actions } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const inv = state.invoices.find((i) => i.id === invoiceId);
  const bal = useMemo(() => (inv ? invoiceBalance(state, inv) : null), [inv, state]);
  const open = bal ? Math.max(0, bal.balance - (role === 'admin' ? 0 : bal.pending)) : 0;
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Exclude<PaymentMethod, 'online'>>('upi');
  const [paidOn, setPaidOn] = useState(DEMO_TODAY);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState<PickedFile[]>([]);
  const [verifyNow, setVerifyNow] = useState(true);
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setAmount(open ? String(open) : '');
    setMethod('upi');
    setPaidOn(DEMO_TODAY);
    setReference('');
    setNote('');
    setProof([]);
    setVerifyNow(true);
    setErr(undefined);
  });
  if (!inv || !bal) return null;
  const save = () => {
    const value = num(amount);
    if (!(value > 0)) return setErr('Enter the amount paid.');
    if (!isDate(paidOn)) return setErr('Payment date must be YYYY-MM-DD.');
    if (method !== 'cash' && !reference.trim()) return setErr(method === 'upi' ? 'Add the UPI transaction ID.' : 'Add the bank UTR / reference number.');
    const res = actions.recordPayment(
      { invoiceId, amount: value, method, paidOn, reference: reference.trim() || undefined, note: note.trim() || undefined, proofName: proof[0]?.name },
      user.id,
      role === 'admin' && verifyNow
    );
    if (!res.ok) return setErr(res.error);
    toast(role === 'admin' && verifyNow ? 'Payment recorded and verified' : 'Payment submitted. We will verify it shortly.');
    onClose();
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow={inv.number}
      title={role === 'admin' ? 'Record a payment' : 'Tell us about your payment'}
      footer={<Button label={role === 'admin' ? 'Save payment' : 'Submit for verification'} full onPress={save} />}
    >
      <Card glass brackets padding={16}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt variant="monoSm" tone="faint">
            Balance due
          </Txt>
          <Txt variant="monoSm" tone="faint">
            Awaiting verification
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Txt variant="title">{inr(bal.balance)}</Txt>
          <Txt variant="title" tone="gold">
            {inr(bal.pending)}
          </Txt>
        </View>
      </Card>
      {role === 'client' ? (
        <Card padding={16}>
          <Txt variant="monoSm" tone="gold">
            Pay Varuag Labs (demo details)
          </Txt>
          <Txt variant="bodySm" style={{ marginTop: 8 }}>
            UPI ID: varuaglabs@demo-upi
          </Txt>
          <Txt variant="bodySm">Bank: Demo Bank · A/c 0000 0000 0000 · IFSC DEMO0000001</Txt>
          <Txt variant="caption" tone="faint" style={{ marginTop: 6 }}>
            Pay first, then submit the details here. Online payment will be added later.
          </Txt>
        </Card>
      ) : null}
      <Field label="Amount" prefix="₹" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <OptionGroup label="Method" value={method} onChange={setMethod} options={METHODS} />
      <Field label="Payment date" hint="YYYY-MM-DD" value={paidOn} onChangeText={setPaidOn} autoCapitalize="none" />
      <Field
        label={method === 'upi' ? 'UPI transaction ID' : method === 'bank_transfer' ? 'UTR / reference' : 'Received by / note'}
        hint={method === 'cash' ? 'optional' : undefined}
        value={reference}
        onChangeText={setReference}
        autoCapitalize="none"
      />
      {role === 'client' ? <FilePicker files={proof} onChange={(f) => setProof(f.slice(-1))} label="Payment screenshot (optional)" /> : null}
      <Field label="Note" hint="optional" value={note} onChangeText={setNote} multiline error={err} />
      {role === 'admin' ? (
        <Card padding={0}>
          <SwitchRow label="Mark as verified now" description="Issues a receipt number and reduces the balance immediately." value={verifyNow} onValueChange={setVerifyNow} />
        </Card>
      ) : null}
    </Sheet>
  );
}

export function RejectPaymentSheet({ visible, onClose, paymentId }: SheetProps & { paymentId: string }) {
  const { actions } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setReason('');
    setErr(undefined);
  });
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Payment"
      title="Reject payment"
      footer={
        <Button
          label="Reject payment"
          variant="danger"
          full
          onPress={() => {
            if (!reason.trim()) return setErr('The client sees this reason.');
            actions.rejectPayment(paymentId, reason.trim());
            toast('Payment rejected. The client was notified.');
            onClose();
          }}
        />
      }
    >
      <Field label="Reason" value={reason} onChangeText={setReason} multiline placeholder="e.g. No matching transaction in the bank statement" error={err} />
    </Sheet>
  );
}

export function NewExpenseSheet({ visible, onClose }: SheetProps) {
  const { state, actions } = useStore();
  const toast = useToast();
  const blank = { category: 'Software', description: '', amount: '', date: DEMO_TODAY, projectId: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setF(blank);
    setErr(undefined);
  });
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Expense"
      title="Log an expense"
      footer={
        <Button
          label="Save expense"
          full
          onPress={() => {
            if (!f.description.trim() || !(num(f.amount) > 0)) return setErr('Add a description and an amount.');
            if (!isDate(f.date)) return setErr('Date must be YYYY-MM-DD.');
            actions.createExpense({ category: f.category, description: f.description.trim(), amount: num(f.amount), date: f.date, projectId: f.projectId || undefined });
            toast('Expense logged for approval');
            onClose();
          }}
        />
      }
    >
      <OptionGroup label="Category" value={f.category} onChange={(category) => setF({ ...f, category })} options={['Software', 'Hosting', 'Domain', 'Travel', 'Other'].map((v) => ({ value: v, label: v }))} />
      <Field label="Description" value={f.description} onChangeText={(description) => setF({ ...f, description })} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Amount" prefix="₹" value={f.amount} onChangeText={(amount) => setF({ ...f, amount })} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Date" hint="YYYY-MM-DD" value={f.date} onChangeText={(date) => setF({ ...f, date })} autoCapitalize="none" />
        </View>
      </View>
      <OptionGroup label="Project" value={f.projectId} onChange={(projectId) => setF({ ...f, projectId })} options={[{ value: '', label: 'General' }, ...state.projects.map((p) => ({ value: p.id, label: p.name }))]} />
      {err ? (
        <Txt variant="caption" tone="danger">
          {err}
        </Txt>
      ) : null}
    </Sheet>
  );
}

/* ---------------------------------------------------------------- support & comms */

export function NewTicketSheet({ visible, onClose }: SheetProps) {
  const { state, actions } = useStore();
  const { user } = useMe();
  const toast = useToast();
  const projects = state.projects.filter((p) => p.clientId === user.clientId);
  const blank = { projectId: projects[0]?.id ?? '', subject: '', description: '', priority: 'medium' as Priority };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setF(blank);
    setErr(undefined);
  });
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Support"
      title="How can we help?"
      footer={
        <Button
          label="Send request"
          full
          onPress={() => {
            if (!f.subject.trim() || !f.description.trim()) return setErr('Add a subject and describe the request.');
            const id = actions.createTicket({ clientId: user.clientId!, projectId: f.projectId || undefined, raisedBy: user.id, subject: f.subject.trim(), description: f.description.trim(), priority: f.priority });
            toast('Request sent. We usually reply within a working day.');
            onClose();
            router.push(`/ticket/${id}`);
          }}
        />
      }
    >
      <OptionGroup label="Project" value={f.projectId} onChange={(projectId) => setF({ ...f, projectId })} options={[...projects.map((p) => ({ value: p.id, label: p.name })), { value: '', label: 'Other' }]} />
      <Field label="Subject" value={f.subject} onChangeText={(subject) => setF({ ...f, subject })} placeholder="e.g. Change the homepage banner" />
      <OptionGroup label="Priority" value={f.priority} onChange={(priority) => setF({ ...f, priority })} options={PRIORITIES} />
      <Field label="Details" value={f.description} onChangeText={(description) => setF({ ...f, description })} multiline error={err} />
    </Sheet>
  );
}

export function AnnouncementSheet({ visible, onClose }: SheetProps) {
  const { actions } = useStore();
  const { user } = useMe();
  const toast = useToast();
  const [f, setF] = useState({ title: '', body: '', audience: 'all' as 'all' | 'team' | 'client' });
  const [err, setErr] = useState<string>();
  useResetOnOpen(visible, () => {
    setF({ title: '', body: '', audience: 'all' });
    setErr(undefined);
  });
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Announcement"
      title="Post an announcement"
      footer={
        <Button
          label="Publish"
          full
          onPress={() => {
            if (!f.title.trim() || !f.body.trim()) return setErr('Add a title and a message.');
            actions.createAnnouncement({ ...f, title: f.title.trim(), body: f.body.trim(), authorId: user.id });
            toast('Announcement published');
            onClose();
          }}
        />
      }
    >
      <Field label="Title" value={f.title} onChangeText={(title) => setF({ ...f, title })} />
      <OptionGroup
        label="Audience"
        value={f.audience}
        onChange={(audience) => setF({ ...f, audience })}
        options={[
          { value: 'all', label: 'Everyone' },
          { value: 'team', label: 'Team' },
          { value: 'client', label: 'Clients' },
        ]}
      />
      <Field label="Message" value={f.body} onChangeText={(body) => setF({ ...f, body })} multiline error={err} />
    </Sheet>
  );
}

export function milestoneLabel(state: ReturnType<typeof useStore>['state'], id?: string) {
  return findMilestone(state, id)?.title ?? '';
}
