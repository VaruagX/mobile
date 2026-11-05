import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Building2, FileText, Mail, MapPin, Phone, Plus } from 'lucide-react-native';
import { Avatar, EmptyState, Gutter, KeyValue, ListRow, Screen, ScreenHeader, SectionHeader, cardListStyle } from '@/components/Layout';
import { StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Confirm } from '@/components/Form';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { InvoiceCard, ProjectCard } from '@/features/cards';
import { NewInvoiceSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { financeSummary } from '@/lib/selectors';
import { fmtDate, inr } from '@/lib/format';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useStore();
  const { role } = useMe();
  const toast = useToast();
  const [invoicing, setInvoicing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const cl = state.clients.find((x) => x.id === id);
  if (!cl || role !== 'admin') {
    return (
      <Screen header={<ScreenHeader title="Client" />}>
        <EmptyState icon={Building2} title="Client not available" />
      </Screen>
    );
  }
  const projects = state.projects.filter((p) => p.clientId === cl.id);
  const invoices = state.invoices.filter((i) => i.clientId === cl.id);
  const logins = state.users.filter((u) => u.clientId === cl.id);
  const fin = financeSummary(state, cl.id);
  const suspended = cl.status === 'suspended';

  return (
    <Screen header={<ScreenHeader title={cl.company} eyebrow="Client" />}>
      <Gutter style={{ paddingTop: 24, gap: 14 }}>
        <Card glass brackets padding={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={cl.company} size={52} />
            <View style={{ flex: 1 }}>
              <Txt variant="h3">{cl.company}</Txt>
              <Txt variant="bodySm" tone="muted">{`Client since ${fmtDate(cl.since, true)}`}</Txt>
            </View>
            <StatusChip status={cl.status} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <KeyValue label="Invoiced" value={inr(fin.invoiced)} />
            <KeyValue label="Outstanding" value={inr(fin.outstanding)} tone={fin.outstanding ? 'gold' : 'fg'} />
          </View>
        </Card>
        <Card style={cardListStyle}>
          <ListRow icon={Mail} title={cl.email} subtitle={cl.contactName} onPress={() => Linking.openURL(`mailto:${cl.email}`).catch(() => {})} />
          <ListRow icon={Phone} title={cl.phone} subtitle="Phone" onPress={() => Linking.openURL(`tel:${cl.phone.replace(/\s/g, '')}`).catch(() => {})} />
          <ListRow icon={MapPin} title={cl.city} subtitle={cl.gstin ? `GSTIN ${cl.gstin}` : 'No GSTIN'} last />
        </Card>
        <Card style={cardListStyle}>
          {logins.length ? (
            logins.map((u, i) => <ListRow key={u.id} leading={<Avatar name={u.name} size={36} tone="neutral" />} title={u.name} subtitle={`Portal login · ${u.email}`} right={<StatusChip status={u.status} />} last={i === logins.length - 1} />)
          ) : (
            <ListRow icon={FileText} title="No portal login" subtitle="This client cannot sign in yet" last />
          )}
        </Card>
      </Gutter>

      <SectionHeader label={`Projects · ${projects.length}`} style={{ marginTop: 30 }} />
      <Gutter style={{ marginTop: 14, gap: 12 }}>
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
        {!projects.length ? <EmptyState icon={Building2} title="No projects yet" /> : null}
      </Gutter>

      <SectionHeader label={`Invoices · ${invoices.length}`} style={{ marginTop: 30 }} />
      <Gutter style={{ marginTop: 14, gap: 12 }}>
        <Button label="New invoice" icon={Plus} onPress={() => setInvoicing(true)} />
        {invoices.map((i) => (
          <InvoiceCard key={i.id} invoice={i} />
        ))}
        <Button label={suspended ? 'Reactivate client' : 'Suspend portal access'} variant={suspended ? 'ghost' : 'danger'} full style={{ marginTop: 18 }} onPress={() => setConfirm(true)} />
      </Gutter>
      <NewInvoiceSheet visible={invoicing} onClose={() => setInvoicing(false)} clientId={cl.id} />
      <Confirm
        visible={confirm}
        title={suspended ? 'Reactivate this client?' : 'Suspend portal access?'}
        body={suspended ? `${cl.company} will be able to sign in again.` : `${cl.company} will not be able to sign in. Their data is kept.`}
        confirmLabel={suspended ? 'Reactivate' : 'Suspend'}
        danger={!suspended}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          actions.setClientStatus(cl.id, suspended ? 'active' : 'suspended');
          toast(suspended ? 'Client reactivated' : 'Client suspended');
          setConfirm(false);
        }}
      />
    </Screen>
  );
}
