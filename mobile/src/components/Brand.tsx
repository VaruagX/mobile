import { View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

const LOGO_DARK = require('../../assets/brand/logo-horizontal-dark-640.png');
const LOGO_LIGHT = require('../../assets/brand/logo-horizontal-light-640.png');

/** Original website logo: white wordmark on dark, black wordmark on light. */
export function Logo({ height = 26, forceTone }: { height?: number; forceTone?: 'dark' | 'light' }) {
  const { name } = useTheme();
  const tone = forceTone ?? name;
  return (
    <Image
      source={tone === 'dark' ? LOGO_DARK : LOGO_LIGHT}
      style={{ height, width: (height * 640) / 107 }}
      contentFit="contain"
      accessibilityLabel="Varuag Labs — Technology | Innovation"
    />
  );
}

/** The VL mark (website public/images/brand/vl-mark.svg) with the hero's gold sheen gradient. */
export function VLMark({ width = 124, flat }: { width?: number; flat?: string }) {
  const height = (width * 270) / 414;
  return (
    <Svg width={width} height={height} viewBox="0 0 414 270">
      <Defs>
        <SvgGradient id="vlmark" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#a9842a" />
          <Stop offset="0.3" stopColor="#d6b34a" />
          <Stop offset="0.48" stopColor="#fff1bf" />
          <Stop offset="0.62" stopColor="#d6b34a" />
          <Stop offset="1" stopColor="#b08a2c" />
        </SvgGradient>
      </Defs>
      <Path fill={flat ?? 'url(#vlmark)'} d="M1 1H84L155 118L221 1H246L153 164L70 23H38L152 222L244 64L251 56V97L150 268Z" />
      <Path fill={flat ?? 'url(#vlmark)'} d="M259 1H279V196H413V269H207V190L228 155V247H391V218H259Z" />
    </Svg>
  );
}

/** LinkedIn glyph from the website (Lucide v1 no longer ships brand icons). */
export function LinkedinIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <Rect width={4} height={12} x={2} y={9} />
      <Circle cx={4} cy={4} r={2} />
    </Svg>
  );
}

export function Spacer({ h = 0, w = 0 }: { h?: number; w?: number }) {
  return <View style={{ height: h, width: w }} />;
}
