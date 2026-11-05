import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, ChevronRight, Moon, Sun, type LucideIcon } from 'lucide-react-native';
import { useColors, useTheme } from '@/theme/ThemeProvider';
import { TAB_BAR_SPACE, fonts, radius, space } from '@/theme/tokens';
import { useSession } from '@/store/Session';
import { useStore } from '@/store/DemoStore';
import { initials } from '@/lib/format';
import { Ambient, GoldRule, GridBackground } from './Backgrounds';
import { IconButton, LinkText } from './Button';
import { DemoBadge } from './Chips';
import { Logo } from './Brand';
import { IconTile } from './Surface';
import { Serif, Txt } from './Txt';
import { tap } from '@/lib/haptics';

/** Screen shell: background, ambient glow, optional fixed header, scrolling body. */
export function Screen({
  children,
  header,
  tabBar,
  grid,
  scroll = true,
  footer,
  contentStyle,
}: {
  children: ReactNode;
  header?: ReactNode;
  tabBar?: boolean;
  grid?: boolean;
  scroll?: boolean;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const bottom = (tabBar ? TAB_BAR_SPACE : 32) + insets.bottom;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Ambient />
      {grid ? <GridBackground style={{ height: 520 }} /> : null}
      {header}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[{ paddingBottom: footer ? 24 : bottom }, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
        )}
        {footer ? (
          <View style={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 12 + insets.bottom, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.header }}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

/** Website site-header translated: logo, demo badge, theme toggle, notifications. */
export function BrandHeader() {
  const c = useColors();
  const { name, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { state } = useStore();
  const unread = user ? state.notifications.filter((n) => n.userId === user.id && !n.read).length : 0;
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: c.header,
        borderBottomWidth: 1,
        borderBottomColor: c.line,
        zIndex: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
        <Logo height={24} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <DemoBadge compact />
        <IconButton icon={name === 'dark' ? Sun : Moon} label={name === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onPress={toggle} />
        {user ? <IconButton icon={Bell} label="Notifications" badge={unread} onPress={() => router.push('/notifications')} /> : null}
      </View>
    </View>
  );
}

/** Header for pushed screens: back button, eyebrow + title, optional action. */
export function ScreenHeader({ title, eyebrow, right, onBack }: { title: string; eyebrow?: string; right?: ReactNode; onBack?: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: c.header,
        borderBottomWidth: 1,
        borderBottomColor: c.line,
        zIndex: 2,
      }}
    >
      <IconButton
        icon={ArrowLeft}
        label="Back"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? (
          <Txt variant="monoSm" tone="gold" numberOfLines={1}>
            {eyebrow}
          </Txt>
        ) : null}
        <Txt variant="title" numberOfLines={1} accessibilityRole="header">
          {title}
        </Txt>
      </View>
      {right}
    </View>
  );
}

/** Website .eyebrow: gold rule + mono uppercase label. */
export function Eyebrow({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'gold' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <GoldRule />
      <Txt variant="eyebrow" tone={tone} weight="medium" style={{ flexShrink: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

/** Numbered section header in the website's "01 — Leadership" style. */
export function SectionHeader({
  index,
  label,
  title,
  accent,
  action,
  style,
}: {
  index?: string;
  label: string;
  title?: string;
  accent?: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ paddingHorizontal: space.gutter }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexShrink: 1 }}>
          <Eyebrow>{index ? `${index} — ${label}` : label}</Eyebrow>
        </View>
        {action ? <LinkText label={action.label} onPress={action.onPress} /> : null}
      </View>
      {title ? (
        <Txt variant="h2" style={{ marginTop: 14 }} accessibilityRole="header">
          {title}
          {accent ? (
            <>
              {' '}
              <Serif size={32}>{accent}</Serif>
            </>
          ) : null}
        </Txt>
      ) : null}
    </View>
  );
}

/** Row inside a card list: icon tile, title, subtitle, trailing element. */
export function ListRow({
  icon: Icon,
  iconTone = 'neutral',
  title,
  subtitle,
  right,
  onPress,
  last,
  leading,
}: {
  icon?: LucideIcon;
  iconTone?: 'neutral' | 'gold' | 'blue' | 'danger' | 'success';
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  leading?: ReactNode;
}) {
  const c = useColors();
  const tint = { neutral: c.muted, gold: c.goldText, blue: c.blueText, danger: c.danger, success: c.success }[iconTone];
  const body = (
    <>
      {leading ?? (Icon ? <IconTile tone={iconTone}><Icon size={18} color={tint} strokeWidth={1.7} /></IconTile> : null)}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="body" weight="semibold" numberOfLines={2} style={{ letterSpacing: -0.15 }}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="bodySm" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={c.faint} /> : null)}
    </>
  );
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: c.line,
    minHeight: 64,
  };
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [style, pressed && { backgroundColor: c.goldTint }]}
    >
      {body}
    </Pressable>
  );
}

export function Avatar({ name, size = 36, tone = 'gold' }: { name: string; size?: number; tone?: 'gold' | 'blue' | 'neutral' }) {
  const c = useColors();
  const bg = tone === 'gold' ? c.goldTint : tone === 'blue' ? c.blueTint : c.glass;
  const fg = tone === 'gold' ? c.goldText : tone === 'blue' ? c.blueText : c.muted;
  return (
    <View
      aria-hidden
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.line }}
    >
      <Txt style={{ fontFamily: fonts.semibold, fontSize: size * 0.36, color: fg }}>{initials(name)}</Txt>
    </View>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: c.goldBorder, backgroundColor: c.goldTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={c.goldText} strokeWidth={1.6} />
      </View>
      <Txt variant="title" align="center">
        {title}
      </Txt>
      {body ? (
        <Txt variant="bodySm" tone="muted" align="center">
          {body}
        </Txt>
      ) : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

/** Small label + value pair used in detail cards. */
export function KeyValue({ label, value, tone, style }: { label: string; value: string; tone?: 'fg' | 'gold' | 'danger' | 'success' | 'muted'; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flex: 1, minWidth: 0 }, style]}>
      <Txt variant="monoSm" tone="faint">
        {label}
      </Txt>
      <Txt variant="body" weight="semibold" tone={tone ?? 'fg'} style={{ marginTop: 5, letterSpacing: -0.2 }} numberOfLines={2}>
        {value}
      </Txt>
    </View>
  );
}

export function Gutter({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ paddingHorizontal: space.gutter }, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ height: 1, backgroundColor: c.line }, style]} />;
}

export const cardListStyle: ViewStyle = { padding: 0, overflow: 'hidden', borderRadius: radius.card };
