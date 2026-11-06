import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Banknote, Cloud, Code, FileText, Globe, Landmark, Plane, Plus, Receipt, Server, Smartphone, Trash2, Wallet, type LucideIcon } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Confirm, Field, FilePicker, Sheet, SwitchRow, type PickedFile } from '@/components/Form';
import { Card } from '@/components/Surface';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import type { PaymentMethod } from '@/data/types';
import { DEMO_TODAY, inr } from '@/lib/format';
import { findClient, invoiceBalance, invoiceTotals } from '@/lib/selectors';
import { tap } from '@/lib/haptics';
import { useColors } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { ConfirmDates, PriorityPicker, SearchSelect, Section, cleanAmount, fmtDMY, isRealDate, num } from './form-parts';

type SheetProps = { visible: boolean; onClose: () => void };

const rupees = (n: number) => inr(Number.isFinite(n) ? n : 0);

/** Two-line label/value row used by the summaries. */
function SummaryRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'gold' | 'danger' | 'success' | 'muted' }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <Txt variant={strong ? 'bodySm' : 'caption'} weight={strong ? 'semibold' : 'regular'} tone="muted">
        {label}
      </Txt>
      <Txt variant={strong ? 'title' : 'bodySm'} weight={strong ? 'semibold' : 'medium'} tone={tone}>
        {value}
      </Txt>
    </View>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <View style={{ gap: 8, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg2 }}>{children}</View>;
}

/* ----------------------------------------------------------------- invoice */

type Line = { description: string; qty: string; price: string; gst: string };
const blankLine = (): Line => ({ description: '', qty: '1', price: '', gst: '18' });
const DEFAULT_DUE = '2026-11-20';
const DEFAULT_NOTES = 'Payment by UPI or bank transfer. Share the transaction reference in the app.';

const lineTotal = (l: Line) => {
  const base = (num(l.qty) || 0) * (num(l.price) || 0);
  return base + (base * (num(l.gst) || 0)) / 100;
};

export function NewInvoiceSheet({ visible, onClose, clientId: fixedClient }: SheetProps & { clientId?: string }) {
  const c = useColors();
  const { state, actions } = useStore();
  const toast = useToast();
  const activeClients = useMemo(() => state.clients.filter((x) => x.status === 'active' || x.id === fixedClient), [state.clients, fixedClient]);
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(DEMO_TODAY);
  const [dueDate, setDueDate] = useState(DEFAULT_DUE);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const [err, setErr] = useState<Record<string, string>>({});
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setClientId(fixedClient ?? '');
    setProjectId('');
    setTitle('');
    setInvoiceDate(DEMO_TODAY);
    setDueDate(DEFAULT_DUE);
    setNotes(DEFAULT_NOTES);
    setLines([blankLine()]);
    setErr({});
    setConfirmIssue(false);
    setBusy(false);
    submitted.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const clearErr = (k: string) => setErr((p) => (p[k] ? { ...p, [k]: '' } : p));
  const clientProjects = useMemo(() => state.projects.filter((p) => p.clientId === clientId), [state.projects, clientId]);
  const items = lines.map((l) => ({ description: l.description.trim(), quantity: num(l.qty) || 0, unitPrice: num(l.price) || 0, taxRate: num(l.gst) || 0 }));
  const totals = invoiceTotals({ items } as never);
  const client = findClient(state, clientId);

  const patchLine = (i: number, patch: Partial<Line>) => {
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
    clearErr('items');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!client) e.client = 'Choose a client.';
    if (projectId && !clientProjects.some((p) => p.id === projectId)) e.project = 'That project belongs to another client.';
    if (!title.trim()) e.title = 'Add an invoice title.';
    if (!isRealDate(invoiceDate)) e.invoiceDate = 'Pick the invoice date.';
    if (!isRealDate(dueDate)) e.dueDate = 'Pick a due date.';
    else if (isRealDate(invoiceDate) && dueDate < invoiceDate) e.dueDate = 'Due date can’t be before the invoice date.';
    const bad = lines.findIndex((l) => !l.description.trim() || !(num(l.price) > 0) || !(num(l.qty) > 0) || num(l.gst) < 0 || num(l.gst) > 100);
    if (bad >= 0) e.items = `Item ${bad + 1} needs a description, a quantity and price above 0, and GST between 0 and 100.`;
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const save = (issue: boolean) => {
    if (submitted.current) return;
    submitted.current = true;
    setBusy(true);
    try {
      const id = actions.createInvoice({
        clientId,
        projectId: projectId || undefined,
        title: title.trim(),
        status: issue ? 'issued' : 'draft',
        issueDate: issue ? invoiceDate : undefined,
        dueDate,
        items,
        notes: notes.trim() || undefined,
      });
      toast(issue ? 'Invoice issued to the client' : 'Draft saved');
      onClose();
      router.push(`/invoice/${id}`);
    } catch {
      submitted.current = false;
      setBusy(false);
      toast('Couldn’t save the invoice. Please try again.');
    }
  };

  const clientItems = activeClients.map((x) => ({ id: x.id, label: x.company, sub: `${x.contactName} · ${x.city}` }));
  const projectItems = clientProjects.map((p) => ({ id: p.id, label: p.name, sub: p.code }));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      icon={FileText}
      title="Create Invoice"
      subtitle="Bill a client for work, with GST per line."
      footer={
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Txt variant="bodySm" tone="muted">
              Total incl. GST
            </Txt>
            <Txt variant="title">{rupees(totals.total)}</Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Save draft" variant="ghost" loading={busy} onPress={() => validate() && save(false)} style={{ flex: 1 }} />
            <Button label="Issue invoice" loading={busy} onPress={() => validate() && setConfirmIssue(true)} style={{ flex: 1 }} />
          </View>
        </>
      }
    >
      <View style={{ gap: 26 }}>
        <Section title="Client">
          <SearchSelect
            items={clientItems}
            value={clientId}
            noun="client"
            emptyText="No active clients yet. Add a client first."
            disabled={!!fixedClient}
            onChange={(id) => {
              setClientId(id);
              clearErr('client');
              if (projectId && !state.projects.some((p) => p.id === projectId && p.clientId === id)) setProjectId('');
            }}
          />
          {err.client ? (
            <Txt variant="caption" tone="danger" accessibilityLiveRegion="polite">
              {err.client}
            </Txt>
          ) : null}
        </Section>

        <Section title="Project" hint="optional">
          {!clientId ? (
            <Txt variant="bodySm" tone="muted">
              Choose a client to see their projects.
            </Txt>
          ) : (
            <SearchSelect
              items={projectItems}
              value={projectId}
              noun="project"
              none={{ label: 'No project', sub: 'General invoice' }}
              emptyText="This client has no projects."
              onChange={(id) => {
                setProjectId(id);
                clearErr('project');
              }}
            />
          )}
          {err.project ? (
            <Txt variant="caption" tone="danger">
              {err.project}
            </Txt>
          ) : null}
        </Section>

        <Section title="Invoice">
          <Field label="Invoice title" value={title} onChangeText={(v) => { setTitle(v); clearErr('title'); }} placeholder="e.g. Backend milestone" error={err.title} maxLength={100} />
          <Panel>
            <SummaryRow label="Invoice number" value="Assigned when saved" />
            <Txt variant="caption" tone="faint">
              Numbers follow the existing VL-INV sequence and are never reused.
            </Txt>
          </Panel>
          <ConfirmDates
            fields={[
              {
                key: 'invoiceDate',
                label: 'Invoice date',
                value: invoiceDate,
                onChange: (v) => {
                  setInvoiceDate(v);
                  clearErr('invoiceDate');
                  if (dueDate && dueDate < v) setDueDate('');
                },
                error: err.invoiceDate,
                placeholder: 'Pick date',
              },
              { key: 'dueDate', label: 'Due date', value: dueDate, onChange: (v) => { setDueDate(v); clearErr('dueDate'); }, min: invoiceDate || undefined, error: err.dueDate, placeholder: 'Pick date' },
            ]}
          />
          <Txt variant="caption" tone="faint">
            The invoice date becomes the issue date when you issue. A draft is dated on the day you issue it.
          </Txt>
        </Section>

        <Section title="Line items" hint={`${lines.length} item${lines.length === 1 ? '' : 's'}`}>
          {lines.map((l, i) => (
            <View key={i} style={{ gap: 10, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.card }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt variant="mono" tone="gold" style={{ fontSize: 10.5, letterSpacing: 1.4 }}>{`ITEM ${i + 1}`}</Txt>
                {lines.length > 1 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove item ${i + 1}`}
                    hitSlop={8}
                    onPress={() => {
                      tap();
                      setLines((ls) => ls.filter((_, j) => j !== i));
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 }}
                  >
                    <Trash2 size={15} color={c.danger} />
                    <Txt variant="caption" tone="danger">
                      Remove
                    </Txt>
                  </Pressable>
                ) : null}
              </View>
              <Field label="Description" value={l.description} onChangeText={(v) => patchLine(i, { description: v })} placeholder="e.g. API development" maxLength={120} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Qty" value={l.qty} onChangeText={(v) => patchLine(i, { qty: cleanAmount(v) })} keyboardType="numeric" maxLength={6} />
                </View>
                <View style={{ flex: 2 }}>
                  <Field label="Unit price" prefix="₹" value={l.price} onChangeText={(v) => patchLine(i, { price: cleanAmount(v) })} keyboardType="numeric" placeholder="0" maxLength={12} />
                </View>
                <View style={{ flex: 1.2 }}>
                  <Field label="GST" suffix="%" value={l.gst} onChangeText={(v) => patchLine(i, { gst: cleanAmount(v) })} keyboardType="numeric" maxLength={5} />
                </View>
              </View>
              <SummaryRow label="Line total incl. GST" value={rupees(lineTotal(l))} />
            </View>
          ))}
          {err.items ? (
            <Txt variant="caption" tone="danger" accessibilityLiveRegion="polite">
              {err.items}
            </Txt>
          ) : null}
          <Button label="Add item" icon={Plus} variant="ghost" size="sm" onPress={() => setLines((ls) => [...ls, blankLine()])} />
        </Section>

        <Section title="Summary">
          <Panel>
            <SummaryRow label="Subtotal" value={rupees(totals.subtotal)} />
            <SummaryRow label="GST" value={rupees(totals.tax)} />
            <View style={{ height: 1, backgroundColor: c.line }} />
            <SummaryRow label="Grand total" value={rupees(totals.total)} strong tone="gold" />
          </Panel>
        </Section>

        <Section title="Notes" hint="optional">
          <Field label="Notes on invoice" value={notes} onChangeText={setNotes} multiline maxLength={500} />
        </Section>
      </View>

      <Confirm
        visible={confirmIssue}
        title="Issue this invoice?"
        body={`${title.trim() || 'Invoice'} for ${client?.company ?? 'the client'}\n${rupees(totals.total)} incl. GST · due ${dueDate ? fmtDMY(dueDate) : '—'}\nThe client will see it straight away.`}
        confirmLabel="Issue invoice"
        onCancel={() => setConfirmIssue(false)}
        onConfirm={() => {
          setConfirmIssue(false);
          save(true);
        }}
      />
    </Sheet>
  );
}

/* ----------------------------------------------------------------- payment */

type Method = Exclude<PaymentMethod, 'online'>;
const METHODS: { value: Method; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
];
const METHOD_ICON: Record<Method, LucideIcon> = { upi: Smartphone, bank_transfer: Landmark, cash: Banknote };
const METHOD_LABEL: Record<Method, string> = { upi: 'UPI', bank_transfer: 'Bank transfer', cash: 'Cash' };

/** Manual payment: clients submit it for verification; admins can record and verify at once. */
export function RecordPaymentSheet({ visible, onClose, invoiceId }: SheetProps & { invoiceId: string }) {
  const { state, actions } = useStore();
  const { user, role } = useMe();
  const toast = useToast();
  const inv = state.invoices.find((i) => i.id === invoiceId);
  const bal = useMemo(() => (inv ? invoiceBalance(state, inv) : null), [inv, state]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Method>('upi');
  const [paidOn, setPaidOn] = useState(DEMO_TODAY);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState<PickedFile[]>([]);
  const [verifyNow, setVerifyNow] = useState(true);
  const [err, setErr] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  const verifying = role === 'admin' && verifyNow;
  // Same room rule the store enforces: unverified payments also have to fit beside what is pending.
  const room = bal ? Math.max(0, bal.balance - (verifying ? 0 : bal.pending)) : 0;

  useEffect(() => {
    if (!visible || !bal) return;
    const open = Math.max(0, bal.balance - (role === 'admin' ? 0 : bal.pending));
    setAmount(open ? String(open) : '');
    setMethod('upi');
    setPaidOn(DEMO_TODAY);
    setReference('');
    setNote('');
    setProof([]);
    setVerifyNow(true);
    setErr({});
    setConfirming(false);
    setBusy(false);
    submitted.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!inv || !bal) return null;
  const client = findClient(state, inv.clientId);
  const value = num(amount);
  const remaining = Math.max(0, bal.balance - (value > 0 ? value : 0));
  const refLabel = method === 'upi' ? 'UPI transaction ID' : method === 'bank_transfer' ? 'Bank reference / UTR' : 'Received by';
  const clearErr = (k: string) => setErr((p) => (p[k] ? { ...p, [k]: '' } : p));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!(value > 0)) e.amount = 'Enter the amount paid.';
    else if (value > room + 0.001) e.amount = `That is more than the balance still open (${rupees(room)}).`;
    if (!isRealDate(paidOn)) e.paidOn = 'Pick the payment date.';
    else if (paidOn > DEMO_TODAY) e.paidOn = 'A payment can’t be dated in the future.';
    else if (inv.issueDate && paidOn < inv.issueDate) e.paidOn = 'A payment can’t be dated before the invoice was issued.';
    if (method !== 'cash' && reference.trim().length < 6) e.reference = method === 'upi' ? 'Add the UPI transaction ID (at least 6 characters).' : 'Add the bank UTR / reference (at least 6 characters).';
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (submitted.current) return;
    submitted.current = true;
    setBusy(true);
    const res = actions.recordPayment(
      { invoiceId, amount: value, method, paidOn, reference: reference.trim() || undefined, note: note.trim() || undefined, proofName: proof[0]?.name },
      user.id,
      verifying
    );
    if (!res.ok) {
      submitted.current = false;
      setBusy(false);
      setErr({ amount: res.error });
      return;
    }
    toast(verifying ? 'Payment recorded and verified' : 'Payment submitted. We will verify it shortly.');
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      icon={Wallet}
      title={role === 'admin' ? 'Record Payment' : 'Submit Payment'}
      subtitle={role === 'admin' ? 'Log money received against this invoice.' : 'Tell us about the payment you made.'}
      footer={<Button label={role === 'admin' ? 'Review & save' : 'Review & submit'} full loading={busy} onPress={() => validate() && setConfirming(true)} />}
    >
      <View style={{ gap: 26 }}>
        <Section title="Invoice">
          <Panel>
            <SummaryRow label="Invoice" value={inv.number} />
            <SummaryRow label="Client" value={client?.company ?? '—'} />
            <SummaryRow label="Invoice amount" value={rupees(bal.total)} />
            <SummaryRow label="Paid (verified)" value={rupees(bal.paid)} tone="success" />
            {bal.pending > 0 ? <SummaryRow label="Awaiting verification" value={rupees(bal.pending)} tone="gold" /> : null}
            <View style={{ height: 1 }} />
            <SummaryRow label="Outstanding balance" value={rupees(bal.balance)} strong tone={bal.balance > 0 ? 'gold' : 'success'} />
          </Panel>
          {role === 'client' ? (
            <Card padding={16}>
              <Txt variant="monoSm" tone="gold">
                Pay Varuag Labs (demo details)
              </Txt>
              <Txt variant="bodySm" style={{ marginTop: 8 }}>
                UPI ID: varuaglabs@demo-upi
              </Txt>
              <Txt variant="bodySm">Bank: Demo Bank · A/c 0000 0000 0000 · IFSC DEMO0000001</Txt>
              <Txt variant="caption" tone="faint" style={{ marginTop: 6 }}>
                Pay first, then submit the details here. Online payment will be added later.
              </Txt>
            </Card>
          ) : null}
        </Section>

        <Section title="Amount">
          <Field label="Amount paid" prefix="₹" value={amount} onChangeText={(v) => { setAmount(cleanAmount(v)); clearErr('amount'); }} keyboardType="numeric" placeholder="0" error={err.amount} maxLength={12} />
          <Panel>
            <SummaryRow label="You are paying" value={value > 0 ? rupees(value) : '—'} />
            <SummaryRow label="Balance left after this" value={rupees(remaining)} tone={remaining === 0 && value > 0 ? 'success' : undefined} />
            <Txt variant="caption" tone="faint">
              {verifying ? 'Partial payments are fine. The balance only drops once a payment is verified.' : 'Partial payments are fine. The balance drops once an admin verifies this payment.'}
            </Txt>
          </Panel>
        </Section>

        <Section title="Method">
          <PriorityPicker value={method} onChange={(m) => { setMethod(m); clearErr('reference'); }} options={METHODS} />
          <Field
            label={refLabel}
            hint={method === 'cash' ? 'optional' : undefined}
            value={reference}
            onChangeText={(v) => { setReference(v); clearErr('reference'); }}
            autoCapitalize="none"
            placeholder={method === 'upi' ? 'e.g. 4021 7781 1123' : method === 'bank_transfer' ? 'e.g. UTR 4022 1094 5510' : 'Who handed over the cash'}
            error={err.reference}
            maxLength={60}
          />
          {role === 'client' ? <FilePicker files={proof} onChange={(f) => setProof(f.slice(-1))} label="Payment screenshot (optional)" /> : null}
        </Section>

        <Section title="Payment date">
          <ConfirmDates fields={[{ key: 'paidOn', label: 'Paid on', value: paidOn, onChange: (v) => { setPaidOn(v); clearErr('paidOn'); }, min: inv.issueDate, error: err.paidOn, placeholder: 'Pick date' }]} />
        </Section>

        <Section title="Note" hint="optional">
          <Field label="Note" value={note} onChangeText={setNote} multiline placeholder="Anything we should know about this payment" maxLength={300} />
        </Section>

        {role === 'admin' ? (
          <Section title="Verification">
            <Card padding={0}>
              <SwitchRow label="Mark as verified now" description="Issues a receipt number and reduces the balance immediately." value={verifyNow} onValueChange={setVerifyNow} />
            </Card>
          </Section>
        ) : null}
      </View>

      <Confirm
        visible={confirming}
        title={role === 'admin' ? 'Save this payment?' : 'Submit this payment?'}
        body={`${inv.number} · ${rupees(value)}\n${METHOD_LABEL[method]} on ${isRealDate(paidOn) ? fmtDMY(paidOn) : '—'}${reference.trim() ? `\nRef ${reference.trim()}` : ''}\n${verifying ? 'It will be verified now and a receipt issued.' : 'It will wait for admin verification.'}`}
        confirmLabel={role === 'admin' ? 'Save' : 'Submit'}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          save();
        }}
      />
    </Sheet>
  );
}

/* ----------------------------------------------------------------- expense */

const CATEGORIES: { value: string; icon: LucideIcon }[] = [
  { value: 'Software', icon: Code },
  { value: 'Hosting', icon: Server },
  { value: 'Domain', icon: Globe },
  { value: 'Travel', icon: Plane },
  { value: 'Other', icon: Cloud },
];

export function NewExpenseSheet({ visible, onClose }: SheetProps) {
  const c = useColors();
  const { state, actions } = useStore();
  const toast = useToast();
  const [category, setCategory] = useState('Software');
  const [custom, setCustom] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(DEMO_TODAY);
  const [projectId, setProjectId] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setCategory('Software');
    setCustom('');
    setDescription('');
    setAmount('');
    setDate(DEMO_TODAY);
    setProjectId('');
    setErr({});
    setBusy(false);
    submitted.current = false;
  }, [visible]);

  const clearErr = (k: string) => setErr((p) => (p[k] ? { ...p, [k]: '' } : p));
  const finalCategory = category === 'Other' && custom.trim() ? custom.trim() : category;
  const value = num(amount);
  const project = state.projects.find((p) => p.id === projectId);
  const projectItems = state.projects.map((p) => ({ id: p.id, label: p.name, sub: findClient(state, p.clientId)?.company }));

  const save = () => {
    if (submitted.current) return;
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = 'Describe the expense.';
    if (!(value > 0)) e.amount = 'Enter an amount above 0.';
    if (!isRealDate(date)) e.date = 'Pick the expense date.';
    else if (date > DEMO_TODAY) e.date = 'An expense can’t be dated in the future.';
    setErr(e);
    if (Object.keys(e).length) return;
    submitted.current = true;
    setBusy(true);
    try {
      actions.createExpense({ category: finalCategory, description: description.trim(), amount: value, date, projectId: projectId || undefined });
      toast('Expense logged for approval');
      onClose();
    } catch {
      submitted.current = false;
      setBusy(false);
      toast('Couldn’t save the expense. Please try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      icon={Receipt}
      title="Log Expense"
      subtitle="Record a business cost for approval."
      footer={<Button label="Save expense" full loading={busy} onPress={save} />}
    >
      <View style={{ gap: 26 }}>
        <Section title="Category">
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <Pressable
                  key={cat.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={cat.value}
                  onPress={() => {
                    tap();
                    setCategory(cat.value);
                  }}
                  style={{ width: '48.5%', minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: active ? c.gold : c.line, backgroundColor: active ? c.goldTint : 'transparent' }}
                >
                  <cat.icon size={18} color={active ? c.gold : c.muted} strokeWidth={1.8} />
                  <Txt variant="bodySm" weight={active ? 'semibold' : 'medium'} tone={active ? 'gold' : 'fg'} numberOfLines={1}>
                    {cat.value}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          {category === 'Other' ? (
            <Field label="Custom category" hint="optional" value={custom} onChangeText={setCustom} placeholder="e.g. Stationery" maxLength={30} />
          ) : null}
        </Section>

        <Section title="Expense">
          <Field label="Description" value={description} onChangeText={(v) => { setDescription(v); clearErr('description'); }} placeholder="e.g. Figma team plan, November" error={err.description} maxLength={120} />
        </Section>

        <Section title="Amount">
          <Field label="Amount" prefix="₹" value={amount} onChangeText={(v) => { setAmount(cleanAmount(v)); clearErr('amount'); }} keyboardType="numeric" placeholder="0" error={err.amount} maxLength={12} />
          {value > 0 ? (
            <Txt variant="caption" tone="faint">
              {`${rupees(value)} · logged as entered. No separate GST is tracked on expenses.`}
            </Txt>
          ) : null}
        </Section>

        <Section title="Date">
          <ConfirmDates fields={[{ key: 'date', label: 'Expense date', value: date, onChange: (v) => { setDate(v); clearErr('date'); }, error: err.date, placeholder: 'Pick date' }]} />
        </Section>

        <Section title="Project" hint="optional">
          <SearchSelect items={projectItems} value={projectId} noun="project" none={{ label: 'General', sub: 'Not tied to a project' }} emptyText="No projects yet." onChange={setProjectId} />
        </Section>

        <Section title="Summary">
          <Panel>
            <SummaryRow label="Amount" value={value > 0 ? rupees(value) : '—'} strong tone="gold" />
            <SummaryRow label="Category" value={finalCategory} />
            <SummaryRow label="Date" value={isRealDate(date) ? fmtDMY(date) : '—'} />
            <SummaryRow label="Project" value={project?.name ?? 'General'} />
            <Txt variant="caption" tone="faint">
              Receipts can’t be attached yet: the app has no file storage until the backend is connected.
            </Txt>
          </Panel>
        </Section>
      </View>
    </Sheet>
  );
}
