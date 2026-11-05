import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type CardProps = {
  children: ReactNode;
  /** Website .glass: translucent panel with a stronger shadow. Default is .card. */
  glass?: boolean;
  /** Website .brackets: gold corner marks top-left and bottom-right. */
  brackets?: boolean;
  /** Gold border for items that need attention. */
  highlight?: boolean;
  padding?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, glass, brackets, highlight, padding = 18, onPress, accessibilityLabel, style }: CardProps) {
  const c = useColors();
  const base: ViewStyle = {
    borderWidth: 1,
    borderColor: highlight ? c.goldBorder : glass ? c.glassBorder : c.line,
    borderRadius: radius.card,
    backgroundColor: glass ? c.glass : c.card,
    boxShadow: glass ? c.shadow : c.shadowSoft,
    padding,
  };
  const inner = (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[c.glassHighlight, 'transparent']}
        locations={[0, glass ? 0.35 : 0.4]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.card }]}
      />
      {children}
      {brackets ? <Brackets /> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [base, pressed && { transform: [{ scale: 0.985 }], borderColor: c.goldBorder }, style]}
      >
        {inner}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{inner}</View>;
}

export function Brackets({ color }: { color?: string }) {
  const c = useColors();
  const tint = color ?? c.gold;
  return (
    <>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -1, left: -1, width: 14, height: 14, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: tint, borderTopLeftRadius: 4 }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: tint, borderBottomRightRadius: 4 }}
      />
    </>
  );
}

/** Rounded icon tile used at the start of list rows. */
export function IconTile({ children, tone = 'neutral', size = 40 }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'blue' | 'danger' | 'success'; size?: number }) {
  const c = useColors();
  const map = {
    neutral: { bg: 'transparent', border: c.lineStrong },
    gold: { bg: c.goldTint, border: c.goldBorder },
    blue: { bg: c.blueTint, border: c.lineStrong },
    danger: { bg: c.dangerTint, border: c.lineStrong },
    success: { bg: c.successTint, border: c.lineStrong },
  }[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: map.border,
        backgroundColor: map.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}
