import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Receipt, ShieldCheck } from 'lucide-react-native';
import { EmptyState, Gutter, KeyValue, ListRow, Screen, ScreenHeader, cardListStyle } from '@/components/Layout';
import { StatusChip } from '@/components/Chips';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { RejectPaymentSheet } from '@/features/sheets';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import { findClient, findUser, invoiceBalance } from '@/lib/selectors';
import { fmtDate, fmtDateTime, inr } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/status';

/** Admin: one manual payment, with verify / reject. */
export default function PaymentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useStore();
  const { role } = useMe();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const p = state.payments.find((x) => x.id === id);
  if (!p || role !== 'admin') {
    return (
      <Screen header={<ScreenHeader title="Payment" />}>
        <EmptyState icon={Receipt} title="Payment not available" />
      </Screen>
    );
  }
  const inv = state.invoices.find((i) => i.id === p.invoiceId)!;
  const client = findClient(state, inv.clientId);
  const b = invoiceBalance(state, inv);
  const footer =
    p.status === 'pending' ? (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Reject" variant="ghost" style={{ flex: 1 }} onPress={() => setRejecting(true)} />
        <Button
          label="Verify payment"
          icon={ShieldCheck}
          style={{ flex: 1.5 }}
          onPress={() => {
            actions.verifyPayment(p.id);
            toast('Verified. Receipt issued to the client.');
          }}
        />
      </View>
    ) : undefined;

  return (
    <Screen header={<ScreenHeader title={`${inr(p.amount)} · ${paymentMethodLabel[p.method]}`} eyebrow={client?.company} />} footer={footer}>
      <Gutter style={{ paddingTop: 24, gap: 14 }}>
        <Card glass brackets padding={22} highlight={p.status === 'pending'}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="mono" tone="muted">
              {paymentMethodLabel[p.method]}
            </Txt>
            <StatusChip status={p.status === 'pending' ? 'verifying' : p.status} />
          </View>
          <Txt variant="amount" style={{ marginTop: 10 }}>
            {inr(p.amount)}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <KeyValue label="Paid on" value={fmtDate(p.paidOn, true)} />
            <KeyValue label="Submitted by" value={findUser(state, p.submittedBy)?.name ?? '—'} />
          </View>
          <View style={{ marginTop: 14 }}>
            <KeyValue label={p.method === 'upi' ? 'UPI transaction ID' : p.method === 'bank_transfer' ? 'UTR / reference' : 'Note'} value={p.reference ?? '—'} />
          </View>
          {p.note ? (
            <Txt variant="bodySm" tone="muted" style={{ marginTop: 12 }}>
              “{p.note}”
            </Txt>
          ) : null}
          {p.proofName ? (
            <Txt variant="caption" tone="gold" style={{ marginTop: 10 }}>
              Proof attached: {p.proofName}
            </Txt>
          ) : null}
        </Card>

        {p.status === 'verified' ? (
          <Card>
            <Txt variant="mono" tone="success">
              Receipt
            </Txt>
            <Txt variant="title" style={{ marginTop: 6 }}>
              {p.receiptNumber}
            </Txt>
            <Txt variant="bodySm" tone="muted">{`Verified ${p.verifiedAt ? fmtDateTime(p.verifiedAt) : ''}`}</Txt>
          </Card>
        ) : null}
        {p.status === 'rejected' ? (
          <Card>
            <Txt variant="mono" tone="danger">
              Rejected
            </Txt>
            <Txt variant="body" style={{ marginTop: 6 }}>
              {p.rejectionReason}
            </Txt>
          </Card>
        ) : null}

        <Card style={cardListStyle}>
          <ListRow
            icon={Receipt}
            title={inv.number}
            subtitle={`${inv.title} · ${inr(b.balance)} balance · ${inr(b.pending)} pending`}
            onPress={() => router.push(`/invoice/${inv.id}`)}
            last
          />
        </Card>
        {p.status === 'pending' ? (
          <Txt variant="caption" tone="faint">
            Check the amount and reference against your bank statement or UPI app before verifying. Verification issues a receipt and reduces the balance.
          </Txt>
        ) : null}
      </Gutter>
      <RejectPaymentSheet visible={rejecting} onClose={() => setRejecting(false)} paymentId={p.id} />
    </Screen>
  );
}
