import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Bell, FolderKanban, LifeBuoy, LogOut, Mail, Megaphone, Phone, Plus, Search, Settings } from 'lucide-react-native';
import { BrandHeader, Avatar, EmptyState, Gutter, ListRow, Screen, SectionHeader, cardListStyle } from '@/components/Layout';
import { FilterChips, StatusChip, type Option } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Field } from '@/components/Form';
import { Serif, Txt } from '@/components/Txt';
import { Reveal } from '@/components/Motion';
import { useStore } from '@/store/DemoStore';
import { useMe, useSession } from '@/store/Session';
import { useColors } from '@/theme/ThemeProvider';
import { projectsForUser, tasksOfProject } from '@/lib/selectors';
import { fmtDate } from '@/lib/format';
import type { ProjectStatus } from '@/data/types';
import { ProjectCard, TicketRow } from './cards';
import { NewProjectSheet, NewTicketSheet } from './sheets';

type ProjectFilter = 'all' | ProjectStatus;

/** Projects tab for every role: admin sees all, team their assigned projects, clients their own. */
export function ProjectsScreen() {
  const { state } = useStore();
  const { user, role } = useMe();
  const [filter, setFilter] = useState<ProjectFilter>(role === 'client' ? 'all' : 'active');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const mine = projectsForUser(state, user.id, role, user.clientId);
  const counts = (s: ProjectFilter) => (s === 'all' ? mine.length : mine.filter((p) => p.status === s).length);
  const options: Option<ProjectFilter>[] = (['active', 'planning', 'on_hold', 'completed', 'all'] as ProjectFilter[])
    .filter((s) => s === 'all' || counts(s) > 0 || role === 'admin')
    .map((s) => ({ value: s, label: s === 'all' ? 'All' : s === 'on_hold' ? 'On hold' : s[0].toUpperCase() + s.slice(1), count: counts(s) }));
  const list = mine
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => !q.trim() || `${p.name} ${state.clients.find((c) => c.id === p.clientId)?.company}`.toLowerCase().includes(q.trim().toLowerCase()));
  const title = role === 'admin' ? 'All projects' : role === 'team' ? 'Assigned to you' : 'Your projects';
  return (
    <Screen header={<BrandHeader />} tabBar>
      <SectionHeader label={role === 'client' ? 'My projects' : 'Projects'} title={title.split(' ').slice(0, -1).join(' ')} accent={title.split(' ').slice(-1)[0] + '.'} style={{ paddingTop: 28 }} />
      {role === 'admin' ? (
        <Gutter style={{ marginTop: 18 }}>
          <Button label="New project" icon={Plus} onPress={() => setCreating(true)} />
        </Gutter>
      ) : null}
      {mine.length > 3 ? (
        <Gutter style={{ marginTop: 18 }}>
          <Field label="Search" value={q} onChangeText={setQ} placeholder="Project or client name" autoCapitalize="none" />
        </Gutter>
      ) : null}
      <FilterChips options={options} value={filter} onChange={setFilter} style={{ marginTop: 18 }} />
      <Gutter style={{ marginTop: 16, gap: 12 }}>
        {list.map((p, i) => (
          <Reveal key={p.id} delay={i * 60}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
        {!list.length ? <EmptyState icon={q ? Search : FolderKanban} title="No projects here" body={q ? 'Try a different search.' : 'Projects with this status will appear here.'} /> : null}
      </Gutter>
      {role === 'admin' ? <NewProjectSheet visible={creating} onClose={() => setCreating(false)} /> : null}
    </Screen>
  );
}

/** Profile tab (team and client) and the admin profile in More. */
export function ProfileScreen() {
  const c = useColors();
  const { state } = useStore();
  const { user, role } = useMe();
  const { signOut } = useSession();
  const client = state.clients.find((cl) => cl.id === user.clientId);
  const myTasks = state.tasks.filter((t) => t.assigneeId === user.id);
  const myProjects = projectsForUser(state, user.id, role, user.clientId);
  const roleLabel = { admin: 'Admin', team: 'Team', client: 'Client' }[role];
  return (
    <Screen header={<BrandHeader />} tabBar>
      <Gutter style={{ paddingTop: 28 }}>
        <Card glass brackets padding={22}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Avatar name={user.name} size={64} />
            <View style={{ flex: 1 }}>
              <Txt variant="mono" tone="gold">
                {`${roleLabel} · ${client?.company ?? user.jobTitle ?? ''}`}
              </Txt>
              <Txt variant="h3" style={{ marginTop: 6 }}>
                {user.name}
              </Txt>
              <Txt variant="bodySm" tone="muted">{`Member since ${fmtDate(user.joinedOn, true)}`}</Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.line }}>
            <View style={{ flex: 1 }}>
              <Txt variant="stat" style={{ fontSize: 26 }}>
                {String(myProjects.length).padStart(2, '0')}
              </Txt>
              <Txt variant="monoSm" tone="faint" style={{ marginTop: 6 }}>
                Projects
              </Txt>
            </View>
            {role === 'team' ? (
              <View style={{ flex: 1 }}>
                <Txt variant="stat" style={{ fontSize: 26 }}>
                  {String(myTasks.filter((t) => t.status === 'done').length).padStart(2, '0')}
                </Txt>
                <Txt variant="monoSm" tone="faint" style={{ marginTop: 6 }}>
                  Tasks verified
                </Txt>
              </View>
            ) : null}
            {role === 'client' ? (
              <View style={{ flex: 1 }}>
                <Txt variant="stat" style={{ fontSize: 26 }}>
                  {String(state.tickets.filter((t) => t.clientId === user.clientId).length).padStart(2, '0')}
                </Txt>
                <Txt variant="monoSm" tone="faint" style={{ marginTop: 6 }}>
                  Requests
                </Txt>
              </View>
            ) : null}
          </View>
        </Card>
      </Gutter>

      <SectionHeader label="Contact" style={{ marginTop: 32 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card style={cardListStyle}>
          <ListRow icon={Mail} title={user.email} subtitle="Sign-in email" />
          <ListRow icon={Phone} title={user.phone ?? 'Not added'} subtitle="Phone" last />
        </Card>
      </Gutter>

      <SectionHeader label="Account" style={{ marginTop: 32 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card style={cardListStyle}>
          <ListRow icon={Bell} title="Notifications" onPress={() => router.push('/notifications')} />
          {role === 'client' ? <ListRow icon={Megaphone} title="Project updates" onPress={() => router.push('/updates')} /> : null}
          <ListRow icon={Settings} title="Settings" subtitle="Theme, notifications, password" onPress={() => router.push('/settings')} last />
        </Card>
        <Button
          label="Sign out"
          icon={LogOut}
          variant="ghost"
          full
          style={{ marginTop: 20 }}
          onPress={() => {
            signOut();
            router.replace('/welcome');
          }}
        />
      </Gutter>
    </Screen>
  );
}

type TicketFilter = 'active' | 'resolved' | 'all';

/** Client support tab and admin support desk. */
export function SupportList({ desk }: { desk?: boolean }) {
  const { state } = useStore();
  const { user, role } = useMe();
  const [filter, setFilter] = useState<TicketFilter>('active');
  const [creating, setCreating] = useState(false);
  const all = useMemo(
    () => (role === 'client' ? state.tickets.filter((t) => t.clientId === user.clientId) : state.tickets),
    [role, state.tickets, user.clientId]
  );
  const isActive = (s: string) => s !== 'resolved' && s !== 'closed';
  const list = all.filter((t) => (filter === 'all' ? true : filter === 'active' ? isActive(t.status) : !isActive(t.status)));
  return (
    <>
      <SectionHeader
        label={desk ? 'Support desk' : 'Support'}
        title={desk ? 'Client requests,' : 'Ask us'}
        accent={desk ? 'in one place.' : 'anything.'}
        style={{ paddingTop: 28 }}
      />
      {role === 'client' ? (
        <Gutter style={{ marginTop: 18 }}>
          <Txt variant="body" tone="muted">
            Changes, questions or problems with your project. Our team replies here and you get a notification.
          </Txt>
          <Button label="New request" icon={Plus} style={{ marginTop: 18 }} onPress={() => setCreating(true)} />
        </Gutter>
      ) : null}
      <FilterChips
        style={{ marginTop: 20 }}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'active', label: 'Open', count: all.filter((t) => isActive(t.status)).length },
          { value: 'resolved', label: 'Resolved', count: all.filter((t) => !isActive(t.status)).length },
          { value: 'all', label: 'All', count: all.length },
        ]}
      />
      <Gutter style={{ marginTop: 16 }}>
        {list.length ? (
          <Card style={cardListStyle}>
            {list.map((t, i) => (
              <TicketRow key={t.id} ticket={t} last={i === list.length - 1} showClient={role !== 'client'} />
            ))}
          </Card>
        ) : (
          <EmptyState icon={LifeBuoy} title="No requests here" body="Open requests and their replies appear here." />
        )}
      </Gutter>
      {role === 'client' ? <NewTicketSheet visible={creating} onClose={() => setCreating(false)} /> : null}
    </>
  );
}

/** Small summary line for a project used in lists. */
export function projectTaskSummary(state: ReturnType<typeof useStore>['state'], projectId: string) {
  const tasks = tasksOfProject(state, projectId);
  return `${tasks.filter((t) => t.status === 'done').length}/${tasks.filter((t) => t.status !== 'cancelled').length} tasks verified`;
}

export { Serif, StatusChip };
