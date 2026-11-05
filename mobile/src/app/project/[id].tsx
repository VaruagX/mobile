import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FileText, FolderKanban, Megaphone, Plus, Settings2, SquareCheckBig, Upload } from 'lucide-react-native';
import { Avatar, EmptyState, Gutter, KeyValue, ListRow, Screen, ScreenHeader, SectionHeader, cardListStyle } from '@/components/Layout';
import { Chip, FilterChips, StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button, IconButton } from '@/components/Button';
import { MultiSelect, OptionGroup, Sheet, Confirm } from '@/components/Form';
import { SegmentedProgress, ProgressBar } from '@/components/Progress';
import { GoldText } from '@/components/GoldText';
import { Reveal } from '@/components/Motion';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { FileRow, MilestoneTimeline, TaskCard, UpdateCard } from '@/features/cards';
import { NewMilestoneSheet, NewTaskSheet, NewUpdateSheet, UploadFilesSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { useColors } from '@/theme/ThemeProvider';
import { findClient, findUser, milestoneProgress, milestonesOfProject, projectHealth, projectProgress, tasksOfMilestone, TASK_ORDER } from '@/lib/selectors';
import { dueLabel, fmtDate, inr } from '@/lib/format';
import type { FileItem, ProjectStatus } from '@/data/types';

type Tab = 'overview' | 'milestones' | 'tasks' | 'files' | 'updates';

export default function ProjectDetail() {
  const c = useColors();
  const { id, tab: tabParam } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const { state, actions } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>(tabParam ?? 'overview');
  const [sheet, setSheet] = useState<null | 'milestone' | 'task' | 'update' | 'files' | 'settings'>(null);
  const [fileToggle, setFileToggle] = useState<FileItem | null>(null);
  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);

  const project = state.projects.find((p) => p.id === id);
  if (!project) {
    return (
      <Screen header={<ScreenHeader title="Project" />}>
        <EmptyState icon={FolderKanban} title="Project not found" />
      </Screen>
    );
  }
  const isClient = role === 'client';
  const canSee = role === 'admin' || (isClient ? project.clientId === user.clientId : project.memberIds.includes(user.id));
  if (!canSee) {
    return (
      <Screen header={<ScreenHeader title="Project" />}>
        <EmptyState icon={FolderKanban} title="You don't have access to this project" />
      </Screen>
    );
  }

  const client = findClient(state, project.clientId);
  const prog = projectProgress(state, project.id);
  const health = projectHealth(state, project);
  const milestones = milestonesOfProject(state, project.id).filter((m) => !isClient || m.clientVisible);
  const tasks = state.tasks
    .filter((t) => milestones.some((m) => m.id === t.milestoneId))
    .sort((a, b) => TASK_ORDER[a.status] - TASK_ORDER[b.status]);
  const files = state.files.filter((f) => f.projectId === project.id && (!isClient || f.visibility === 'client'));
  const updates = state.updates.filter((u) => u.projectId === project.id && (!isClient || u.status === 'published'));
  const due = dueLabel(project.dueDate, project.status === 'completed');
  const healthText = { completed: 'Completed', delayed: 'Delayed', blocked: 'Blocked', on_track: 'On track' }[health];

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'milestones', label: 'Milestones', count: milestones.length },
    ...(!isClient ? [{ value: 'tasks' as Tab, label: 'Tasks', count: tasks.length }] : []),
    { value: 'updates', label: 'Updates', count: updates.length },
    { value: 'files', label: 'Files', count: files.length },
  ];

  return (
    <Screen
      header={
        <ScreenHeader
          title={project.name}
          eyebrow={`${client?.company} · ${project.code}`}
          right={role === 'admin' ? <IconButton icon={Settings2} label="Project settings" onPress={() => setSheet('settings')} /> : undefined}
        />
      }
    >
      <Gutter style={{ paddingTop: 24 }}>
        <Reveal>
          <Card glass brackets padding={22}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt variant="mono" tone="muted">
                {isClient ? 'Approved progress' : 'Verified progress'}
              </Txt>
              <StatusChip status={project.status} />
            </View>
            <View style={{ marginTop: 12 }}>
              <GoldText variant="mega" upper={false}>{`${Math.round(prog.percent)}%`}</GoldText>
            </View>
            <View style={{ marginTop: 16 }}>
              <SegmentedProgress height={8} segments={prog.parts.filter((p) => !isClient || p.milestone.clientVisible).map((p) => ({ weight: p.milestone.weight, percent: p.percent, title: p.milestone.title }))} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <KeyValue label="Milestones" value={`${prog.milestonesDone} of ${prog.milestoneCount}`} />
              <KeyValue label="Due" value={fmtDate(project.dueDate, true)} tone={due.tone === 'danger' ? 'danger' : 'fg'} />
              <KeyValue label="Health" value={healthText} tone={health === 'on_track' ? 'success' : health === 'completed' ? 'success' : 'danger'} />
            </View>
          </Card>
        </Reveal>
      </Gutter>

      <FilterChips options={tabs} value={tab} onChange={setTab} style={{ marginTop: 22 }} />

      {tab === 'overview' ? (
        <Gutter style={{ marginTop: 20, gap: 14 }}>
          <Card>
            <Txt variant="monoSm" tone="faint">
              {project.category}
            </Txt>
            <Txt variant="body" style={{ marginTop: 8 }}>
              {project.description}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <KeyValue label="Started" value={fmtDate(project.startDate, true)} />
              <KeyValue label="Priority" value={project.priority[0].toUpperCase() + project.priority.slice(1)} />
            </View>
            {role === 'admin' && project.budget ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <KeyValue label="Budget" value={inr(project.budget)} />
                <KeyValue label="Manager" value={findUser(state, project.managerId)?.name ?? '—'} />
              </View>
            ) : null}
          </Card>
          {prog.current ? (
            <Card highlight onPress={!isClient ? () => router.push(`/milestone/${prog.current!.id}`) : undefined}>
              <Txt variant="mono" tone="gold">
                Current milestone
              </Txt>
              <Txt variant="h3" style={{ marginTop: 8 }}>
                {prog.current.title}
              </Txt>
              <View style={{ marginTop: 12 }}>
                <ProgressBar value={milestoneProgress(state, prog.current.id).percent} label={`${prog.current.title} progress`} />
              </View>
              <Txt variant="bodySm" tone="muted" style={{ marginTop: 10 }}>
                {`${Math.round(milestoneProgress(state, prog.current.id).percent)}% · ${dueLabel(prog.current.dueDate).text}`}
              </Txt>
            </Card>
          ) : null}
          {!isClient ? (
            <Card style={cardListStyle}>
              {project.memberIds.map((uid, i) => {
                const u = findUser(state, uid);
                if (!u) return null;
                const open = tasks.filter((t) => t.assigneeId === uid && t.status !== 'done').length;
                return (
                  <ListRow
                    key={uid}
                    leading={<Avatar name={u.name} size={36} tone="blue" />}
                    title={u.name}
                    subtitle={`${u.jobTitle} · ${open} open`}
                    onPress={role === 'admin' ? () => router.push(`/members/${uid}`) : undefined}
                    last={i === project.memberIds.length - 1}
                  />
                );
              })}
            </Card>
          ) : (
            <Button label="Ask a question" variant="ghost" full onPress={() => router.push('/client/support')} />
          )}
          {!isClient ? <Button label="Open team thread" variant="ghost" full onPress={() => router.push(`/thread/${project.id}`)} /> : null}
        </Gutter>
      ) : null}

      {tab === 'milestones' ? (
        <Gutter style={{ marginTop: 20, gap: 12 }}>
          {role === 'admin' ? <Button label="Add milestone" icon={Plus} onPress={() => setSheet('milestone')} /> : null}
          {isClient ? (
            <View style={{ marginTop: 6 }}>
              <MilestoneTimeline projectId={project.id} clientView />
            </View>
          ) : milestones.length ? (
            milestones.map((m) => {
              const mp = milestoneProgress(state, m.id);
              return (
                <Card key={m.id} onPress={() => router.push(`/milestone/${m.id}`)} accessibilityLabel={`${m.title}, ${Math.round(mp.percent)} percent`}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Txt variant="monoSm" tone="faint">{`0${m.order} · Weight ${m.weight}`}</Txt>
                    <StatusChip status={mp.percent === 100 ? 'completed' : m.status} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                    <Txt variant="title">{m.title}</Txt>
                    <Txt variant="title" tone="gold">{`${Math.round(mp.percent)}%`}</Txt>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <ProgressBar value={mp.percent} height={4} label={`${m.title} progress`} />
                  </View>
                  <Txt variant="bodySm" tone="muted" style={{ marginTop: 10 }}>
                    {`${mp.doneCount}/${mp.taskCount} tasks verified · Due ${fmtDate(m.dueDate)}${m.clientVisible ? '' : ' · Hidden from client'}`}
                  </Txt>
                </Card>
              );
            })
          ) : (
            <EmptyState icon={FolderKanban} title="No milestones yet" body="Add milestones with weights. Progress is calculated from verified tasks inside each one." />
          )}
        </Gutter>
      ) : null}

      {tab === 'tasks' && !isClient ? (
        <Gutter style={{ marginTop: 20, gap: 12 }}>
          {role === 'admin' ? <Button label="New task" icon={Plus} onPress={() => setSheet('task')} /> : null}
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} showProject={false} />
          ))}
          {!tasks.length ? <EmptyState icon={SquareCheckBig} title="No tasks yet" /> : null}
        </Gutter>
      ) : null}

      {tab === 'updates' ? (
        <Gutter style={{ marginTop: 20, gap: 12 }}>
          {!isClient ? <Button label={role === 'admin' ? 'Write update' : 'Draft update for client'} icon={Megaphone} onPress={() => setSheet('update')} /> : null}
          {updates.map((u) => (
            <UpdateCard
              key={u.id}
              update={u}
              action={
                role === 'admin' && u.status === 'pending_approval' ? (
                  <Button
                    label="Approve & publish"
                    size="sm"
                    onPress={() => {
                      actions.publishUpdate(u.id);
                      toast('Published. The client has been notified.');
                    }}
                  />
                ) : role === 'admin' && u.status === 'published' ? (
                  <Txt variant="caption" tone="faint">{`Published ${fmtDate(u.publishedAt)} · by ${findUser(state, u.authorId)?.name}`}</Txt>
                ) : undefined
              }
            />
          ))}
          {!updates.length ? <EmptyState icon={Megaphone} title="No updates yet" body={isClient ? 'Approved updates from the team appear here.' : 'Write an update; an admin approves it before the client sees it.'} /> : null}
        </Gutter>
      ) : null}

      {tab === 'files' ? (
        <Gutter style={{ marginTop: 20, gap: 12 }}>
          {!isClient ? <Button label="Upload files" icon={Upload} onPress={() => setSheet('files')} /> : null}
          {files.length ? (
            <Card style={cardListStyle}>
              {files.map((f, i) => (
                <FileRow
                  key={f.id}
                  file={f}
                  last={i === files.length - 1}
                  right={isClient ? <Chip label="Open" /> : undefined}
                  onPress={role === 'admin' ? () => setFileToggle(f) : () => toast('Demo build: files open once storage is connected.')}
                />
              ))}
            </Card>
          ) : (
            <EmptyState icon={FileText} title="No files yet" body={isClient ? 'Files the team shares with you appear here.' : 'Upload deliverables, designs and documents.'} />
          )}
          {role === 'admin' && files.length ? (
            <Txt variant="caption" tone="faint">
              Tap a file to share it with the client or make it internal.
            </Txt>
          ) : null}
        </Gutter>
      ) : null}

      <NewMilestoneSheet visible={sheet === 'milestone'} onClose={() => setSheet(null)} projectId={project.id} />
      <NewTaskSheet visible={sheet === 'task'} onClose={() => setSheet(null)} projectId={project.id} />
      <NewUpdateSheet visible={sheet === 'update'} onClose={() => setSheet(null)} projectId={project.id} />
      <UploadFilesSheet visible={sheet === 'files'} onClose={() => setSheet(null)} projectId={project.id} />
      {role === 'admin' ? (
        <ProjectSettingsSheet visible={sheet === 'settings'} onClose={() => setSheet(null)} projectId={project.id} />
      ) : null}
      <Confirm
        visible={!!fileToggle}
        title={fileToggle?.visibility === 'client' ? 'Make file internal?' : 'Share file with client?'}
        body={fileToggle?.visibility === 'client' ? `${fileToggle?.name} will be hidden from ${client?.company}.` : `${client?.company} will see ${fileToggle?.name} in their portal.`}
        confirmLabel={fileToggle?.visibility === 'client' ? 'Make internal' : 'Share'}
        onCancel={() => setFileToggle(null)}
        onConfirm={() => {
          if (fileToggle) {
            actions.setFileVisibility(fileToggle.id, fileToggle.visibility === 'client' ? 'internal' : 'client');
            toast(fileToggle.visibility === 'client' ? 'File is now internal' : 'File shared with the client');
          }
          setFileToggle(null);
        }}
      />
      <View style={{ height: 1, backgroundColor: c.bg }} />
    </Screen>
  );
}

function ProjectSettingsSheet({ visible, onClose, projectId }: { visible: boolean; onClose: () => void; projectId: string }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const project = state.projects.find((p) => p.id === projectId)!;
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [members, setMembers] = useState(project.memberIds);
  useEffect(() => {
    if (visible) {
      setStatus(project.status);
      setMembers(project.memberIds);
    }
  }, [visible, project.status, project.memberIds]);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow={project.code}
      title="Project settings"
      footer={
        <Button
          label="Save changes"
          full
          onPress={() => {
            actions.updateProjectStatus(projectId, status);
            actions.setProjectMembers(projectId, members);
            toast('Project updated');
            onClose();
          }}
        />
      }
    >
      <OptionGroup
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'planning', label: 'Planning' },
          { value: 'active', label: 'Active' },
          { value: 'on_hold', label: 'On hold' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
      />
      <MultiSelect
        label="Team"
        values={members}
        onChange={setMembers}
        options={state.users.filter((u) => u.role === 'team').map((u) => ({ value: u.id, label: u.name }))}
      />
      <Txt variant="caption" tone="faint">
        {`Tasks in this project: ${state.milestones.filter((m) => m.projectId === projectId).reduce((a, m) => a + tasksOfMilestone(state, m.id).length, 0)}`}
      </Txt>
    </Sheet>
  );
}
