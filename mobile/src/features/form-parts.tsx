import { useState, type ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Search, X, type LucideIcon } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { DEMO_TODAY, fmtDate, initials, pad2 } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { useColors } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

export const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
export const num = (s: string) => Number.parseFloat(s.replace(/[,₹\s]/g, ''));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** DD MMM YYYY, e.g. 05 Nov 2026. */
export const fmtDMY = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${pad2(d)} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
};

/** True only for real calendar dates (rejects 2026-02-31). */
export const isRealDate = (s: string) => {
  if (!isDate(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d;
};

/* ------------------------------------------------------------- building blocks */

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Txt variant="mono" tone="gold" style={{ fontSize: 10.5, letterSpacing: 1.6 }}>
          {title.toUpperCase()}
        </Txt>
        <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        {hint ? (
          <Txt variant="caption" tone="faint">
            {hint}
          </Txt>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function SearchBox({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.bg2 }}>
      <Search size={16} color={c.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.faint}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ flex: 1, color: c.fg, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 10 }}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => onChangeText('')}>
          <X size={16} color={c.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** One selectable row (client / team member). */
export function PickRow({ label, sub, selected, onPress, role }: { label: string; sub?: string; selected: boolean; onPress: () => void; role: 'radio' | 'checkbox' }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingHorizontal: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? c.gold : c.line,
        backgroundColor: selected ? c.goldTint : pressed ? c.card : 'transparent',
      })}
    >
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card2, borderWidth: 1, borderColor: c.line }}>
        <Txt variant="caption" weight="semibold" tone={selected ? 'gold' : 'muted'} style={{ fontSize: 11 }}>
          {initials(label)}
        </Txt>
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodySm" weight="semibold" numberOfLines={1}>
          {label}
        </Txt>
        {sub ? (
          <Txt variant="caption" tone="muted" numberOfLines={1}>
            {sub}
          </Txt>
        ) : null}
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: role === 'radio' ? 11 : 6,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: selected ? c.gold : c.lineStrong,
          backgroundColor: selected ? c.gold : 'transparent',
        }}
      >
        {selected ? <Check size={13} color={c.onGold} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 20, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong }}>
      <Icon size={20} color={c.muted} strokeWidth={1.6} />
      <Txt variant="bodySm" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 16 }}>
        {text}
      </Txt>
    </View>
  );
}

/* ------------------------------------------------------------------- calendar */

export const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};
export const toIso = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;

/** Date button; the calendar itself renders full-width under the pair (see Timeline). */
export function DateField({ label, value, open, onPress, error, placeholder }: { label: string; value: string; open: boolean; onPress: () => void; error?: string; placeholder: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Txt variant="bodySm" weight="medium">
        {label}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} date, ${value ? fmtDMY(value) : 'not set'}`}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          tap();
          onPress();
        }}
        style={{
          minHeight: 50,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? c.danger : open ? c.gold : c.lineStrong,
          backgroundColor: c.bg2,
        }}
      >
        <CalendarIcon size={16} color={value ? c.gold : c.muted} />
        <Txt variant="bodySm" weight={value ? 'medium' : 'regular'} tone={value ? 'fg' : 'faint'} numberOfLines={1} style={{ flex: 1 }}>
          {value ? fmtDMY(value) : placeholder}
        </Txt>
      </Pressable>
      {error ? (
        <Txt variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

export function CalendarPanel({ value, min, onPick }: { value: string; min?: string; onPick: (iso: string) => void }) {
  const c = useColors();
  const seed = parts(isDate(value) ? value : min && isDate(min) ? min : DEMO_TODAY);
  const [view, setView] = useState({ y: seed.y, m: seed.m });
  const first = new Date(view.y, view.m - 1, 1).getDay();
  const days = new Date(view.y, view.m, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const shift = (delta: number) =>
    setView((v) => {
      const t = v.m - 1 + delta;
      return { y: v.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 + 1 };
    });
  return (
    <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.card, padding: 10, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={8} onPress={() => shift(-1)} style={{ padding: 6 }}>
          <ChevronLeft size={18} color={c.fg} />
        </Pressable>
        <Txt variant="bodySm" weight="semibold">{`${MONTHS[view.m - 1]} ${view.y}`}</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={8} onPress={() => shift(1)} style={{ padding: 6 }}>
          <ChevronRight size={18} color={c.fg} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {DOW.map((d, i) => (
          <Txt key={i} variant="caption" tone="faint" style={{ flex: 1, textAlign: 'center' }}>
            {d}
          </Txt>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={{ flex: 1, height: 36 }} />;
            const iso = toIso(view.y, view.m, d);
            const disabled = !!min && iso < min;
            const selected = iso === value;
            const today = iso === DEMO_TODAY;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={fmtDate(iso, true)}
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => {
                  tap();
                  onPick(iso);
                }}
                style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? c.gold : 'transparent',
                    borderWidth: today && !selected ? 1 : 0,
                    borderColor: c.goldBorder,
                    opacity: disabled ? 0.3 : 1,
                  }}
                >
                  <Txt variant="bodySm" weight={selected ? 'semibold' : 'regular'} style={{ color: selected ? c.onGold : c.fg }}>
                    {String(d)}
                  </Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}


/** One date in a ConfirmDates group. */
export type DateSpec = {
  key: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  error?: string;
  placeholder: string;
  /** Optional dates get a Clear action. */
  clearable?: boolean;
};

/**
 * Date buttons that open one calendar panel with Cancel / Confirm. Nothing is written to the
 * form until Confirm is pressed, and reopening starts from the saved date.
 */
export function ConfirmDates({ fields }: { fields: DateSpec[] }) {
  const c = useColors();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const active = fields.find((f) => f.key === openKey);
  const toggle = (f: DateSpec) => {
    if (openKey === f.key) return setOpenKey(null);
    setDraft(f.value);
    setOpenKey(f.key);
  };
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        {fields.map((f) => (
          <DateField key={f.key} label={f.label} value={f.value} placeholder={f.placeholder} error={f.error} open={openKey === f.key} onPress={() => toggle(f)} />
        ))}
      </View>
      {active ? (
        <View style={{ gap: 10 }}>
          <CalendarPanel key={active.key} value={draft} min={active.min} onPick={setDraft} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancel" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setOpenKey(null)} />
            {active.clearable && active.value ? (
              <Button
                label="Clear"
                variant="ghost"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => {
                  active.onChange('');
                  setOpenKey(null);
                }}
              />
            ) : null}
            <Button
              label={draft ? `Confirm ${fmtDMY(draft)}` : 'Confirm'}
              size="sm"
              disabled={!draft}
              style={{ flex: 2 }}
              onPress={() => {
                active.onChange(draft);
                setOpenKey(null);
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

/** Compact segmented priority control (same look as the Create Project form). */
export function PriorityPicker<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[] }) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', padding: 4, gap: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg2 }}>
      {options.map((p) => {
        const active = value === p.value;
        return (
          <Pressable
            key={p.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={`${p.label} priority`}
            onPress={() => {
              tap();
              onChange(p.value);
            }}
            style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: active ? c.goldBorder : 'transparent', backgroundColor: active ? c.goldTint : 'transparent' }}
          >
            <Txt variant="bodySm" weight={active ? 'semibold' : 'medium'} tone={active ? 'gold' : 'muted'} style={{ fontSize: 13 }} numberOfLines={1}>
              {p.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Relative-weight readout: existing total, new total and this item's share. */
export function WeightNote({ existing, adding, noun }: { existing: number; adding: number; noun: string }) {
  const c = useColors();
  const valid = adding > 0;
  const total = existing + (valid ? adding : 0);
  const share = valid && total ? Math.round((100 * adding) / total) : 0;
  const over = total > 100;
  return (
    <View style={{ gap: 6, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: over ? c.goldBorder : c.line, backgroundColor: over ? c.goldTint : c.bg2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="caption" tone="muted">{`Existing total · ${existing}`}</Txt>
        <Txt variant="caption" tone="muted">{`New total · ${total}`}</Txt>
      </View>
      <Txt variant="bodySm" weight="medium">
        {valid ? `This ${noun} will be about ${share}% of the total weight.` : 'Enter a weight above 0.'}
      </Txt>
      <Txt variant="caption" tone={over ? 'gold' : 'faint'}>
        {over
          ? 'The total is above 100. Progress still works because weights are relative, but check that this is intended.'
          : 'Weights are relative, so they do not need to add up to 100. Other weights are never changed.'}
      </Txt>
    </View>
  );
}

/** Digits and one decimal point only (amounts, GST %, quantities). */
export const cleanAmount = (v: string) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

export type SelectItem = { id: string; label: string; sub?: string };

/**
 * Searchable single-select. Shows a compact "selected" card with a Change action; Change opens a
 * search box and the list. Case-insensitive search by label. `none` adds a "no selection" row
 * (e.g. General / No project) when that is a valid choice.
 */
export function SearchSelect({
  items,
  value,
  onChange,
  noun,
  none,
  emptyText,
  disabled,
}: {
  items: SelectItem[];
  value: string;
  onChange: (id: string) => void;
  noun: string;
  none?: { label: string; sub?: string };
  emptyText: string;
  disabled?: boolean;
}) {
  const c = useColors();
  const [changing, setChanging] = useState(false);
  const [q, setQ] = useState('');
  const selected: SelectItem | undefined = items.find((i) => i.id === value) ?? (none && value === '' ? { id: '', label: none.label, sub: none.sub } : undefined);
  const choose = (id: string) => {
    onChange(id);
    setChanging(false);
    setQ('');
  };

  if (selected && !changing) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: c.gold, backgroundColor: c.goldTint }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card2, borderWidth: 1, borderColor: c.line }}>
          <Check size={15} color={c.gold} strokeWidth={3} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodySm" weight="semibold" numberOfLines={1}>
            {selected.label}
          </Txt>
          {selected.sub ? (
            <Txt variant="caption" tone="muted" numberOfLines={1}>
              {selected.sub}
            </Txt>
          ) : null}
        </View>
        {!disabled ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Change ${noun}`} hitSlop={8} onPress={() => setChanging(true)} style={{ paddingHorizontal: 10, minHeight: 34, justifyContent: 'center' }}>
            <Txt variant="bodySm" weight="semibold" tone="gold">
              Change
            </Txt>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const shown = items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <View style={{ gap: 10 }}>
      {items.length === 0 && !none ? (
        <EmptyState icon={Search} text={emptyText} />
      ) : (
        <>
          <SearchBox value={q} onChangeText={setQ} placeholder={`Search ${noun}s...`} />
          <View style={{ gap: 8 }} accessibilityRole="radiogroup">
            {none && !q.trim() ? <PickRow role="radio" label={none.label} sub={none.sub} selected={value === ''} onPress={() => choose('')} /> : null}
            {shown.length === 0 ? (
              <EmptyState icon={Search} text={items.length === 0 ? emptyText : `No ${noun}s found`} />
            ) : (
              shown.map((i) => <PickRow key={i.id} role="radio" label={i.label} sub={i.sub} selected={value === i.id} onPress={() => choose(i.id)} />)
            )}
          </View>
          {selected ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Keep current selection" onPress={() => setChanging(false)} style={{ alignSelf: 'flex-start', minHeight: 34, justifyContent: 'center' }}>
              <Txt variant="bodySm" tone="muted">
                Keep {selected.label}
              </Txt>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}
