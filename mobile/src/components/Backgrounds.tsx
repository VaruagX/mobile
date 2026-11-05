import { useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/theme/ThemeProvider';

const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, '');

/** Website .grid-bg + .grid-fade: 64px hairline grid fading out radially. */
export function GridBackground({ cell = 64, style }: { cell?: number; style?: ViewStyle }) {
  const c = useColors();
  const id = svgId(useId());
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={`p${id}`} width={cell} height={cell} patternUnits="userSpaceOnUse">
            <Path d={`M ${cell} 0 L 0 0 0 ${cell}`} stroke={c.grid} strokeWidth={1} fill="none" />
          </Pattern>
          <RadialGradient id={`r${id}`} cx="50%" cy="38%" rx="62%" ry="58%">
            <Stop offset="0.3" stopColor="#ffffff" stopOpacity={1} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>
          <Mask id={`m${id}`}>
            <Rect width="100%" height="100%" fill={`url(#r${id})`} />
          </Mask>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#p${id})`} mask={`url(#m${id})`} />
      </Svg>
    </View>
  );
}

/** Website .ambient: a gold glow top-right and a blue glow lower-left. */
export function Ambient({ height = 1200 }: { height?: number }) {
  const c = useColors();
  const id = svgId(useId());
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={`g${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c.glowGold} />
            <Stop offset="1" stopColor={c.glowGold} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`b${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c.glowBlue} />
            <Stop offset="1" stopColor={c.glowBlue} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="92%" cy="2%" rx="420" ry="360" fill={`url(#g${id})`} />
        <Ellipse cx="0%" cy="58%" rx="380" ry="320" fill={`url(#b${id})`} />
      </Svg>
    </View>
  );
}

/** A single radial glow, used behind the hero mark and on highlighted cards. */
export function Glow({ size, color, style }: { size: number; color: string; style?: ViewStyle }) {
  const id = svgId(useId());
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={`w${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#w${id})`} />
      </Svg>
    </View>
  );
}

/** Website .eyebrow::before rule: 28px gold hairline fading to transparent. */
export function GoldRule({ width = 28 }: { width?: number }) {
  const c = useColors();
  return (
    <LinearGradient
      colors={[c.gold, 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ width, height: 1 }}
    />
  );
}

/** Website .double-rule: gold hairline over a neutral hairline. */
export function DoubleRule({ style }: { style?: ViewStyle }) {
  const c = useColors();
  return (
    <View
      style={[
        { height: 5, borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: 'rgba(214,179,74,0.5)', borderBottomColor: c.line },
        style,
      ]}
    />
  );
}
