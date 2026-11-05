import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Receipt } from 'lucide-react-native';
import { BrandHeader, EmptyState, Gutter, Screen, SectionHeader, cardListStyle } from '@/components/Layout';
import { DemoBadge, Segmented } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { ProgressBar } from '@/components/Progress';
import { Reveal } from '@/components/Motion';
import { Txt } from '@/components/Txt';
import { InvoiceCard, PaymentRow } from '@/features/cards';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { financeSummary } from '@/lib/selectors';
import { inr } from '@/lib/format';

type Tab = 'invoices' | 'history';

export default function ClientInvoices() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const { state } = useStore();
  const { user } = useMe();
  const [tab, setTab] = useState<Tab>(params.tab ?? 'invoices');
  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);
  const invoices = state.invoices.filter((i) => i.clientId === user.clientId && i.status !== 'draft');
  const ids = new Set(invoices.map((i) => i.id));
  const payments = state.payments.filter((p) => ids.has(p.invoiceId));
  const fin = financeSummary(state, user.clientId);

  return (
    <Screen header={<BrandHeader />} tabBar>
      <View style={{ paddingTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
        <SectionHeader label="Invoices" style={{ flex: 1 }} />
        <DemoBadge />
      </View>
      <Gutter style={{ marginTop: 14 }}>
        <Txt variant="h2">Billing</Txt>
        <Card glass brackets padding={20} style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt variant="monoSm" tone="faint">
                Paid
              </Txt>
              <Txt variant="h3" style={{ marginTop: 6 }}>
                {inr(fin.collected)}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="monoSm" tone="faint">
                Balance due
              </Txt>
              <Txt variant="h3" tone="gold" style={{ marginTop: 6 }}>
                {inr(fin.outstanding)}
              </Txt>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <ProgressBar value={fin.collectedPercent} label="Paid" />
          </View>
          {fin.pendingVerification ? (
            <Txt variant="caption" tone="gold" style={{ marginTop: 8 }}>
              {`${inr(fin.pendingVerification)} you sent is being verified`}
            </Txt>
          ) : null}
        </Card>
        <Segmented
          style={{ marginTop: 20 }}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'invoices', label: 'Invoices', count: invoices.length },
            { value: 'history', label: 'Payment history' },
          ]}
        />
      </Gutter>
      <Gutter style={{ marginTop: 18, gap: 12 }}>
        {tab === 'invoices' ? (
          invoices.length ? (
            invoices.map((inv, i) => (
              <Reveal key={inv.id} delay={i * 60}>
                <InvoiceCard invoice={inv} />
              </Reveal>
            ))
          ) : (
            <EmptyState icon={Receipt} title="No invoices yet" />
          )
        ) : payments.length ? (
          <>
            <Card style={cardListStyle}>
              {payments.map((p, i) => (
                <PaymentRow key={p.id} payment={p} showInvoice last={i === payments.length - 1} onPress={() => router.push(`/invoice/${p.invoiceId}`)} />
              ))}
            </Card>
            <Txt variant="caption" tone="faint">
              Receipts are issued when Varuag Labs verifies a payment.
            </Txt>
          </>
        ) : (
          <EmptyState icon={Receipt} title="No payments yet" />
        )}
      </Gutter>
    </Screen>
  );
}
