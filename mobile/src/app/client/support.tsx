import { BrandHeader, Screen } from '@/components/Layout';
import { SupportList } from '@/features/shared-screens';

export default function ClientSupport() {
  return (
    <Screen header={<BrandHeader />} tabBar>
      <SupportList />
    </Screen>
  );
}
