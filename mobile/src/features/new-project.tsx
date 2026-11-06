import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  Building2,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Globe,
  Layers,
  Palette,
  Search,
  Smartphone,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Field, Sheet } from '@/components/Form';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { useStore } from '@/store/DemoStore';
import { useMe } from '@/store/Session';
import type { Priority } from '@/data/types';
import { DEMO_TODAY, fmtDate, initials, pad2 } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { useColors } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { CalendarPanel, DateField, EmptyState, PickRow, SearchBox, Section, isDate, num } from './form-parts';

type SheetProps = { visible: boolean; onClose: () => void };


/** Same category strings the store and project screens already use. */
const TYPES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'Website', label: 'Website', icon: Globe },
  { value: 'Web app', label: 'Web App', icon: Layers },
  { value: 'Mobile app', label: 'Mobile App', icon: Smartphone },
  { value: 'Branding', label: 'Branding', icon: Palette },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];


const blank = (clientId: string) => ({
  name: '',
  description: '',
  clientId,
  category: 'Website',
  priority: 'medium' as Priority,
  startDate: DEMO_TODAY,
  dueDate: '',
  budget: '',
  members: [] as string[],
});

/* ---------------------------------------------------------------------- sheet */

export function NewProjectSheet({ visible, onClose }: SheetProps) {
  const c = useColors();
  const { state, actions } = useStore();
  const { user } = useMe();
  const toast = useToast();
  const clients = useMemo(() => state.clients.filter((x) => x.status === 'active'), [state.clients]);
  const team = useMemo(() => state.users.filter((u) => u.role === 'team' && u.status === 'active'), [state.users]);
  const [f, setF] = useState(() => blank(state.clients[0]?.id ?? ''));
  const [err, setErr] = useState<Record<string, string>>({});
  const [clientQ, setClientQ] = useState('');
  const [teamQ, setTeamQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [cal, setCal] = useState<'startDate' | 'dueDate' | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setF(blank(state.clients[0]?.id ?? ''));
    setErr({});
    setClientQ('');
    setTeamQ('');
    setBusy(false);
    setCal(null);
    submitted.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => (p[k] ? { ...p, [k]: '' } : p));
  };

  const shownClients = clients.filter((x) => x.company.toLowerCase().includes(clientQ.trim().toLowerCase()));
  const shownTeam = team.filter((u) => u.name.toLowerCase().includes(teamQ.trim().toLowerCase()));
  const selectedMembers = team.filter((u) => f.members.includes(u.id));

  const save = () => {
    if (submitted.current) return;
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Give the project a name.';
    if (!f.clientId) e.clientId = 'Choose a client.';
    if (!isDate(f.startDate)) e.startDate = 'Pick a start date.';
    if (!isDate(f.dueDate)) e.dueDate = 'Pick a due date.';
    else if (isDate(f.startDate) && f.dueDate < f.startDate) e.dueDate = 'Due date can’t be before the start date.';
    if (f.budget.trim() && !(num(f.budget) >= 0)) e.budget = 'Enter a valid amount.';
    setErr(e);
    if (Object.keys(e).length) return;
    submitted.current = true;
    setBusy(true);
    try {
      const id = actions.createProject({
        name: f.name.trim(),
        clientId: f.clientId,
        category: f.category,
        priority: f.priority,
        startDate: f.startDate,
        dueDate: f.dueDate,
        budget: f.budget.trim() ? num(f.budget) : undefined,
        description: f.description.trim(),
        memberIds: f.members,
        managerId: user.id,
        status: 'planning',
      });
      toast('Project created. Add milestones next.');
      onClose();
      router.push(`/project/${id}?tab=milestones`);
    } catch {
      submitted.current = false;
      setBusy(false);
      toast('Couldn’t create the project. Please try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      icon={FolderPlus}
      title="Create New Project"
      subtitle="Set up the basics, then add milestones."
      footer={<Button label="Create project" full loading={busy} onPress={save} />}
    >
      <View style={{ gap: 26 }}>
        <Section title="Project">
          <Field label="Project name" value={f.name} onChangeText={(v) => set('name', v)} placeholder="e.g. Clinic booking app" error={err.name} maxLength={80} />
          <Field label="Description" hint="optional" value={f.description} onChangeText={(v) => set('description', v)} multiline placeholder="What are we building, and for whom?" maxLength={500} />
        </Section>

        <Section title="Client" hint={clients.length ? `${clients.length} active` : undefined}>
          {clients.length === 0 ? (
            <EmptyState icon={Building2} text="No active clients yet. Add a client from the People tab first." />
          ) : (
            <>
              <SearchBox value={clientQ} onChangeText={setClientQ} placeholder="Search clients..." />
              <View style={{ gap: 8 }} accessibilityRole="radiogroup">
                {shownClients.length === 0 ? (
                  <EmptyState icon={Search} text="No clients found" />
                ) : (
                  shownClients.map((x) => (
                    <PickRow key={x.id} role="radio" label={x.company} sub={`${x.contactName} · ${x.city}`} selected={f.clientId === x.id} onPress={() => set('clientId', x.id)} />
                  ))
                )}
              </View>
            </>
          )}
          {err.clientId ? (
            <Txt variant="caption" tone="danger" accessibilityLiveRegion="polite">
              {err.clientId}
            </Txt>
          ) : null}
        </Section>

        <Section title="Type">
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map((t) => {
              const active = f.category === t.value;
              return (
                <Pressable
                  key={t.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={t.label}
                  onPress={() => {
                    tap();
                    set('category', t.value);
                  }}
                  style={{
                    width: '48.5%',
                    minHeight: 48,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 12,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: active ? c.gold : c.line,
                    backgroundColor: active ? c.goldTint : 'transparent',
                  }}
                >
                  <t.icon size={18} color={active ? c.gold : c.muted} strokeWidth={1.8} />
                  <Txt variant="bodySm" weight={active ? 'semibold' : 'medium'} tone={active ? 'gold' : 'fg'} numberOfLines={1}>
                    {t.label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Priority">
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', padding: 4, gap: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg2 }}>
            {PRIORITIES.map((p) => {
              const active = f.priority === p.value;
              return (
                <Pressable
                  key={p.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`${p.label} priority`}
                  onPress={() => {
                    tap();
                    set('priority', p.value);
                  }}
                  style={{
                    flex: 1,
                    minHeight: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: active ? c.goldBorder : 'transparent',
                    backgroundColor: active ? c.goldTint : 'transparent',
                  }}
                >
                  <Txt variant="bodySm" weight={active ? 'semibold' : 'medium'} tone={active ? 'gold' : 'muted'} style={{ fontSize: 13 }} numberOfLines={1}>
                    {p.label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Timeline">
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <DateField label="Start" value={f.startDate} placeholder="Pick date" error={err.startDate} open={cal === 'startDate'} onPress={() => setCal(cal === 'startDate' ? null : 'startDate')} />
            <DateField label="Due" value={f.dueDate} placeholder="Pick date" error={err.dueDate} open={cal === 'dueDate'} onPress={() => setCal(cal === 'dueDate' ? null : 'dueDate')} />
          </View>
          {cal ? (
            <CalendarPanel
              key={cal}
              value={f[cal]}
              min={cal === 'dueDate' && isDate(f.startDate) ? f.startDate : undefined}
              onPick={(iso) => {
                set(cal, iso);
                if (cal === 'startDate' && f.dueDate && f.dueDate < iso) set('dueDate', '');
                setCal(null);
              }}
            />
          ) : null}
        </Section>

        <Section title="Budget">
          <Field label="Budget" hint="optional" prefix="₹" value={f.budget} onChangeText={(v) => set('budget', v.replace(/[^0-9.,]/g, ''))} keyboardType="numeric" placeholder="e.g. 250000" error={err.budget} />
        </Section>

        <Section title="Team" hint={f.members.length ? `${f.members.length} selected` : 'optional'}>
          {team.length === 0 ? (
            <EmptyState icon={Users} text="No active team members to assign yet." />
          ) : (
            <>
              {selectedMembers.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {selectedMembers.map((u) => (
                    <Pressable
                      key={u.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${u.name}`}
                      onPress={() => {
                        tap();
                        set('members', f.members.filter((id) => id !== u.id));
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingLeft: 12, paddingRight: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: c.goldBorder, backgroundColor: c.goldTint }}
                    >
                      <Txt variant="caption" weight="semibold" tone="gold">
                        {u.name}
                      </Txt>
                      <X size={13} color={c.gold} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <SearchBox value={teamQ} onChangeText={setTeamQ} placeholder="Search team members..." />
              <View style={{ gap: 8 }}>
                {shownTeam.length === 0 ? (
                  <EmptyState icon={Search} text="No team members found" />
                ) : (
                  shownTeam.map((u) => {
                    const on = f.members.includes(u.id);
                    return (
                      <PickRow
                        key={u.id}
                        role="checkbox"
                        label={u.name}
                        sub={u.jobTitle}
                        selected={on}
                        onPress={() => set('members', on ? f.members.filter((id) => id !== u.id) : [...f.members, u.id])}
                      />
                    );
                  })
                )}
              </View>
            </>
          )}
        </Section>
      </View>
    </Sheet>
  );
}
