import { Megaphone } from 'lucide-react-native';
import { EmptyState, Gutter, Screen, ScreenHeader, SectionHeader } from '@/components/Layout';
import { Reveal } from '@/components/Motion';
import { UpdateCard } from '@/features/cards';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { projectsForUser } from '@/lib/selectors';

/** Approved (published) updates across the user's projects. */
export default function Updates() {
  const { state } = useStore();
  const { user, role } = useMe();
  const ids = new Set(projectsForUser(state, user.id, role, user.clientId).map((p) => p.id));
  const list = state.updates
    .filter((u) => ids.has(u.projectId) && u.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  return (
    <Screen header={<ScreenHeader title="Project updates" eyebrow="Approved by Varuag Labs" />}>
      <SectionHeader label="Updates" title="What changed," accent="and what's next." style={{ paddingTop: 24 }} />
      <Gutter style={{ marginTop: 20, gap: 12 }}>
        {list.map((u, i) => (
          <Reveal key={u.id} delay={i * 60}>
            <UpdateCard update={u} showProject />
          </Reveal>
        ))}
        {!list.length ? <EmptyState icon={Megaphone} title="No updates yet" /> : null}
      </Gutter>
    </Screen>
  );
}
