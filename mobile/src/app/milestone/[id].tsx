import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Flag, Plus } from 'lucide-react-native';
import { EmptyState, Gutter, KeyValue, Screen, ScreenHeader, SectionHeader } from '@/components/Layout';
import { StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { OptionGroup } from '@/components/Form';
import { ProgressBar } from '@/components/Progress';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { TaskCard } from '@/features/cards';
import { NewTaskSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { findProject, milestoneProgress, tasksOfMilestone, TASK_ORDER } from '@/lib/selectors';
import { dueLabel, fmtDate } from '@/lib/format';
import type { MilestoneStatus } from '@/data/types';

export default function MilestoneDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useStore();
  const { role } = useMe();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const m = state.milestones.find((x) => x.id === id);
  if (!m || role === 'client') {
    return (
      <Screen header={<ScreenHeader title="Milestone" />}>
        <EmptyState icon={Flag} title="Milestone not available" />
      </Screen>
    );
  }
  const project = findProject(state, m.projectId);
  const mp = milestoneProgress(state, m.id);
  const tasks = tasksOfMilestone(state, m.id).sort((a, b) => TASK_ORDER[a.status] - TASK_ORDER[b.status]);
  const due = dueLabel(m.dueDate, mp.percent === 100);

  return (
    <Screen header={<ScreenHeader title={m.title} eyebrow={project?.name} />}>
      <Gutter style={{ paddingTop: 24, gap: 14 }}>
        <Card glass brackets padding={22}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="mono" tone="muted">{`Milestone ${m.order} · Weight ${m.weight}`}</Txt>
            <StatusChip status={mp.percent === 100 ? 'completed' : m.status} />
          </View>
          <Txt variant="amount" tone="gold" style={{ marginTop: 12 }}>{`${Math.round(mp.percent)}%`}</Txt>
          <View style={{ marginTop: 14 }}>
            <ProgressBar value={mp.percent} label={`${m.title} progress`} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <KeyValue label="Verified" value={`${mp.doneCount} of ${mp.taskCount}`} />
            <KeyValue label="Start" value={fmtDate(m.startDate)} />
            <KeyValue label="Due" value={due.text} tone={due.tone === 'danger' ? 'danger' : 'fg'} />
          </View>
          {m.description ? (
            <Txt variant="bodySm" tone="muted" style={{ marginTop: 16 }}>
              {m.description}
            </Txt>
          ) : null}
        </Card>
        <Txt variant="caption" tone="faint">
          Milestone progress = weight of verified tasks ÷ weight of all active tasks in this milestone.
        </Txt>
        {role === 'admin' ? (
          <Card>
            <OptionGroup
              label="Status"
              value={m.status}
              onChange={(status: MilestoneStatus) => {
                actions.updateMilestone(m.id, { status });
                toast('Milestone status updated');
              }}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'on_hold', label: 'On hold' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </Card>
        ) : null}
      </Gutter>

      <SectionHeader label={`Tasks · ${tasks.length}`} style={{ marginTop: 30 }} action={project ? { label: 'Project', onPress: () => router.push(`/project/${project.id}`) } : undefined} />
      <Gutter style={{ marginTop: 14, gap: 12 }}>
        {role === 'admin' ? <Button label="Add task" icon={Plus} onPress={() => setAdding(true)} /> : null}
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} showProject={false} />
        ))}
        {!tasks.length ? <EmptyState icon={Flag} title="No tasks yet" body="Progress starts once tasks are added and verified." /> : null}
      </Gutter>
      {project ? <NewTaskSheet visible={adding} onClose={() => setAdding(false)} projectId={project.id} milestoneId={m.id} /> : null}
    </Screen>
  );
}
