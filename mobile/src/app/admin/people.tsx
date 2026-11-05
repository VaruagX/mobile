import { useState } from 'react';
import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { Avatar, BrandHeader, EmptyState, Gutter, ListRow, Screen, SectionHeader, cardListStyle } from '@/components/Layout';
import { FilterChips, Segmented, StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Field } from '@/components/Form';
import { NewClientSheet, NewMemberSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';

type Tab = 'clients' | 'team';
type Status = 'all' | 'active' | 'suspended';

export default function People() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('clients');
  const [status, setStatus] = useState<Status>('all');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const query = q.trim().toLowerCase();

  const clients = state.clients
    .filter((cl) => status === 'all' || cl.status === status)
    .filter((cl) => !query || `${cl.company} ${cl.contactName} ${cl.email}`.toLowerCase().includes(query));
  const team = state.users
    .filter((u) => u.role !== 'client')
    .filter((u) => status === 'all' || u.status === status)
    .filter((u) => !query || `${u.name} ${u.email} ${u.jobTitle}`.toLowerCase().includes(query));

  return (
    <Screen header={<BrandHeader />} tabBar>
      <SectionHeader label="People" title="Clients and" accent="the team." style={{ paddingTop: 28 }} />
      <Gutter style={{ marginTop: 18, gap: 16 }}>
        <Segmented
          value={tab}
          onChange={(v) => {
            setTab(v);
            setStatus('all');
          }}
          options={[
            { value: 'clients', label: 'Clients', count: state.clients.length },
            { value: 'team', label: 'Team', count: state.users.filter((u) => u.role !== 'client').length },
          ]}
        />
        <Button label={tab === 'clients' ? 'Add client' : 'Add team member'} icon={Plus} onPress={() => setAdding(true)} />
        <Field label="Search" value={q} onChangeText={setQ} placeholder={tab === 'clients' ? 'Company, contact or email' : 'Name, email or role'} autoCapitalize="none" />
      </Gutter>
      <FilterChips
        style={{ marginTop: 16 }}
        value={status}
        onChange={setStatus}
        options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspended' },
        ]}
      />
      <Gutter style={{ marginTop: 16 }}>
        {tab === 'clients' ? (
          clients.length ? (
            <Card style={cardListStyle}>
              {clients.map((cl, i) => {
                const projects = state.projects.filter((p) => p.clientId === cl.id);
                return (
                  <ListRow
                    key={cl.id}
                    leading={<Avatar name={cl.company} size={40} />}
                    title={cl.company}
                    subtitle={`${cl.contactName} · ${cl.city} · ${projects.length} project${projects.length === 1 ? '' : 's'}`}
                    right={<StatusChip status={cl.status} />}
                    onPress={() => router.push(`/clients/${cl.id}`)}
                    last={i === clients.length - 1}
                  />
                );
              })}
            </Card>
          ) : (
            <EmptyState icon={Search} title="No clients found" />
          )
        ) : team.length ? (
          <Card style={cardListStyle}>
            {team.map((u, i) => {
              const open = state.tasks.filter((t) => t.assigneeId === u.id && t.status !== 'done' && t.status !== 'cancelled').length;
              return (
                <ListRow
                  key={u.id}
                  leading={<Avatar name={u.name} size={40} tone={u.role === 'admin' ? 'gold' : 'blue'} />}
                  title={u.name}
                  subtitle={`${u.role === 'admin' ? 'Admin' : u.jobTitle} · ${open} open task${open === 1 ? '' : 's'}`}
                  right={<StatusChip status={u.status} />}
                  onPress={() => router.push(`/members/${u.id}`)}
                  last={i === team.length - 1}
                />
              );
            })}
          </Card>
        ) : (
          <EmptyState icon={Search} title="No one found" />
        )}
      </Gutter>
      <NewClientSheet visible={adding && tab === 'clients'} onClose={() => setAdding(false)} />
      <NewMemberSheet visible={adding && tab === 'team'} onClose={() => setAdding(false)} />
    </Screen>
  );
}
