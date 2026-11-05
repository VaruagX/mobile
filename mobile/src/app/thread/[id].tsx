import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MessageCircle, Send } from 'lucide-react-native';
import { EmptyState, Screen, ScreenHeader } from '@/components/Layout';
import { IconButton } from '@/components/Button';
import { Field } from '@/components/Form';
import { Txt } from '@/components/Txt';
import { MessageBubble } from '@/features/cards';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { space } from '@/theme/tokens';

/** Internal project thread (admin + team). */
export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useStore();
  const { user, role } = useMe();
  const [text, setText] = useState('');
  const scroll = useRef<{ scrollToEnd: (o?: { animated?: boolean }) => void } | null>(null);
  const project = state.projects.find((p) => p.id === id);
  if (!project || role === 'client') {
    return (
      <Screen header={<ScreenHeader title="Thread" />}>
        <EmptyState icon={MessageCircle} title="Thread not available" />
      </Screen>
    );
  }
  const messages = state.messages.filter((m) => m.projectId === project.id);
  const send = () => {
    if (!text.trim()) return;
    actions.sendMessage(project.id, user.id, text.trim());
    setText('');
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };
  return (
    <Screen
      scroll={false}
      header={<ScreenHeader title={project.name} eyebrow="Team thread · internal" />}
      footer={
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Field label="Message" value={text} onChangeText={setText} placeholder="Message the team…" />
          </View>
          <IconButton icon={Send} label="Send" tone="gold" size={50} onPress={send} />
        </View>
      }
    >
      <ScrollView ref={scroll as never} contentContainerStyle={{ padding: space.gutter, gap: 16 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <Txt variant="caption" tone="faint" align="center">
          Only Varuag Labs admins and the project team can see this thread.
        </Txt>
        {messages.map((m) => (
          <MessageBubble key={m.id} authorId={m.authorId} body={m.body} createdAt={m.createdAt} mine={m.authorId === user.id} />
        ))}
        {!messages.length ? <EmptyState icon={MessageCircle} title="No messages yet" body="Start the conversation." /> : null}
      </ScrollView>
    </Screen>
  );
}
