import { FolderKanban, House, MessageCircle, SquareCheckBig, User } from 'lucide-react-native';
import { RoleTabs } from '@/components/RoleTabs';
import { DEMO_ACCOUNTS } from '@/data/demo';
import { useStore } from '@/store/DemoStore';

export default function TeamLayout() {
  const { state } = useStore();
  const attention = state.tasks.filter(
    (t) => t.assigneeId === DEMO_ACCOUNTS.team && (t.status === 'changes_requested' || t.status === 'blocked')
  ).length;
  return (
    <RoleTabs
      role="team"
      order={['index', 'tasks', 'projects', 'inbox', 'profile']}
      meta={{
        index: { label: 'Home', icon: House },
        tasks: { label: 'My tasks', icon: SquareCheckBig, badge: attention || undefined },
        projects: { label: 'Projects', icon: FolderKanban },
        inbox: { label: 'Inbox', icon: MessageCircle },
        profile: { label: 'Profile', icon: User },
      }}
    />
  );
}
