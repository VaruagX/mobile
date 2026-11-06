import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Flag, ListChecks, Users, X } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Field, Sheet, SwitchRow } from '@/components/Form';
import { Card } from '@/components/Surface';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { useStore } from '@/store/DemoStore';
import type { Priority } from '@/data/types';
import { milestonesOfProject, tasksOfMilestone } from '@/lib/selectors';
import { tap } from '@/lib/haptics';
import { useColors } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { ConfirmDates, EmptyState, PRIORITY_OPTIONS, PickRow, PriorityPicker, SearchBox, Section, WeightNote, isRealDate, num } from './form-parts';

type SheetProps = { visible: boolean; onClose: () => void };

/** Weight field accepts digits and one decimal point only, so zero/negative values can't be typed. */
const cleanWeight = (v: string) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

/* --------------------------------------------------------------- milestone */

const blankMilestone = { title: '', description: '', weight: '10', startDate: '', dueDate: '', clientVisible: true };

export function NewMilestoneSheet({ visible, onClose, projectId }: SheetProps & { projectId: string }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const existing = useMemo(() => milestonesOfProject(state, projectId).reduce((a, m) => a + m.weight, 0), [state, projectId]);
  const [f, setF] = useState(blankMilestone);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setF(blankMilestone);
    setErr({});
    setBusy(false);
    submitted.current = false;
  }, [visible]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => (p[k] ? { ...p, [k]: '' } : p));
  };

  const save = () => {
    if (submitted.current) return;
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'Name the milestone.';
    if (!(num(f.weight) > 0)) e.weight = 'Weight must be more than 0.';
    if (f.startDate && !isRealDate(f.startDate)) e.startDate = 'Pick a valid date.';
    if (f.dueDate && !isRealDate(f.dueDate)) e.dueDate = 'Pick a valid date.';
    else if (f.startDate && f.dueDate && f.dueDate < f.startDate) e.dueDate = 'Due date can’t be before the start date.';
    setErr(e);
    if (Object.keys(e).length) return;
    submitted.current = true;
    setBusy(true);
    try {
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
    } catch {
      submitted.current = false;
      setBusy(false);
      toast('Couldn’t add the milestone. Please try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      icon={Flag}
      title="Create New Milestone"
      subtitle="A phase of the project, with its own weight and dates."
      footer={<Button label="Create milestone" full loading={busy} onPress={save} />}
    >
      <View style={{ gap: 26 }}>
        <Section title="Milestone">
          <Field label="Milestone title" value={f.title} onChangeText={(v) => set('title', v)} placeholder="e.g. Backend development" error={err.title} maxLength={80} />
          <Field label="Description" hint="optional" value={f.description} onChangeText={(v) => set('description', v)} multiline placeholder="What does this phase deliver?" maxLength={500} />
        </Section>

        <Section title="Weight">
          <Field label="Weight" suffix="%" value={f.weight} onChangeText={(v) => set('weight', cleanWeight(v))} keyboardType="numeric" placeholder="e.g. 20" error={err.weight} maxLength={6} />
          <WeightNote existing={existing} adding={num(f.weight)} noun="milestone" />
        </Section>

        <Section title="Timeline" hint="optional">
          <ConfirmDates
            fields={[
              { key: 'startDate', label: 'Start', value: f.startDate, onChange: (v) => set('startDate', v), error: err.startDate, placeholder: 'Pick date', clearable: true },
              { key: 'dueDate', label: 'Due', value: f.dueDate, onChange: (v) => set('dueDate', v), min: f.startDate || undefined, error: err.dueDate, placeholder: 'Pick date', clearable: true },
            ]}
          />
        </Section>

        <Section title="Client visibility">
          <Card padding={0}>
            <SwitchRow
              label={f.clientVisible ? 'Visible to client' : 'Hidden from client'}
              description={f.clientVisible ? 'Clients can see this milestone, its due date and its verified progress.' : 'Only admins and the team can see this milestone.'}
              value={f.clientVisible}
              onValueChange={(v) => set('clientVisible', v)}
            />
          </Card>
        </Section>
      </View>
    </Sheet>
  );
}

/* -------------------------------------------------------------------- task */

const blankTask = { title: '', description: '', weight: '10', priority: 'medium' as Priority, dueDate: '' };

export function NewTaskSheet({ visible, onClose, projectId, milestoneId }: SheetProps & { projectId: string; milestoneId?: string }) {
  const c = useColors();
  const { state, actions } = useStore();
  const toast = useToast();
  const project = state.projects.find((p) => p.id === projectId);
  const milestones = useMemo(() => milestonesOfProject(state, projectId), [state, projectId]);
  const people = useMemo(
    () => state.users.filter((u) => (u.role === 'team' || u.role === 'admin') && u.status === 'active' && (project?.memberIds.includes(u.id) || u.role === 'admin')),
    [state.users, project]
  );
  const defaultAssignee = people.find((p) => p.role === 'team')?.id ?? '';
  const [f, setF] = useState(blankTask);
  const [msId, setMsId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [msQ, setMsQ] = useState('');
  const [personQ, setPersonQ] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setF(blankTask);
    setMsId(milestoneId ?? milestones[0]?.id ?? '');
    setAssigneeId(defaultAssignee);
    setMsQ('');
    setPersonQ('');
    setErr({});
    setBusy(false);
    submitted.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => (p[k] ? { ...p, [k]: '' } : p));
  };

  const existingWeight = useMemo(
    () => tasksOfMilestone(state, msId).filter((t) => t.status !== 'cancelled').reduce((a, t) => a + t.weight, 0),
    [state, msId]
  );
  const shownMs = milestones.filter((m) => m.title.toLowerCase().includes(msQ.trim().toLowerCase()));
  const shownPeople = people.filter((u) => u.name.toLowerCase().includes(personQ.trim().toLowerCase()));
  const assignee = people.find((u) => u.id === assigneeId);

  const save = () => {
    if (submitted.current) return;
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'Describe the task.';
    if (!msId) e.milestone = 'Add a milestone first.';
    if (!(num(f.weight) > 0)) e.weight = 'Weight must be more than 0.';
    if (f.dueDate && !isRealDate(f.dueDate)) e.dueDate = 'Pick a valid date.';
    setErr(e);
    if (Object.keys(e).length) return;
    submitted.current = true;
    setBusy(true);
    try {
      actions.createTask({
        milestoneId: msId,
        title: f.title.trim(),
        assigneeId: assigneeId || undefined,
        weight: num(f.weight),
        priority: f.priority,
        dueDate: f.dueDate || undefined,
        description: f.description.trim() || undefined,
      });
      toast(assigneeId ? 'Task created and assigned' : 'Task created');
      onClose();
    } catch {
      submitted.current = false;
      setBusy(false);
      toast('Couldn’t create the task. Please try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      icon={ListChecks}
      title="Create New Task"
      subtitle={project ? `In ${project.name}` : 'Assign work to a team member.'}
      footer={<Button label="Create task" full loading={busy} onPress={save} />}
    >
      <View style={{ gap: 26 }}>
        <Section title="Task">
          <Field label="Task title" value={f.title} onChangeText={(v) => set('title', v)} placeholder="e.g. Payment confirmation screen" error={err.title} maxLength={100} />
          <Field label="Details" hint="optional" value={f.description} onChangeText={(v) => set('description', v)} multiline placeholder="Acceptance criteria, links, notes" maxLength={500} />
        </Section>

        <Section title="Milestone" hint={milestones.length ? `${milestones.length} in project` : undefined}>
          {milestones.length === 0 ? (
            <EmptyState icon={Flag} text="This project has no milestones yet. Add a milestone first." />
          ) : (
            <>
              <SearchBox value={msQ} onChangeText={setMsQ} placeholder="Search milestones..." />
              <View style={{ gap: 8 }} accessibilityRole="radiogroup">
                {shownMs.length === 0 ? (
                  <EmptyState icon={Flag} text="No milestones found" />
                ) : (
                  shownMs.map((m) => (
                    <PickRow
                      key={m.id}
                      role="radio"
                      label={m.title}
                      sub={`Weight ${m.weight} · ${tasksOfMilestone(state, m.id).length} tasks`}
                      selected={msId === m.id}
                      onPress={() => {
                        setMsId(m.id);
                        setErr((p) => (p.milestone ? { ...p, milestone: '' } : p));
                      }}
                    />
                  ))
                )}
              </View>
            </>
          )}
          {err.milestone ? (
            <Txt variant="caption" tone="danger" accessibilityLiveRegion="polite">
              {err.milestone}
            </Txt>
          ) : null}
        </Section>

        <Section title="Assign to" hint={assignee ? '1 selected' : 'optional'}>
          {people.length === 0 ? (
            <EmptyState icon={Users} text="No active team members on this project." />
          ) : (
            <>
              {assignee ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${assignee.name}`}
                  onPress={() => {
                    tap();
                    setAssigneeId('');
                  }}
                  style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingLeft: 12, paddingRight: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: c.goldBorder, backgroundColor: c.goldTint }}
                >
                  <Txt variant="caption" weight="semibold" tone="gold">
                    {assignee.name}
                  </Txt>
                  <X size={13} color={c.gold} />
                </Pressable>
              ) : null}
              <SearchBox value={personQ} onChangeText={setPersonQ} placeholder="Search team members..." />
              <View style={{ gap: 8 }} accessibilityRole="radiogroup">
                {shownPeople.length === 0 ? (
                  <EmptyState icon={Users} text="No team members found" />
                ) : (
                  shownPeople.map((u) => (
                    <PickRow
                      key={u.id}
                      role="radio"
                      label={u.name}
                      sub={u.jobTitle}
                      selected={assigneeId === u.id}
                      onPress={() => setAssigneeId(assigneeId === u.id ? '' : u.id)}
                    />
                  ))
                )}
              </View>
              <Txt variant="caption" tone="faint">
                A task has one assignee. Tap the selected person again to leave it unassigned.
              </Txt>
            </>
          )}
        </Section>

        <Section title="Weight">
          <Field label="Weight" suffix="%" value={f.weight} onChangeText={(v) => set('weight', cleanWeight(v))} keyboardType="numeric" placeholder="e.g. 25" error={err.weight} maxLength={6} />
          {msId ? <WeightNote existing={existingWeight} adding={num(f.weight)} noun="task" /> : null}
        </Section>

        <Section title="Priority">
          <PriorityPicker value={f.priority} onChange={(v) => set('priority', v)} options={PRIORITY_OPTIONS as unknown as { value: Priority; label: string }[]} />
        </Section>

        <Section title="Due date" hint="optional">
          <ConfirmDates fields={[{ key: 'dueDate', label: 'Due', value: f.dueDate, onChange: (v) => set('dueDate', v), error: err.dueDate, placeholder: 'Pick date', clearable: true }]} />
        </Section>
      </View>
    </Sheet>
  );
}
