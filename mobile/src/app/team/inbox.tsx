import { router } from 'expo-router';
import { Bell, Megaphone } from 'lucide-react-native';
import { Avatar, BrandHeader, Gutter, ListRow, Screen, SectionHeader, cardListStyle } from '@/components/Layout';
import { Card } from '@/components/Surface';
import { Chip } from '@/components/Chips';
import { Txt } from '@/components/Txt';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { findUser, projectsForUser } from '@/lib/selectors';
import { fmtDate, relativeTime } from '@/lib/format';

/** Team communication: one thread per assigned project, plus studio announcements. */
export default function Inbox() {
  const { state } = useStore();
  const { user, role } = useMe();
  const projects = projectsForUser(state, user.id, role);
  const threads = projects
    .map((p) => {
      const msgs = state.messages.filter((m) => m.projectId === p.id);
      return { project: p, last: msgs[msgs.length - 1], count: msgs.length };
    })
    .sort((a, b) => (b.last?.createdAt ?? '').localeCompare(a.last?.createdAt ?? ''));
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const announcements = state.announcements.filter((a) => a.audience !== 'client');

  return (
    <Screen header={<BrandHeader />} tabBar>
      <SectionHeader label="Inbox" title="Talk to" accent="the team." style={{ paddingTop: 28 }} />
      <Gutter style={{ marginTop: 18 }}>
        <Card style={cardListStyle}>
          <ListRow icon={Bell} iconTone="gold" title="Notifications" subtitle={unread ? `${unread} unread` : 'You are all caught up'} onPress={() => router.push('/notifications')} last />
        </Card>
      </Gutter>

      <SectionHeader label="Project threads" style={{ marginTop: 32 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card style={cardListStyle}>
          {threads.map(({ project, last }, i) => {
            const author = findUser(state, last?.authorId);
            return (
              <ListRow
                key={project.id}
                leading={<Avatar name={project.name} size={42} tone={project.status === 'active' ? 'gold' : 'neutral'} />}
                title={project.name}
                subtitle={last ? `${author?.id === user.id ? 'You' : author?.name.split(' ')[0]}: ${last.body}` : 'No messages yet'}
                right={last ? <Txt variant="caption" tone="faint">{relativeTime(last.createdAt)}</Txt> : undefined}
                onPress={() => router.push(`/thread/${project.id}`)}
                last={i === threads.length - 1}
              />
            );
          })}
        </Card>
      </Gutter>

      <SectionHeader label="Announcements" style={{ marginTop: 32 }} />
      <Gutter style={{ marginTop: 14, gap: 12 }}>
        {announcements.map((a) => (
          <Card key={a.id}>
            <Chip label={`${fmtDate(a.publishedAt)} · ${a.audience === 'all' ? 'Everyone' : 'Team'}`} icon={Megaphone} />
            <Txt variant="title" style={{ marginTop: 10 }}>
              {a.title}
            </Txt>
            <Txt variant="bodySm" tone="muted" style={{ marginTop: 6 }}>
              {a.body}
            </Txt>
          </Card>
        ))}
      </Gutter>
    </Screen>
  );
}
