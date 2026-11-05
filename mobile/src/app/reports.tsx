import { useState } from 'react';
import { View } from 'react-native';
import { ChartColumn } from 'lucide-react-native';
import { EmptyState, Gutter, Screen, ScreenHeader, SectionHeader } from '@/components/Layout';
import { DemoBadge, Segmented } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { BarRow, StatTile } from '@/components/Progress';
import { Txt } from '@/components/Txt';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { financeSummary, projectProgress } from '@/lib/selectors';
import { inr, inrShort, pad2 } from '@/lib/format';

type Tab = 'revenue' | 'delivery' | 'team';

export default function Reports() {
  const { state } = useStore();
  const { role } = useMe();
  const [tab, setTab] = useState<Tab>('revenue');
  if (role !== 'admin') {
    return (
      <Screen header={<ScreenHeader title="Reports" />}>
        <EmptyState icon={ChartColumn} title="Reports are for admins" />
      </Screen>
    );
  }
  const fin = financeSummary(state);
  const byClient = state.clients
    .map((cl) => ({ cl, f: financeSummary(state, cl.id) }))
    .filter((x) => x.f.invoiced > 0)
    .sort((a, b) => b.f.invoiced - a.f.invoiced);
  const maxInv = Math.max(...byClient.map((x) => x.f.invoiced), 1);
  const projects = state.projects.filter((p) => p.status !== 'cancelled');
  const team = state.users.filter((u) => u.role === 'team');
  const load = team.map((u) => ({ u, open: state.tasks.filter((t) => t.assigneeId === u.id && t.status !== 'done' && t.status !== 'cancelled').length, done: state.tasks.filter((t) => t.assigneeId === u.id && t.status === 'done').length }));
  const maxLoad = Math.max(...load.map((l) => l.open), 1);
  const statuses: [string, string][] = [
    ['todo', 'To do'],
    ['in_progress', 'In progress'],
    ['in_review', 'In review'],
    ['changes_requested', 'Changes asked'],
    ['blocked', 'Blocked'],
    ['done', 'Verified'],
  ];
  const maxStatus = Math.max(...statuses.map(([s]) => state.tasks.filter((t) => t.status === s).length), 1);
  const expenses = state.expenses.filter((e) => e.status === 'approved').reduce((a, e) => a + e.amount, 0);

  return (
    <Screen header={<ScreenHeader title="Reports" eyebrow="Admin" right={<DemoBadge compact />} />}>
      <Gutter style={{ paddingTop: 20 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'revenue', label: 'Revenue' },
            { value: 'delivery', label: 'Delivery' },
            { value: 'team', label: 'Team' },
          ]}
        />
      </Gutter>

      {tab === 'revenue' ? (
        <>
          <Gutter style={{ marginTop: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatTile value={inrShort(fin.invoiced)} label="Invoiced" />
              <StatTile value={inrShort(fin.collected)} label="Collected" tone="gold" />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatTile value={inrShort(fin.overdue)} label="Overdue" tone="danger" />
              <StatTile value={inrShort(expenses)} label="Expenses" />
            </View>
          </Gutter>
          <SectionHeader label="Invoiced by client" style={{ marginTop: 30 }} />
          <Gutter style={{ marginTop: 14 }}>
            <Card style={{ gap: 18 }}>
              {byClient.map(({ cl, f }) => (
                <BarRow key={cl.id} label={cl.company} value={f.invoiced} max={maxInv} display={`${inr(f.collected)} / ${inr(f.invoiced)}`} />
              ))}
            </Card>
            <Txt variant="caption" tone="faint" style={{ marginTop: 10 }}>
              Collected counts verified payments only.
            </Txt>
          </Gutter>
        </>
      ) : null}

      {tab === 'delivery' ? (
        <>
          <SectionHeader label="Project progress" style={{ marginTop: 24 }} />
          <Gutter style={{ marginTop: 14 }}>
            <Card style={{ gap: 18 }}>
              {projects.map((p) => {
                const pr = projectProgress(state, p.id);
                return <BarRow key={p.id} label={p.name} value={pr.percent} max={100} display={`${Math.round(pr.percent)}%`} />;
              })}
            </Card>
          </Gutter>
          <SectionHeader label="Tasks by status" style={{ marginTop: 30 }} />
          <Gutter style={{ marginTop: 14 }}>
            <Card style={{ gap: 18 }}>
              {statuses.map(([s, label]) => {
                const n = state.tasks.filter((t) => t.status === s).length;
                return <BarRow key={s} label={label} value={n} max={maxStatus} display={pad2(n)} tone={s === 'blocked' ? 'danger' : s === 'done' ? 'gold' : 'blue'} />;
              })}
            </Card>
          </Gutter>
        </>
      ) : null}

      {tab === 'team' ? (
        <>
          <SectionHeader label="Open tasks per person" style={{ marginTop: 24 }} />
          <Gutter style={{ marginTop: 14 }}>
            <Card style={{ gap: 18 }}>
              {load.map(({ u, open, done }) => (
                <BarRow key={u.id} label={u.name} value={open} max={maxLoad} display={`${open} open · ${done} verified`} tone="blue" />
              ))}
            </Card>
            <Txt variant="caption" tone="faint" style={{ marginTop: 10 }}>
              Use this before assigning new work.
            </Txt>
          </Gutter>
        </>
      ) : null}
    </Screen>
  );
}
