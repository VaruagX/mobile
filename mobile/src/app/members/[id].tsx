import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Mail, Phone, User } from 'lucide-react-native';
import { Avatar, EmptyState, Gutter, KeyValue, ListRow, Screen, ScreenHeader, SectionHeader, cardListStyle } from '@/components/Layout';
import { StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Confirm } from '@/components/Form';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { ProjectCard, TaskCard } from '@/features/cards';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { TASK_ORDER, projectsForUser } from '@/lib/selectors';
import { fmtDate } from '@/lib/format';

export default function MemberDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useStore();
  const { user: me, role } = useMe();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const u = state.users.find((x) => x.id === id);
  if (!u || role !== 'admin' || u.role === 'client') {
    return (
      <Screen header={<ScreenHeader title="Team member" />}>
        <EmptyState icon={User} title="Not available" />
      </Screen>
    );
  }
  const tasks = state.tasks.filter((t) => t.assigneeId === u.id).sort((a, b) => TASK_ORDER[a.status] - TASK_ORDER[b.status]);
  const open = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const projects = projectsForUser(state, u.id, u.role);
  const suspended = u.status !== 'active';

  return (
    <Screen header={<ScreenHeader title={u.name} eyebrow={u.role === 'admin' ? 'Admin' : 'Team'} />}>
      <Gutter style={{ paddingTop: 24, gap: 14 }}>
        <Card glass brackets padding={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={u.name} size={56} tone={u.role === 'admin' ? 'gold' : 'blue'} />
            <View style={{ flex: 1 }}>
              <Txt variant="h3">{u.name}</Txt>
              <Txt variant="bodySm" tone="muted">
                {u.jobTitle}
              </Txt>
            </View>
            <StatusChip status={u.status} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <KeyValue label="Open tasks" value={String(open.length)} />
            <KeyValue label="Verified" value={String(tasks.filter((t) => t.status === 'done').length)} />
            <KeyValue label="Joined" value={fmtDate(u.joinedOn, true)} />
          </View>
        </Card>
        <Card style={cardListStyle}>
          <ListRow icon={Mail} title={u.email} subtitle="Work email" onPress={() => Linking.openURL(`mailto:${u.email}`).catch(() => {})} />
          <ListRow icon={Phone} title={u.phone ?? '—'} subtitle="Phone" last />
        </Card>
      </Gutter>

      <SectionHeader label={`Open tasks · ${open.length}`} style={{ marginTop: 30 }} />
      <Gutter style={{ marginTop: 14, gap: 12 }}>
        {open.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
        {!open.length ? <EmptyState icon={User} title="No open tasks" /> : null}
      </Gutter>

      <SectionHeader label={`Projects · ${projects.length}`} style={{ marginTop: 30 }} />
      <Gutter style={{ marginTop: 14, gap: 12 }}>
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
        {u.id !== me.id ? (
          <Button label={suspended ? 'Reactivate account' : 'Suspend account'} variant={suspended ? 'ghost' : 'danger'} full style={{ marginTop: 18 }} onPress={() => setConfirm(true)} />
        ) : null}
      </Gutter>
      <Confirm
        visible={confirm}
        title={suspended ? 'Reactivate account?' : 'Suspend account?'}
        body={suspended ? `${u.name} can sign in again.` : `${u.name} is signed out and cannot sign in. Their tasks stay assigned.`}
        confirmLabel={suspended ? 'Reactivate' : 'Suspend'}
        danger={!suspended}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          actions.setUserStatus(u.id, suspended ? 'active' : 'suspended');
          toast(suspended ? 'Account reactivated' : 'Account suspended');
          setConfirm(false);
        }}
      />
    </Screen>
  );
}
