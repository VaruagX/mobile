import { Ellipsis, FolderKanban, House, Users, Wallet } from 'lucide-react-native';
import { RoleTabs } from '@/components/RoleTabs';
import { useStore } from '@/store/DemoStore';

export default function AdminLayout() {
  const { state } = useStore();
  const toVerify = state.payments.filter((p) => p.status === 'pending').length;
  return (
    <RoleTabs
      role="admin"
      order={['index', 'projects', 'finance', 'people', 'more']}
      meta={{
        index: { label: 'Home', icon: House },
        projects: { label: 'Projects', icon: FolderKanban },
        finance: { label: 'Finance', icon: Wallet, badge: toVerify || undefined },
        people: { label: 'People', icon: Users },
        more: { label: 'More', icon: Ellipsis },
      }}
    />
  );
}
