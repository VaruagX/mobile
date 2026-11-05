import { Redirect } from 'expo-router';
import { HOME_ROUTE, useSession } from '@/store/Session';

/** Entry: signed-in users go to their workspace, everyone else to the public home. */
export default function Index() {
  const { ready, role } = useSession();
  if (!ready) return null;
  return <Redirect href={role ? HOME_ROUTE[role] : '/welcome'} />;
}
