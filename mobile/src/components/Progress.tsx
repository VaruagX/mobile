import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/theme/ThemeProvider';
import { useGrow } from './Motion';
import { Card } from './Surface';
import { Txt } from './Txt';

/** Thin progress track with the website's gold gradient fill. */
export function ProgressBar({ value, height = 6, tone = 'gold', label }: { value: number; height?: number; tone?: 'gold' | 'blue' | 'danger'; label?: string }) {
  const c = useColors();
  const grow = useGrow(value);
  const colors: [string, string, ...string[]] =
    tone === 'gold' ? [c.gold1, c.gold, c.gold2] : tone === 'blue' ? [c.blue, c.blueText] : [c.danger, c.danger];
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      style={{ height, borderRadius: height, backgroundColor: c.lineStrong, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height: '100%', borderRadius: height, overflow: 'hidden' }, grow]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

/**
 * Project progress split by milestone weight: each segment's width is the milestone's
 * weight and its fill is that milestone's verified-task progress.
 */
export function SegmentedProgress({
  segments,
  height = 6,
  label,
}: {
  segments: { weight: number; percent: number; title?: string }[];
  height?: number;
  label?: string;
}) {
  const c = useColors();
  const description =
    label ?? segments.map((s) => `${s.title ?? 'Milestone'} ${Math.round(s.percent)} percent`).join(', ');
  return (
    <View accessibilityRole="image" accessibilityLabel={description} style={{ flexDirection: 'row', gap: 3, height }}>
      {segments.map((s, i) => (
        <View key={i} style={{ flex: s.weight, borderRadius: height, backgroundColor: c.lineStrong, overflow: 'hidden' }}>
          <View style={{ width: `${Math.min(100, s.percent)}%`, height: '100%', backgroundColor: c.gold, borderRadius: height }} />
        </View>
      ))}
    </View>
  );
}

/** Stat tile: large tabular number + mono label (website stat treatment). */
export function StatTile({
  value,
  label,
  tone = 'fg',
  onPress,
  style,
}: {
  value: string;
  label: string;
  tone?: 'fg' | 'gold' | 'danger' | 'success';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={[{ flex: 1 }, style]}>
      <Txt variant="stat" tone={tone}>
        {value}
      </Txt>
      <Txt variant="mono" tone="muted" style={{ marginTop: 10 }}>
        {label}
      </Txt>
    </Card>
  );
}

/** Simple horizontal bar row for reports. */
export function BarRow({ label, value, max, display, tone = 'gold' }: { label: string; value: number; max: number; display: string; tone?: 'gold' | 'blue' | 'danger' }) {
  const c = useColors();
  const fill = tone === 'gold' ? c.gold : tone === 'blue' ? c.blue : c.danger;
  return (
    <View style={{ gap: 8 }} accessibilityLabel={`${label}: ${display}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Txt variant="bodySm" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </Txt>
        <Txt variant="bodySm" tone="muted">
          {display}
        </Txt>
      </View>
      <View style={{ height: 8, borderRadius: 8, backgroundColor: c.lineStrong, overflow: 'hidden' }}>
        <View style={{ width: `${max ? Math.max(2, (100 * value) / max) : 0}%`, height: '100%', backgroundColor: fill, borderRadius: 8 }} />
      </View>
    </View>
  );
}
