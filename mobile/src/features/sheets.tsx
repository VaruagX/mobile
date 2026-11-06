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

export { NewProjectSheet } from './new-project';
export { NewMilestoneSheet, NewTaskSheet } from './planning-sheets';
export { NewExpenseSheet, NewInvoiceSheet, RecordPaymentSheet } from './finance-sheets';

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
