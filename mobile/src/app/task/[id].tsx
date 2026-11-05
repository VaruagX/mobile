import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Clock, Link as LinkIcon, Play, SquareCheckBig, TriangleAlert, Upload } from 'lucide-react-native';
import { Avatar, EmptyState, Gutter, KeyValue, ListRow, Screen, ScreenHeader, SectionHeader, cardListStyle } from '@/components/Layout';
import { Chip, StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { FileRow } from '@/features/cards';
import { BlockerSheet, ReviewSheet, SubmitWorkSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { useColors } from '@/theme/ThemeProvider';
import { findMilestone, findProject, findUser } from '@/lib/selectors';
import { dueLabel, fmtDateTime, relativeTime } from '@/lib/format';

export default function TaskDetail() {
  const c = useColors();
  const { id, open } = useLocalSearchParams<{ id: string; open?: 'submit' | 'blocker' }>();
  const { state, actions } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const [sheet, setSheet] = useState<null | 'submit' | 'blocker' | 'review'>(null);
  useEffect(() => {
    if (open) setSheet(open);
  }, [open]);

  const task = state.tasks.find((t) => t.id === id);
  if (!task || role === 'client') {
    return (
      <Screen header={<ScreenHeader title="Task" />}>
        <EmptyState icon={SquareCheckBig} title="Task not available" />
      </Screen>
    );
  }
  const m = findMilestone(state, task.milestoneId);
  const p = findProject(state, m?.projectId);
  const assignee = findUser(state, task.assigneeId);
  const mine = task.assigneeId === user.id;
  const subs = state.submissions.filter((s) => s.taskId === task.id).sort((a, b) => b.revision - a.revision);
  const latest = subs[0];
  const blockers = state.blockers.filter((b) => b.taskId === task.id);
  const openBlocker = blockers.find((b) => b.status === 'open');
  const due = dueLabel(task.dueDate, task.status === 'done');
  const canWork = mine && ['todo', 'in_progress', 'changes_requested'].includes(task.status);

  const footer =
    role === 'admin' && task.status === 'in_review' ? (
      <Button label="Review submission" full onPress={() => setSheet('review')} />
    ) : mine && task.status === 'todo' ? (
      <Button
        label="Start task"
        icon={Play}
        full
        onPress={() => {
          actions.setTaskStatus(task.id, 'in_progress');
          toast('Task moved to In progress');
        }}
      />
    ) : canWork ? (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Blocker" icon={TriangleAlert} variant="ghost" style={{ flex: 1 }} onPress={() => setSheet('blocker')} />
        <Button label={task.status === 'changes_requested' ? 'Resubmit' : 'Submit work'} icon={Upload} style={{ flex: 1.4 }} onPress={() => setSheet('submit')} />
      </View>
    ) : undefined;

  return (
    <Screen header={<ScreenHeader title={task.title} eyebrow={`${p?.name} / ${m?.title}`} />} footer={footer}>
      <Gutter style={{ paddingTop: 24, gap: 14 }}>
        <Card glass brackets padding={20} highlight={task.status === 'changes_requested'}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <StatusChip status={task.status} />
            <Chip label={`Weight ${task.weight}`} />
          </View>
          <Txt variant="h3" style={{ marginTop: 14 }}>
            {task.title}
          </Txt>
          {task.description ? (
            <Txt variant="body" tone="muted" style={{ marginTop: 8 }}>
              {task.description}
            </Txt>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <KeyValue label="Due" value={due.text} tone={due.tone === 'danger' ? 'danger' : due.tone === 'gold' ? 'gold' : 'fg'} />
            <KeyValue label="Priority" value={task.priority[0].toUpperCase() + task.priority.slice(1)} />
            {task.estimatedHours ? <KeyValue label="Estimate" value={`${task.estimatedHours} h`} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.line }}>
            {assignee ? <Avatar name={assignee.name} size={32} tone="blue" /> : null}
            <Txt variant="bodySm" tone="muted" style={{ flex: 1 }}>
              {assignee ? `Assigned to ${mine ? 'you' : assignee.name}` : 'Unassigned'}
            </Txt>
            {role === 'admin' && assignee ? <Button label="Profile" variant="quiet" size="sm" onPress={() => router.push(`/members/${assignee.id}`)} /> : null}
          </View>
        </Card>

        {task.status === 'done' ? (
          <Card>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <CircleCheck size={22} color={c.success} />
              <View style={{ flex: 1 }}>
                <Txt variant="title">Verified</Txt>
                <Txt variant="bodySm" tone="muted">{`Counts toward progress · ${task.verifiedAt ? fmtDateTime(task.verifiedAt) : ''}`}</Txt>
              </View>
            </View>
          </Card>
        ) : null}
        {task.status === 'in_review' && mine ? (
          <Card>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Clock size={20} color={c.goldText} />
              <Txt variant="bodySm" tone="muted" style={{ flex: 1 }}>
                Submitted. An admin will verify it or ask for changes.
              </Txt>
            </View>
          </Card>
        ) : null}

        {openBlocker ? (
          <Card style={{ borderColor: c.danger }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TriangleAlert size={18} color={c.danger} />
              <Txt variant="mono" tone="danger">
                Blocked
              </Txt>
            </View>
            <Txt variant="body" style={{ marginTop: 10 }}>
              {openBlocker.description}
            </Txt>
            <Txt variant="caption" tone="faint" style={{ marginTop: 6 }}>{`${findUser(state, openBlocker.reportedBy)?.name} · ${relativeTime(openBlocker.createdAt)}`}</Txt>
            {role === 'admin' ? (
              <Button
                label="Mark resolved"
                variant="ghost"
                size="sm"
                style={{ marginTop: 14 }}
                onPress={() => {
                  actions.resolveBlocker(openBlocker.id, 'Resolved by admin');
                  toast('Blocker resolved. Task is back in progress.');
                }}
              />
            ) : null}
          </Card>
        ) : null}
      </Gutter>

      <SectionHeader label={`Submissions · ${subs.length}`} style={{ marginTop: 30 }} />
      <Gutter style={{ marginTop: 14, gap: 12 }}>
        {subs.length ? (
          subs.map((s) => {
            const files = state.files.filter((f) => s.fileIds.includes(f.id));
            return (
              <Card key={s.id} highlight={s.id === latest?.id && s.status === 'pending'}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt variant="monoSm" tone="faint" style={{ flex: 1, marginRight: 10 }}>{`Rev ${s.revision} · ${fmtDateTime(s.createdAt)}`}</Txt>
                  <StatusChip status={s.status === 'pending' ? 'in_review' : s.status} />
                </View>
                <Txt variant="body" style={{ marginTop: 10 }}>
                  {s.notes}
                </Txt>
                {s.links.map((l) => (
                  <View key={l} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
                    <LinkIcon size={14} color={c.goldText} />
                    <Txt variant="bodySm" tone="gold" numberOfLines={1} style={{ flex: 1 }} onPress={() => Linking.openURL(l).catch(() => {})}>
                      {l}
                    </Txt>
                  </View>
                ))}
                {files.length ? (
                  <Card style={[cardListStyle, { marginTop: 12 }]}>
                    {files.map((f, i) => (
                      <FileRow key={f.id} file={f} last={i === files.length - 1} />
                    ))}
                  </Card>
                ) : null}
                {s.reviewNote ? (
                  <View style={{ marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: c.goldTint, borderWidth: 1, borderColor: c.goldBorder }}>
                    <Txt variant="monoSm" tone="gold">
                      Admin review
                    </Txt>
                    <Txt variant="bodySm" style={{ marginTop: 6 }}>
                      {s.reviewNote}
                    </Txt>
                  </View>
                ) : null}
              </Card>
            );
          })
        ) : (
          <EmptyState icon={Upload} title="No work submitted yet" body={mine ? 'When you finish, submit your work with notes, links and files.' : 'Submissions from the assignee appear here.'} />
        )}
      </Gutter>

      {blockers.filter((b) => b.status === 'resolved').length ? (
        <>
          <SectionHeader label="Resolved blockers" style={{ marginTop: 30 }} />
          <Gutter style={{ marginTop: 14 }}>
            <Card style={cardListStyle}>
              {blockers
                .filter((b) => b.status === 'resolved')
                .map((b, i, arr) => (
                  <ListRow key={b.id} icon={CircleCheck} iconTone="success" title={b.description} subtitle={b.resolution} last={i === arr.length - 1} />
                ))}
            </Card>
          </Gutter>
        </>
      ) : null}

      <SubmitWorkSheet visible={sheet === 'submit'} onClose={() => setSheet(null)} taskId={task.id} />
      <BlockerSheet visible={sheet === 'blocker'} onClose={() => setSheet(null)} taskId={task.id} />
      <ReviewSheet visible={sheet === 'review'} onClose={() => setSheet(null)} taskId={task.id} />
    </Screen>
  );
}
