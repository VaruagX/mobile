import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Download } from 'lucide-react-native';
import { BrandHeader, Gutter, KeyValue, Screen, SectionHeader, cardListStyle } from '@/components/Layout';
import { Hero } from '@/components/Hero';
import { Leadership } from '@/components/Leadership';
import { Card } from '@/components/Surface';
import { Chip, DemoBadge } from '@/components/Chips';
import { Button } from '@/components/Button';
import { SegmentedProgress } from '@/components/Progress';
import { GoldText } from '@/components/GoldText';
import { Reveal } from '@/components/Motion';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { MilestoneTimeline, PaymentRow, ProjectCard, UpdateCard } from '@/features/cards';
import { RecordPaymentSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { invoiceBalance, projectProgress } from '@/lib/selectors';
import { fmtDate, fmtDate as d, inr } from '@/lib/format';

export default function ClientHome() {
  const { state } = useStore();
  const { user } = useMe();
  const toast = useToast();
  const [paying, setPaying] = useState<string | null>(null);
  const client = state.clients.find((c) => c.id === user.clientId);
  const projects = state.projects.filter((p) => p.clientId === user.clientId);
  const project = projects.find((p) => p.status === 'active') ?? projects[0];
  const prog = project ? projectProgress(state, project.id) : null;
  const update = state.updates.find((u) => u.status === 'published' && projects.some((p) => p.id === u.projectId));
  const openInvoice = state.invoices.find((i) => i.clientId === user.clientId && i.status === 'issued' && invoiceBalance(state, i).balance > 0);
  const bal = openInvoice ? invoiceBalance(state, openInvoice) : null;
  const myPayments = state.payments
    .filter((p) => state.invoices.find((i) => i.id === p.invoiceId)?.clientId === user.clientId)
    .slice(0, 2);
  const others = projects.filter((p) => p.id !== project?.id);

  return (
    <Screen header={<BrandHeader />} tabBar>
      <Hero
        eyebrow={`Client portal · Welcome, ${client?.company}`}
        primary={project ? { label: 'View progress', icon: ArrowRight, onPress: () => router.push(`/project/${project.id}`) } : undefined}
        secondary={{ label: 'Pay invoice', onPress: () => router.push('/client/invoices') }}
        status={project ? (project.status === 'active' ? 'Project in progress' : 'Project update') : 'Varuag Labs OS'}
      />

      {project && prog ? (
        <View style={{ marginTop: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
            <SectionHeader index="01" label="Your project" style={{ flex: 1 }} />
            <DemoBadge />
          </View>
          <Gutter style={{ marginTop: 18 }}>
            <Reveal>
              <Card glass brackets padding={22} onPress={() => router.push(`/project/${project.id}`)} accessibilityLabel={`${project.name}: ${Math.round(prog.percent)} percent approved progress`}>
                <Txt variant="mono" tone="gold">
                  {project.name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 14 }}>
                  <GoldText variant="mega" upper={false}>{`${Math.round(prog.percent)}%`}</GoldText>
                  <Txt variant="bodySm" tone="muted" style={{ marginBottom: 8 }}>
                    {'Approved progress\nVerified work only'}
                  </Txt>
                </View>
                <View style={{ marginTop: 20 }}>
                  <SegmentedProgress height={8} segments={prog.parts.map((p) => ({ weight: p.milestone.weight, percent: p.percent, title: p.milestone.title }))} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
                  <KeyValue label="Current milestone" value={prog.current?.title ?? 'All done'} />
                  <KeyValue label="Expected launch" value={fmtDate(project.dueDate, true)} />
                </View>
              </Card>
            </Reveal>
            {others.length ? (
              <View style={{ marginTop: 12, gap: 12 }}>
                {others.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </View>
            ) : null}
          </Gutter>

          <SectionHeader index="02" label="Milestones" action={{ label: 'Details', onPress: () => router.push(`/project/${project.id}`) }} style={{ marginTop: 44 }} />
          <Gutter style={{ marginTop: 20 }}>
            <MilestoneTimeline projectId={project.id} clientView />
          </Gutter>
        </View>
      ) : null}

      {update ? (
        <>
          <SectionHeader index="03" label="Latest update" action={{ label: 'All updates', onPress: () => router.push('/updates') }} style={{ marginTop: 44 }} />
          <Gutter style={{ marginTop: 18 }}>
            <UpdateCard update={update} />
          </Gutter>
        </>
      ) : null}

      <SectionHeader index="04" label="Invoices" action={{ label: 'Payment history', onPress: () => router.push({ pathname: '/client/invoices', params: { tab: 'history' } }) }} style={{ marginTop: 44 }} />
      <Gutter style={{ marginTop: 18 }}>
        {openInvoice && bal ? (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Txt variant="mono" tone="muted">
                  Balance due
                </Txt>
                <Txt variant="amount" style={{ marginTop: 8, fontSize: 34, lineHeight: 36 }}>
                  <Txt variant="amount" tone="gold" style={{ fontSize: 34, lineHeight: 36 }}>
                    ₹
                  </Txt>
                  {inr(bal.balance).slice(1)}
                </Txt>
              </View>
              <Chip label={openInvoice.number.replace('VL-INV-2026-', 'INV-')} />
            </View>
            <Txt variant="bodySm" tone={bal.state === 'overdue' ? 'danger' : 'muted'} style={{ marginTop: 10 }}>
              {`Due ${d(openInvoice.dueDate)} · ${openInvoice.title}`}
            </Txt>
            {bal.pending ? (
              <Txt variant="caption" tone="gold" style={{ marginTop: 4 }}>
                {`${inr(bal.pending)} you sent is being verified`}
              </Txt>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Button label="Record payment" size="sm" style={{ flex: 1 }} onPress={() => setPaying(openInvoice.id)} />
              <Button label="PDF" icon={Download} variant="ghost" size="sm" onPress={() => toast('Demo build: the PDF downloads once the API is connected.')} />
            </View>
          </Card>
        ) : (
          <Card>
            <Txt variant="title">You are all paid up.</Txt>
            <Txt variant="bodySm" tone="muted" style={{ marginTop: 6 }}>
              New invoices from Varuag Labs appear here.
            </Txt>
          </Card>
        )}
        {myPayments.length ? (
          <Card style={[cardListStyle, { marginTop: 12 }]}>
            {myPayments.map((p, i) => (
              <PaymentRow key={p.id} payment={p} last={i === myPayments.length - 1} onPress={() => router.push(`/invoice/${p.invoiceId}`)} />
            ))}
          </Card>
        ) : null}
      </Gutter>

      <View style={{ marginTop: 48 }}>
        <Leadership index="05" />
      </View>
      {paying ? <RecordPaymentSheet visible onClose={() => setPaying(null)} invoiceId={paying} /> : null}
    </Screen>
  );
}
