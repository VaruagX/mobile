import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LifeBuoy, Send } from 'lucide-react-native';
import { EmptyState, Gutter, Screen, ScreenHeader } from '@/components/Layout';
import { StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button, IconButton } from '@/components/Button';
import { Field, OptionGroup } from '@/components/Form';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { MessageBubble } from '@/features/cards';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { findClient, findProject, findUser } from '@/lib/selectors';
import { fmtDateTime } from '@/lib/format';
import type { TicketStatus } from '@/data/types';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState<'reply' | 'note'>('reply');
  const t = state.tickets.find((x) => x.id === id);
  if (!t || role === 'team' || (role === 'client' && t.clientId !== user.clientId)) {
    return (
      <Screen header={<ScreenHeader title="Request" />}>
        <EmptyState icon={LifeBuoy} title="Request not available" />
      </Screen>
    );
  }
  const visible = t.messages.filter((m) => role !== 'client' || !m.internal);
  const closed = t.status === 'resolved' || t.status === 'closed';
  const send = () => {
    if (!reply.trim()) return;
    actions.replyTicket(t.id, user.id, reply.trim(), role === 'admin' && internal === 'note');
    if (role === 'client' && t.status === 'waiting_on_client') actions.setTicketStatus(t.id, 'in_progress');
    setReply('');
    toast(internal === 'note' && role === 'admin' ? 'Internal note added' : 'Reply sent');
  };

  return (
    <Screen
      header={<ScreenHeader title={t.subject} eyebrow={t.number} />}
      footer={
        closed && role === 'client' ? (
          <Button label="Reopen request" variant="ghost" full onPress={() => { actions.setTicketStatus(t.id, 'open'); toast('Request reopened'); }} />
        ) : (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Field label={role === 'admin' && internal === 'note' ? 'Internal note (team only)' : 'Reply'} value={reply} onChangeText={setReply} placeholder="Write a message…" />
            </View>
            <IconButton icon={Send} label="Send" tone="gold" size={50} onPress={send} />
          </View>
        )
      }
    >
      <Gutter style={{ paddingTop: 20, gap: 14 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="monoSm" tone="faint">
              {[role === 'admin' ? findClient(state, t.clientId)?.company : null, findProject(state, t.projectId)?.name].filter(Boolean).join(' · ') || 'General'}
            </Txt>
            <StatusChip status={t.status} />
          </View>
          <Txt variant="bodySm" tone="muted" style={{ marginTop: 8 }}>
            {`Opened ${fmtDateTime(t.createdAt)} · ${t.priority} priority${t.assignedTo ? ` · ${findUser(state, t.assignedTo)?.name}` : ''}`}
          </Txt>
          {role === 'client' && !closed ? (
            <Button label="Mark as resolved" variant="quiet" size="sm" style={{ marginTop: 10 }} onPress={() => { actions.setTicketStatus(t.id, 'resolved'); toast('Thanks! Marked as resolved.'); }} />
          ) : null}
        </Card>
        {role === 'admin' ? (
          <Card style={{ gap: 16 }}>
            <OptionGroup
              label="Status"
              value={t.status}
              onChange={(s: TicketStatus) => {
                actions.setTicketStatus(t.id, s);
                toast('Status updated');
              }}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'waiting_on_client', label: 'Waiting' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            <OptionGroup
              label="Assigned to"
              value={t.assignedTo ?? ''}
              onChange={(uid: string) => {
                actions.assignTicket(t.id, uid);
                toast('Assigned');
              }}
              options={state.users.filter((u) => u.role !== 'client' && u.status === 'active').map((u) => ({ value: u.id, label: u.name.split(' ')[0] }))}
            />
            <OptionGroup
              label="Composer"
              value={internal}
              onChange={setInternal}
              options={[
                { value: 'reply', label: 'Reply to client' },
                { value: 'note', label: 'Internal note' },
              ]}
            />
          </Card>
        ) : null}
        <View style={{ gap: 14, marginTop: 6 }}>
          {visible.map((m) => (
            <MessageBubble key={m.id} authorId={m.authorId} body={m.body} createdAt={m.createdAt} mine={m.authorId === user.id} internal={m.internal} />
          ))}
        </View>
      </Gutter>
    </Screen>
  );
}
