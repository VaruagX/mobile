import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Receipt, ShieldCheck, Wallet } from 'lucide-react-native';
import { BrandHeader, EmptyState, Gutter, ListRow, Screen, SectionHeader, cardListStyle } from '@/components/Layout';
import { DemoBadge, FilterChips, Segmented, StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/Progress';
import { Reveal } from '@/components/Motion';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { InvoiceCard, PaymentRow } from '@/features/cards';
import { NewExpenseSheet, NewInvoiceSheet, RejectPaymentSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useColors } from '@/theme/ThemeProvider';
import { financeSummary, findClient, invoiceBalance, type PaymentState } from '@/lib/selectors';
import { fmtDate, inr } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/status';

type Tab = 'invoices' | 'payments' | 'expenses';
type InvFilter = 'all' | 'open' | 'overdue' | 'paid' | 'draft';

export default function Finance() {
  const c = useColors();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const { state, actions } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>(params.tab ?? 'invoices');
  const [filter, setFilter] = useState<InvFilter>('all');
  const [newInvoice, setNewInvoice] = useState(false);
  const [newExpense, setNewExpense] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);

  const fin = financeSummary(state);
  const pending = state.payments.filter((p) => p.status === 'pending');
  const history = state.payments.filter((p) => p.status !== 'pending');
  const state0 = (s: PaymentState) => s;
  const invoices = state.invoices.filter((i) => {
    const s = invoiceBalance(state, i).state;
    if (filter === 'all') return true;
    if (filter === 'open') return s === 'unpaid' || s === 'partially_paid' || s === 'overdue';
    return s === state0(filter as PaymentState);
  });
  const count = (f: InvFilter) =>
    state.invoices.filter((i) => {
      const s = invoiceBalance(state, i).state;
      return f === 'all' || (f === 'open' ? ['unpaid', 'partially_paid', 'overdue'].includes(s) : s === f);
    }).length;

  return (
    <Screen header={<BrandHeader />} tabBar>
      <View style={{ paddingTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
        <SectionHeader label="Finance" style={{ flex: 1 }} />
        <DemoBadge />
      </View>
      <Gutter style={{ marginTop: 14 }}>
        <Txt variant="h2">
          Invoices &amp; payments
        </Txt>
        <Card glass brackets padding={20} style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt variant="monoSm" tone="faint">
                Invoiced
              </Txt>
              <Txt variant="h3" style={{ marginTop: 6 }}>
                {inr(fin.invoiced)}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="monoSm" tone="faint">
                Outstanding
              </Txt>
              <Txt variant="h3" tone="gold" style={{ marginTop: 6 }}>
                {inr(fin.outstanding)}
              </Txt>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <ProgressBar value={fin.collectedPercent} label="Collected" />
          </View>
          <Txt variant="bodySm" tone="muted" style={{ marginTop: 8 }}>
            {`${inr(fin.collected)} collected · ${inr(fin.overdue)} overdue`}
          </Txt>
        </Card>
        <Segmented
          style={{ marginTop: 20 }}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'invoices', label: 'Invoices' },
            { value: 'payments', label: 'Payments', count: pending.length || undefined },
            { value: 'expenses', label: 'Expenses' },
          ]}
        />
      </Gutter>

      {tab === 'invoices' ? (
        <>
          <Gutter style={{ marginTop: 18 }}>
            <Button label="New invoice" icon={Plus} onPress={() => setNewInvoice(true)} />
          </Gutter>
          <FilterChips
            style={{ marginTop: 18 }}
            value={filter}
            onChange={setFilter}
            options={(['all', 'open', 'overdue', 'paid', 'draft'] as InvFilter[]).map((f) => ({ value: f, label: f[0].toUpperCase() + f.slice(1), count: count(f) }))}
          />
          <Gutter style={{ marginTop: 16, gap: 12 }}>
            {invoices.map((inv, i) => (
              <Reveal key={inv.id} delay={i * 50}>
                <InvoiceCard invoice={inv} showClient />
              </Reveal>
            ))}
            {!invoices.length ? <EmptyState icon={Receipt} title="No invoices" body="Invoices with this status appear here." /> : null}
          </Gutter>
        </>
      ) : null}

      {tab === 'payments' ? (
        <>
          <SectionHeader label="Awaiting verification" style={{ marginTop: 26 }} />
          <Gutter style={{ marginTop: 14, gap: 12 }}>
            {pending.length ? (
              pending.map((p) => {
                const inv = state.invoices.find((i) => i.id === p.invoiceId);
                return (
                  <Card key={p.id} highlight>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Txt variant="mono" tone="gold">
                        {`${paymentMethodLabel[p.method]} · ${fmtDate(p.paidOn)}`}
                      </Txt>
                      <StatusChip status="verifying" />
                    </View>
                    <Txt variant="h3" style={{ marginTop: 10 }}>
                      {inr(p.amount)}
                    </Txt>
                    <Txt variant="bodySm" tone="muted" style={{ marginTop: 4 }}>
                      {`${findClient(state, inv?.clientId)?.company} · ${inv?.number}`}
                    </Txt>
                    <Txt variant="bodySm" style={{ marginTop: 8 }}>
                      {p.reference ?? 'No reference'}
                    </Txt>
                    {p.proofName ? (
                      <Txt variant="caption" tone="faint" style={{ marginTop: 4 }}>
                        Proof attached: {p.proofName}
                      </Txt>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                      <Button label="Reject" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setRejecting(p.id)} />
                      <Button
                        label="Verify"
                        icon={ShieldCheck}
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => {
                          actions.verifyPayment(p.id);
                          toast(`Verified ${inr(p.amount)}. Receipt issued.`);
                        }}
                      />
                    </View>
                  </Card>
                );
              })
            ) : (
              <Card>
                <EmptyState icon={ShieldCheck} title="Nothing to verify" body="Payments clients submit by UPI, bank transfer or cash wait here for you." />
              </Card>
            )}
          </Gutter>
          <SectionHeader label="Payment history" style={{ marginTop: 32 }} />
          <Gutter style={{ marginTop: 14 }}>
            <Card style={cardListStyle}>
              {history.map((p, i) => (
                <PaymentRow key={p.id} payment={p} showInvoice last={i === history.length - 1} onPress={() => router.push(`/payment/${p.id}`)} />
              ))}
            </Card>
          </Gutter>
        </>
      ) : null}

      {tab === 'expenses' ? (
        <>
          <Gutter style={{ marginTop: 18 }}>
            <Button label="Log expense" icon={Plus} onPress={() => setNewExpense(true)} />
          </Gutter>
          <Gutter style={{ marginTop: 16 }}>
            <Card style={cardListStyle}>
              {state.expenses.map((e, i) => (
                <ListRow
                  key={e.id}
                  icon={Wallet}
                  iconTone={e.status === 'pending' ? 'gold' : 'neutral'}
                  title={`${inr(e.amount)} · ${e.category}`}
                  subtitle={`${e.description} · ${fmtDate(e.date)}`}
                  last={i === state.expenses.length - 1}
                  right={
                    e.status === 'pending' ? (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Button label="Approve" size="sm" style={{ paddingHorizontal: 12 }} onPress={() => { actions.setExpenseStatus(e.id, 'approved'); toast('Expense approved'); }} />
                      </View>
                    ) : (
                      <StatusChip status={e.status} />
                    )
                  }
                />
              ))}
            </Card>
            <Txt variant="caption" tone="faint" style={{ marginTop: 10, color: c.faint }}>
              {`This month: ${inr(state.expenses.filter((e) => e.status === 'approved').reduce((a, e) => a + e.amount, 0))} approved`}
            </Txt>
          </Gutter>
        </>
      ) : null}

      <NewInvoiceSheet visible={newInvoice} onClose={() => setNewInvoice(false)} />
      <NewExpenseSheet visible={newExpense} onClose={() => setNewExpense(false)} />
      {rejecting ? <RejectPaymentSheet visible onClose={() => setRejecting(null)} paymentId={rejecting} /> : null}
    </Screen>
  );
}
