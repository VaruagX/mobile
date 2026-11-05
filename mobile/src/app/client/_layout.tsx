import { FolderKanban, House, LifeBuoy, Receipt, User } from 'lucide-react-native';
import { RoleTabs } from '@/components/RoleTabs';
import { useStore } from '@/store/DemoStore';
import { invoiceBalance } from '@/lib/selectors';

export default function ClientLayout() {
  const { state } = useStore();
  const due = state.invoices.filter((i) => {
    if (i.clientId !== 'c-mehta' || i.status !== 'issued') return false;
    return invoiceBalance(state, i).balance > 0;
  }).length;
  return (
    <RoleTabs
      role="client"
      order={['index', 'projects', 'invoices', 'support', 'profile']}
      meta={{
        index: { label: 'Home', icon: House },
        projects: { label: 'Projects', icon: FolderKanban },
        invoices: { label: 'Invoices', icon: Receipt, badge: due || undefined },
        support: { label: 'Support', icon: LifeBuoy },
        profile: { label: 'Profile', icon: User },
      }}
    />
  );
}
