import { useState } from 'react';
import { FileText, Upload } from 'lucide-react-native';
import { EmptyState, Gutter, Screen, ScreenHeader, cardListStyle } from '@/components/Layout';
import { FilterChips } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { FileRow } from '@/features/cards';
import { UploadFilesSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { projectsForUser } from '@/lib/selectors';

/** Files across the user's projects. Clients see shared files only. */
export default function Files() {
  const { state } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const projects = projectsForUser(state, user.id, role, user.clientId);
  const [projectId, setProjectId] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const files = state.files
    .filter((f) => projects.some((p) => p.id === f.projectId))
    .filter((f) => projectId === 'all' || f.projectId === projectId)
    .filter((f) => role !== 'client' || f.visibility === 'client')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const target = projectId !== 'all' ? projectId : projects.find((p) => p.status === 'active')?.id;
  return (
    <Screen header={<ScreenHeader title={role === 'client' ? 'Shared files' : 'Files'} eyebrow={`${files.length} files`} />}>
      <FilterChips
        style={{ marginTop: 20 }}
        value={projectId}
        onChange={setProjectId}
        options={[{ value: 'all', label: 'All projects' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
      />
      <Gutter style={{ marginTop: 16, gap: 12 }}>
        {role !== 'client' && target ? <Button label="Upload files" icon={Upload} onPress={() => setUploading(true)} /> : null}
        {files.length ? (
          <Card style={cardListStyle}>
            {files.map((f, i) => (
              <FileRow key={f.id} file={f} last={i === files.length - 1} onPress={() => toast('Demo build: files open once storage is connected.')} />
            ))}
          </Card>
        ) : (
          <EmptyState icon={FileText} title="No files yet" />
        )}
      </Gutter>
      {target ? <UploadFilesSheet visible={uploading} onClose={() => setUploading(false)} projectId={target} /> : null}
    </Screen>
  );
}
