import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useColors } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';
import { tap } from '@/lib/haptics';

type Variant = 'primary' | 'ghost' | 'danger' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT: Record<Size, number> = { sm: 40, md: 48, lg: 56 };
const PAD: Record<Size, number> = { sm: 16, md: 22, lg: 28 };

/** Website .btn: uppercase pill. Primary is solid gold, ghost is a glass pill. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  full,
  disabled,
  loading,
  accessibilityHint,
  style,
}: ButtonProps) {
  const c = useColors();
  const look = {
    primary: { bg: c.gold, pressed: c.goldHover, border: 'transparent', fg: c.onGold },
    ghost: { bg: c.glass, pressed: c.goldTint, border: c.lineStrong, fg: c.fg },
    danger: { bg: c.dangerTint, pressed: c.dangerTint, border: c.danger, fg: c.danger },
    quiet: { bg: 'transparent', pressed: c.goldTint, border: 'transparent', fg: c.goldText },
  }[variant];
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: PAD[size],
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: pressed && variant === 'ghost' ? c.goldBorder : look.border,
          backgroundColor: pressed ? look.pressed : look.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          boxShadow: variant === 'primary' && pressed ? '0px 14px 40px -12px rgba(214,179,74,0.65)' : undefined,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={look.fg} /> : Icon ? <Icon size={iconSize} color={look.fg} strokeWidth={2} /> : null}
      <Txt variant="button" numberOfLines={1} style={{ color: look.fg, fontSize: size === 'sm' ? 11.5 : 13 }}>
        {label}
      </Txt>
      {IconRight && !loading ? <IconRight size={iconSize} color={look.fg} strokeWidth={2} /> : null}
    </Pressable>
  );
}

/** Website .icon-btn: 44px round glass button. */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  badge,
  size = 44,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  badge?: number;
  size?: number;
  tone?: 'default' | 'gold';
}) {
  const c = useColors();
  const gold = tone === 'gold';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
      onPress={() => {
        tap();
        onPress?.();
      }}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: gold ? 'transparent' : pressed ? c.goldBorder : c.lineStrong,
        backgroundColor: gold ? (pressed ? c.goldHover : c.gold) : c.glass,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Icon size={18} color={gold ? c.onGold : c.fg} strokeWidth={1.7} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: 9,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: c.gold,
            borderWidth: 2,
            borderColor: c.bg,
          }}
        />
      ) : null}
    </Pressable>
  );
}

/** Website .link-arrow: gold text link. */
export function LinkText({ label, onPress, children }: { label: string; onPress: () => void; children?: ReactNode }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={10}>
      {({ pressed }) => (
        <Txt variant="bodySm" tone="gold" weight="medium" style={{ opacity: pressed ? 0.7 : 1, textDecorationLine: pressed ? 'underline' : 'none' }}>
          {children ?? label}
        </Txt>
      )}
    </Pressable>
  );
}
