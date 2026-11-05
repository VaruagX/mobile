import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, CircleCheck, Megaphone, ShieldCheck, SquareCheckBig, TriangleAlert } from 'lucide-react-native';
import { BrandHeader, EmptyState, Gutter, ListRow, Screen, SectionHeader, cardListStyle } from '@/components/Layout';
import { Hero } from '@/components/Hero';
import { Leadership } from '@/components/Leadership';
import { Card } from '@/components/Surface';
import { Chip, DemoBadge } from '@/components/Chips';
import { ProgressBar, StatTile } from '@/components/Progress';
import { Reveal } from '@/components/Motion';
import { Txt } from '@/components/Txt';
import { ProjectCard } from '@/features/cards';
import { NewProjectSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { useColors } from '@/theme/ThemeProvider';
import { financeSummary, findClient, findProject, findUser, projectOfTask } from '@/lib/selectors';
import { greeting, inr, pad2, relativeTime } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/status';

export default function AdminHome() {
  const c = useColors();
  const { state } = useStore();
  const { user } = useMe();
  const [creating, setCreating] = useState(false);
  const fin = financeSummary(state);
  const activeProjects = state.projects.filter((p) => p.status === 'active');
  const inReview = state.tasks.filter((t) => t.status === 'in_review');
  const pendingPayments = state.payments.filter((p) => p.status === 'pending');
  const blockers = state.blockers.filter((b) => b.status === 'open');
  const updates = state.updates.filter((u) => u.status === 'pending_approval');
  const openTickets = state.tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed');
  const attentionCount = pendingPayments.length + inReview.length + blockers.length + updates.length;

  return (
    <Screen header={<BrandHeader />} tabBar>
      <Hero
        eyebrow={`Admin workspace · ${greeting()}, ${user.name.split(' ')[0]}`}
        primary={{ label: 'New project', icon: ArrowRight, onPress: () => setCreating(true) }}
        secondary={{ label: 'Verify payments', onPress: () => router.push({ pathname: '/admin/finance', params: { tab: 'payments' } }) }}
        status={`${activeProjects.length} projects live`}
      />

      <View style={{ marginTop: 36 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
          <SectionHeader index="01" label="Business overview" style={{ flex: 1 }} />
          <DemoBadge />
        </View>
        <Gutter style={{ marginTop: 18 }}>
          <Reveal>
            <Card glass brackets padding={20} onPress={() => router.push('/admin/finance')} accessibilityLabel={`Outstanding balance ${inr(fin.outstanding)}`}>
              <Txt variant="mono" tone="muted">
                Outstanding balance
              </Txt>
              <Txt variant="amount" style={{ marginTop: 10 }}>
                <Txt variant="amount" tone="gold">
                  ₹
                </Txt>
                {inr(fin.outstanding).slice(1)}
              </Txt>
              <View style={{ marginTop: 18 }}>
                <ProgressBar value={fin.collectedPercent} label="Collected" />
              </View>
              <Txt variant="bodySm" tone="muted" style={{ marginTop: 10 }}>
                {`${fin.collectedPercent}% of issued invoices collected`}
              </Txt>
              <View style={{ marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', gap: 10 }}>
                <Mini label="Collected" value={inr(fin.collected)} />
                <Mini label="To verify" value={inr(fin.pendingVerification)} tone="gold" />
                <Mini label="Overdue" value={inr(fin.overdue)} tone="danger" />
              </View>
            </Card>
          </Reveal>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <StatTile value={pad2(activeProjects.length)} label="Active projects" onPress={() => router.push('/admin/projects')} />
            <StatTile value={pad2(inReview.length)} label="Tasks in review" tone={inReview.length ? 'gold' : 'fg'} onPress={() => router.push({ pathname: '/tasks', params: { filter: 'in_review' } })} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <StatTile value={pad2(state.clients.filter((cl) => cl.status === 'active').length)} label="Active clients" onPress={() => router.push('/admin/people')} />
            <StatTile value={pad2(openTickets.length)} label="Open tickets" onPress={() => router.push('/support-desk')} />
          </View>
        </Gutter>
      </View>

      <SectionHeader
        index="02"
        label="Needs your attention"
        title={attentionCount ? `${attentionCount} things` : 'All clear,'}
        accent={attentionCount ? 'waiting on you.' : 'nothing waiting.'}
        style={{ marginTop: 44 }}
      />
      <Gutter style={{ marginTop: 18 }}>
        {attentionCount ? (
          <Card style={cardListStyle}>
            {pendingPayments.map((p) => {
              const inv = state.invoices.find((i) => i.id === p.invoiceId);
              return (
                <ListRow
                  key={p.id}
                  icon={ShieldCheck}
                  iconTone="gold"
                  title={`${paymentMethodLabel[p.method]} payment · ${inr(p.amount)}`}
                  subtitle={`${findClient(state, inv?.clientId)?.company} · ${inv?.number}`}
                  right={<Chip label="Verify" tone="gold" />}
                  onPress={() => router.push(`/payment/${p.id}`)}
                />
              );
            })}
            {inReview.map((t) => (
              <ListRow
                key={t.id}
                icon={SquareCheckBig}
                iconTone="blue"
                title={`${t.title} submitted`}
                subtitle={`${findUser(state, t.assigneeId)?.name} · ${projectOfTask(state, t)?.name}`}
                right={<Chip label="Review" />}
                onPress={() => router.push(`/task/${t.id}`)}
              />
            ))}
            {blockers.map((b) => {
              const t = state.tasks.find((x) => x.id === b.taskId);
              return (
                <ListRow
                  key={b.id}
                  icon={TriangleAlert}
                  iconTone="danger"
                  title={`Blocker: ${t?.title}`}
                  subtitle={`${b.description} · ${relativeTime(b.createdAt)}`}
                  right={<Chip label="Open" />}
                  onPress={() => router.push(`/task/${b.taskId}`)}
                />
              );
            })}
            {updates.map((u) => (
              <ListRow
                key={u.id}
                icon={Megaphone}
                iconTone="gold"
                title={`Approve update: ${u.title}`}
                subtitle={`${findUser(state, u.authorId)?.name} · ${findProject(state, u.projectId)?.name}`}
                right={<Chip label="Approve" tone="gold" />}
                onPress={() => router.push({ pathname: '/project/[id]', params: { id: u.projectId, tab: 'updates' } })}
              />
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState icon={CircleCheck} title="Nothing needs you right now" body="Payments, reviews, blockers and client updates show up here." />
          </Card>
        )}
      </Gutter>

      <SectionHeader index="03" label="Projects in motion" action={{ label: 'View all', onPress: () => router.push('/admin/projects') }} style={{ marginTop: 44 }} />
      <Gutter style={{ marginTop: 18, gap: 12 }}>
        {activeProjects.slice(0, 3).map((p, i) => (
          <Reveal key={p.id} delay={i * 70}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </Gutter>

      <View style={{ marginTop: 48 }}>
        <Leadership index="04" />
      </View>
      <NewProjectSheet visible={creating} onClose={() => setCreating(false)} />
    </Screen>
  );
}

function Mini({ label, value, tone = 'fg' }: { label: string; value: string; tone?: 'fg' | 'gold' | 'danger' }) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Txt variant="monoSm" tone="faint">
        {label}
      </Txt>
      <Txt variant="body" weight="semibold" tone={tone} style={{ marginTop: 6, letterSpacing: -0.3 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Txt>
    </View>
  );
}
