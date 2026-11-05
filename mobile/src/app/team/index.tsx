import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Send, Upload } from 'lucide-react-native';
import { BrandHeader, Gutter, Screen, SectionHeader } from '@/components/Layout';
import { Hero } from '@/components/Hero';
import { Leadership } from '@/components/Leadership';
import { Card } from '@/components/Surface';
import { DemoBadge } from '@/components/Chips';
import { IconButton } from '@/components/Button';
import { Field } from '@/components/Form';
import { Reveal } from '@/components/Motion';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { MessageBubble, TaskCard } from '@/features/cards';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { useColors } from '@/theme/ThemeProvider';
import { TASK_ORDER, projectsForUser } from '@/lib/selectors';
import { daysFromToday, dueLabel, fmtDate, greeting, pad2 } from '@/lib/format';

export default function TeamHome() {
  const c = useColors();
  const { state, actions } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const [msg, setMsg] = useState('');
  const mine = state.tasks
    .filter((t) => t.assigneeId === user.id && t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => TASK_ORDER[a.status] - TASK_ORDER[b.status] || (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'));
  const dueWeek = mine.filter((t) => t.dueDate && daysFromToday(t.dueDate) <= 7);
  const next = [...mine].filter((t) => t.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0];
  const focus = mine.find((t) => t.status === 'changes_requested' || t.status === 'in_progress') ?? mine[0];
  const projects = projectsForUser(state, user.id, role);
  const thread = projects.find((p) => p.status === 'active') ?? projects[0];
  const messages = state.messages.filter((m) => m.projectId === thread?.id).slice(-2);
  const announcement = state.announcements.find((a) => a.audience !== 'client');

  return (
    <Screen header={<BrandHeader />} tabBar>
      <Hero
        eyebrow={`Team workspace · ${greeting()}, ${user.name.split(' ')[0]}`}
        primary={focus ? { label: 'Upload work', icon: Upload, onPress: () => router.push({ pathname: '/task/[id]', params: { id: focus.id, open: 'submit' } }) } : undefined}
        secondary={focus ? { label: 'Report blocker', onPress: () => router.push({ pathname: '/task/[id]', params: { id: focus.id, open: 'blocker' } }) } : undefined}
        status={`${projects.filter((p) => p.status === 'active').length} projects assigned`}
        glow="blue"
      />

      <View style={{ marginTop: 36 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
          <SectionHeader index="01" label="Your week" style={{ flex: 1 }} />
          <DemoBadge />
        </View>
        <Gutter style={{ marginTop: 18 }}>
          <Reveal>
            <Card glass brackets padding={20} onPress={() => router.push('/team/tasks')} accessibilityLabel={`${dueWeek.length} tasks due this week`}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                <View>
                  <Txt variant="mono" tone="muted">
                    Due this week
                  </Txt>
                  <Txt variant="amount" style={{ marginTop: 10, fontSize: 48, lineHeight: 48 }}>
                    {pad2(dueWeek.length)}
                    <Txt variant="body" tone="muted">
                      {'  tasks'}
                    </Txt>
                  </Txt>
                </View>
                {next ? (
                  <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
                    <Txt variant="monoSm" tone="faint">
                      Next deadline
                    </Txt>
                    <Txt variant="body" weight="semibold" tone="gold" style={{ marginTop: 6 }}>
                      {dueLabel(next.dueDate).text}
                    </Txt>
                    <Txt variant="caption" tone="muted" numberOfLines={1}>
                      {next.title}
                    </Txt>
                  </View>
                ) : null}
              </View>
              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row' }}>
                {[
                  ['In progress', mine.filter((t) => t.status === 'in_progress').length, 'fg'],
                  ['In review', mine.filter((t) => t.status === 'in_review').length, 'fg'],
                  ['Changes asked', mine.filter((t) => t.status === 'changes_requested').length, 'gold'],
                ].map(([label, n, tone]) => (
                  <View key={label as string} style={{ flex: 1 }}>
                    <Txt variant="h3" tone={tone as 'fg' | 'gold'}>
                      {String(n)}
                    </Txt>
                    <Txt variant="monoSm" tone="faint" style={{ marginTop: 4 }}>
                      {label as string}
                    </Txt>
                  </View>
                ))}
              </View>
            </Card>
          </Reveal>
        </Gutter>
      </View>

      <SectionHeader index="02" label="My tasks" title="Up next," accent="in order." action={{ label: 'All tasks', onPress: () => router.push('/team/tasks') }} style={{ marginTop: 44 }} />
      <Gutter style={{ marginTop: 18, gap: 12 }}>
        {mine.slice(0, 3).map((t, i) => (
          <Reveal key={t.id} delay={i * 70}>
            <TaskCard task={t} />
          </Reveal>
        ))}
      </Gutter>

      {thread ? (
        <>
          <SectionHeader index="03" label="Team thread" action={{ label: 'Open', onPress: () => router.push(`/thread/${thread.id}`) }} style={{ marginTop: 44 }} />
          <Gutter style={{ marginTop: 18 }}>
            <Card>
              <Txt variant="monoSm" tone="faint">
                {thread.name}
              </Txt>
              <View style={{ gap: 14, marginTop: 14 }}>
                {messages.map((m) => (
                  <MessageBubble key={m.id} authorId={m.authorId} body={m.body} createdAt={m.createdAt} mine={m.authorId === user.id} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 18, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Field label="Message the team" value={msg} onChangeText={setMsg} placeholder="Write a message…" />
                </View>
                <IconButton
                  icon={Send}
                  label="Send message"
                  tone="gold"
                  size={50}
                  onPress={() => {
                    if (!msg.trim()) return;
                    actions.sendMessage(thread.id, user.id, msg.trim());
                    setMsg('');
                    toast('Message sent');
                  }}
                />
              </View>
            </Card>
          </Gutter>
        </>
      ) : null}

      {announcement ? (
        <>
          <SectionHeader index="04" label="Announcement" style={{ marginTop: 44 }} />
          <Gutter style={{ marginTop: 18 }}>
            <Card>
              <Txt variant="monoSm" tone="faint">
                {fmtDate(announcement.publishedAt)}
              </Txt>
              <Txt variant="title" style={{ marginTop: 8 }}>
                {announcement.title}
              </Txt>
              <Txt variant="bodySm" tone="muted" style={{ marginTop: 6 }}>
                {announcement.body}
              </Txt>
            </Card>
          </Gutter>
        </>
      ) : null}

      <View style={{ marginTop: 48 }}>
        <Leadership index={announcement ? '05' : '04'} />
      </View>
    </Screen>
  );
}
