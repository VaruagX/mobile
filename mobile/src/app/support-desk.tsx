import { Screen, ScreenHeader } from '@/components/Layout';
import { SupportList } from '@/features/shared-screens';

export default function SupportDesk() {
  return (
    <Screen header={<ScreenHeader title="Support desk" eyebrow="Admin" />}>
      <SupportList desk />
    </Screen>
  );
}
