import { useState } from 'react';
import { SquareCheckBig } from 'lucide-react-native';
import { BrandHeader, EmptyState, Gutter, Screen, ScreenHeader, SectionHeader } from '@/components/Layout';
import { FilterChips, type Option } from '@/components/Chips';
import { Reveal } from '@/components/Motion';
import { TaskCard } from './cards';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { TASK_ORDER } from '@/lib/selectors';
import type { TaskStatus } from '@/data/types';

type Filter = 'open' | TaskStatus | 'all';

/** "My tasks" for the team (tab) and "All tasks" for admins (pushed screen). */
export function TaskListScreen({ scope, initial }: { scope: 'mine' | 'all'; initial?: Filter }) {
  const { state } = useStore();
  const { user } = useMe();
  const [filter, setFilter] = useState<Filter>(initial ?? 'open');
  const base = scope === 'mine' ? state.tasks.filter((t) => t.assigneeId === user.id) : state.tasks;
  const match = (f: Filter, s: TaskStatus) => f === 'all' || (f === 'open' ? s !== 'done' && s !== 'cancelled' : s === f);
  const list = base
    .filter((t) => match(filter, t.status))
    .sort((a, b) => TASK_ORDER[a.status] - TASK_ORDER[b.status] || (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'));
  const options: Option<Filter>[] = (
    [
      ['open', 'Open'],
      ['changes_requested', 'Changes'],
      ['in_progress', 'In progress'],
      ['todo', 'To do'],
      ['in_review', 'In review'],
      ['blocked', 'Blocked'],
      ['done', 'Verified'],
      ['all', 'All'],
    ] as [Filter, string][]
  ).map(([value, label]) => ({ value, label, count: base.filter((t) => match(value, t.status)).length }));

  return (
    <Screen header={scope === 'mine' ? <BrandHeader /> : <ScreenHeader title="All tasks" eyebrow="Admin" />} tabBar={scope === 'mine'}>
      <SectionHeader
        label={scope === 'mine' ? 'My tasks' : 'Across projects'}
        title={scope === 'mine' ? 'Your work,' : 'Every task,'}
        accent={scope === 'mine' ? 'in order.' : 'one list.'}
        style={{ paddingTop: 28 }}
      />
      <FilterChips options={options} value={filter} onChange={setFilter} style={{ marginTop: 20 }} />
      <Gutter style={{ marginTop: 16, gap: 12 }}>
        {list.map((t, i) => (
          <Reveal key={t.id} delay={Math.min(i, 6) * 50}>
            <TaskCard task={t} />
          </Reveal>
        ))}
        {!list.length ? <EmptyState icon={SquareCheckBig} title="Nothing here" body="Tasks with this status will show up here." /> : null}
      </Gutter>
    </Screen>
  );
}
