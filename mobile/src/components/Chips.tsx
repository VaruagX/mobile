import { Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useColors } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { Txt } from './Txt';
import { tap } from '@/lib/haptics';
import { statusMeta } from '@/lib/status';

export type ChipTone = 'neutral' | 'gold' | 'blue' | 'danger' | 'success';

/** Website .chip: mono pill with hairline border. */
export function Chip({
  label,
  tone = 'neutral',
  dot,
  icon: Icon,
  style,
}: {
  label: string;
  tone?: ChipTone;
  dot?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const map = {
    neutral: { fg: c.muted, border: c.line, dot: c.faint },
    gold: { fg: c.goldText, border: c.goldBorder, dot: c.gold },
    blue: { fg: c.blueText, border: c.line, dot: c.blue },
    danger: { fg: c.danger, border: c.line, dot: c.danger },
    success: { fg: c.success, border: c.line, dot: c.success },
  }[tone];
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: map.border,
          backgroundColor: c.glass,
        },
        style,
      ]}
    >
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: map.dot }} /> : null}
      {Icon ? <Icon size={12} color={map.fg} strokeWidth={1.8} /> : null}
      <Txt style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.55, color: map.fg }} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

export function StatusChip({ status }: { status: string }) {
  const meta = statusMeta(status);
  return <Chip label={meta.label} tone={meta.tone} dot={meta.tone !== 'neutral'} />;
}

export function DemoBadge({ compact }: { compact?: boolean }) {
  return <Chip label={compact ? 'Demo' : 'Demo data'} tone="blue" dot />;
}

export type Option<T extends string> = { value: T; label: string; count?: number };

/** Horizontal filter pills. Active pill uses the website's gold-on-tint hover state. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0 }, style]}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={{
              minHeight: 36,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: active ? c.goldBorder : c.line,
              backgroundColor: active ? c.goldTint : c.glass,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Txt variant="bodySm" weight={active ? 'semibold' : 'medium'} tone={active ? 'gold' : 'muted'}>
              {o.label}
            </Txt>
            {o.count != null ? (
              <Txt variant="monoSm" tone={active ? 'gold' : 'faint'} style={{ letterSpacing: 0.4 }}>
                {String(o.count)}
              </Txt>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Segmented tabs inside a screen (e.g. Invoices | Payments | Expenses). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        { flexDirection: 'row', padding: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.glass },
        style,
      ]}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? c.card2 : 'transparent',
              borderWidth: 1,
              borderColor: active ? c.lineStrong : 'transparent',
            }}
          >
            <Txt variant="bodySm" weight={active ? 'semibold' : 'medium'} tone={active ? 'fg' : 'muted'} numberOfLines={1}>
              {o.label}
              {o.count != null ? <Txt variant="bodySm" tone="gold">{`  ${o.count}`}</Txt> : null}
            </Txt>
            {active ? <View style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold }} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
