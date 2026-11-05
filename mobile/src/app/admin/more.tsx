import { router } from 'expo-router';
import { Bell, ChartColumn, LifeBuoy, LogOut, Megaphone, Settings, SquareCheckBig } from 'lucide-react-native';
import { View } from 'react-native';
import { Avatar, BrandHeader, Gutter, ListRow, Screen, SectionHeader, cardListStyle } from '@/components/Layout';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { useStore } from '@/store/DemoStore';
import { useMe, useSession } from '@/store/Session';

export default function More() {
  const { state } = useStore();
  const { user } = useMe();
  const { signOut } = useSession();
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const openTickets = state.tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const open = state.tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length;
  return (
    <Screen header={<BrandHeader />} tabBar>
      <Gutter style={{ paddingTop: 28 }}>
        <Card glass brackets padding={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={user.name} size={56} />
            <View style={{ flex: 1 }}>
              <Txt variant="mono" tone="gold">
                Admin
              </Txt>
              <Txt variant="h3" style={{ marginTop: 4 }}>
                {user.name}
              </Txt>
              <Txt variant="bodySm" tone="muted">
                {user.email}
              </Txt>
            </View>
          </View>
        </Card>
      </Gutter>

      <SectionHeader label="Work" style={{ marginTop: 32 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card style={cardListStyle}>
          <ListRow icon={SquareCheckBig} title="All tasks" subtitle={`${open} open across projects`} onPress={() => router.push('/tasks')} />
          <ListRow icon={ChartColumn} title="Reports" subtitle="Revenue, delivery and workload" onPress={() => router.push('/reports')} />
          <ListRow icon={LifeBuoy} title="Support desk" subtitle={`${openTickets} open requests`} onPress={() => router.push('/support-desk')} last />
        </Card>
      </Gutter>

      <SectionHeader label="Communication" style={{ marginTop: 32 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card style={cardListStyle}>
          <ListRow icon={Megaphone} title="Announcements" subtitle="Post to the team or clients" onPress={() => router.push('/announcements')} />
          <ListRow icon={Bell} title="Notifications" subtitle={unread ? `${unread} unread` : 'All read'} onPress={() => router.push('/notifications')} last />
        </Card>
      </Gutter>

      <SectionHeader label="Account" style={{ marginTop: 32 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card style={cardListStyle}>
          <ListRow icon={Settings} title="Settings" subtitle="Theme, notifications, security" onPress={() => router.push('/settings')} last />
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
