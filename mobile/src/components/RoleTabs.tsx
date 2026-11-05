import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import type { Role } from '@/data/types';
import { useColors } from '@/theme/ThemeProvider';
import { HOME_ROUTE, useSession } from '@/store/Session';
import { FloatingTabBar, type TabMeta } from './TabBar';

/** Tab navigator for one role workspace. Other roles are redirected to their own home. */
export function RoleTabs({ role, meta, order }: { role: Role; meta: TabMeta; order: string[] }) {
  const c = useColors();
  const session = useSession();
  if (!session.ready) return null;
  if (!session.role) return <Redirect href="/welcome" />;
  if (session.role !== role) return <Redirect href={HOME_ROUTE[session.role]} />;
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} meta={meta} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}
    >
      {order.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ title: meta[name]?.label }} />
      ))}
    </Tabs>
  );
}
