import { useState } from 'react';
import { Megaphone, Plus } from 'lucide-react-native';
import { Gutter, Screen, ScreenHeader } from '@/components/Layout';
import { Chip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { AnnouncementSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { fmtDate } from '@/lib/format';

export default function Announcements() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <Screen header={<ScreenHeader title="Announcements" eyebrow="Admin" />}>
      <Gutter style={{ paddingTop: 20, gap: 12 }}>
        <Button label="New announcement" icon={Plus} onPress={() => setOpen(true)} />
        {state.announcements.map((a) => (
          <Card key={a.id}>
            <Chip label={`${fmtDate(a.publishedAt)} · ${a.audience === 'all' ? 'Everyone' : a.audience === 'team' ? 'Team' : 'Clients'}`} icon={Megaphone} />
            <Txt variant="title" style={{ marginTop: 10 }}>
              {a.title}
            </Txt>
            <Txt variant="bodySm" tone="muted" style={{ marginTop: 6 }}>
              {a.body}
            </Txt>
          </Card>
        ))}
      </Gutter>
      <AnnouncementSheet visible={open} onClose={() => setOpen(false)} />
    </Screen>
  );
}
