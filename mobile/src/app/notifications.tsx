import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Bell, CheckCheck, FolderKanban, LifeBuoy, MessageCircle, Receipt, SquareCheckBig } from 'lucide-react-native';
import { EmptyState, Gutter, ListRow, Screen, ScreenHeader, SectionHeader, cardListStyle } from '@/components/Layout';
import { FilterChips } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { IconButton } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { useColors } from '@/theme/ThemeProvider';
import { daysFromToday, relativeTime } from '@/lib/format';
import type { AppNotification } from '@/data/types';

const ICON = { task: SquareCheckBig, project: FolderKanban, billing: Receipt, support: LifeBuoy, team: MessageCircle };
type Filter = 'all' | 'unread';

export default function Notifications() {
  const c = useColors();
  const { state, actions } = useStore();
  const { user } = useMe();
  const [filter, setFilter] = useState<Filter>('all');
  const mine = state.notifications
    .filter((n) => n.userId === user.id)
    .filter((n) => filter === 'all' || !n.read)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const today = mine.filter((n) => daysFromToday(n.createdAt) === 0);
  const earlier = mine.filter((n) => daysFromToday(n.createdAt) !== 0);
  const open = (n: AppNotification) => {
    actions.markRead(n.id);
    if (n.href) router.push(n.href as never);
  };
  const group = (title: string, items: AppNotification[]) =>
    items.length ? (
      <>
        <SectionHeader label={title} style={{ marginTop: 26 }} />
        <Gutter style={{ marginTop: 12 }}>
          <Card style={cardListStyle}>
            {items.map((n, i) => (
              <ListRow
                key={n.id}
                icon={ICON[n.kind]}
                iconTone={n.read ? 'neutral' : 'gold'}
                title={n.title}
                subtitle={n.body}
                right={
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Txt variant="caption" tone="faint">
                      {relativeTime(n.createdAt)}
                    </Txt>
                    {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.gold }} /> : null}
                  </View>
                }
                onPress={() => open(n)}
                last={i === items.length - 1}
              />
            ))}
          </Card>
        </Gutter>
      </>
    ) : null;

  return (
    <Screen
      header={
        <ScreenHeader
          title="Notifications"
          eyebrow={unread ? `${unread} unread` : 'All caught up'}
          right={unread ? <IconButton icon={CheckCheck} label="Mark all as read" onPress={() => actions.markAllRead(user.id)} /> : undefined}
        />
      }
    >
      <FilterChips
        style={{ marginTop: 20 }}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread', count: unread },
        ]}
      />
      {group('Today', today)}
      {group('Earlier', earlier)}
      {!mine.length ? <EmptyState icon={Bell} title="No notifications" body="Task, project, billing and support updates appear here." /> : null}
    </Screen>
  );
}
