import { Text, type TextProps, type TextStyle } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/tokens';

export type TextVariant = keyof typeof type;
export type Tone = 'fg' | 'muted' | 'faint' | 'gold' | 'blue' | 'danger' | 'success' | 'onGold';
type Weight = 'regular' | 'medium' | 'semibold';

const MONO: TextVariant[] = ['eyebrow', 'mono', 'monoSm'];
const HEAVY: TextVariant[] = ['display', 'h1', 'h2', 'h3', 'title', 'stat', 'amount', 'mega', 'button'];

export type TxtProps = TextProps & {
  variant?: TextVariant;
  tone?: Tone;
  weight?: Weight;
  align?: TextStyle['textAlign'];
  upper?: boolean;
};

/** Website typography: Geist for text, Geist Mono uppercase for labels. */
export function Txt({ variant = 'body', tone = 'fg', weight, align, upper, style, ...rest }: TxtProps) {
  const c = useColors();
  const isMono = MONO.includes(variant);
  const toneColor: Record<Tone, string> = {
    fg: c.fg,
    muted: c.muted,
    faint: c.faint,
    gold: c.goldText,
    blue: c.blueText,
    danger: c.danger,
    success: c.success,
    onGold: c.onGold,
  };
  const w = weight ?? (HEAVY.includes(variant) ? 'semibold' : 'regular');
  const fontFamily = isMono ? (w === 'regular' ? fonts.mono : fonts.monoMedium) : fonts[w];
  return (
    <Text
      maxFontSizeMultiplier={variant === 'display' || variant === 'amount' ? 1.2 : 1.5}
      {...rest}
      style={[
        type[variant],
        {
          color: toneColor[tone],
          fontFamily,
          textAlign: align,
          textTransform: isMono || upper || variant === 'button' ? 'uppercase' : undefined,
        },
        style,
      ]}
    />
  );
}

/** Instrument Serif italic accent, e.g. "The people building *Varuag Labs.*" */
export function Serif({ children, size, tone = 'gold' }: { children: React.ReactNode; size?: number; tone?: Tone }) {
  const c = useColors();
  return (
    <Text
      style={{
        fontFamily: fonts.serifItalic,
        fontSize: size,
        letterSpacing: -0.2,
        color: tone === 'gold' ? c.goldText : tone === 'muted' ? c.muted : c.fg,
      }}
    >
      {children}
    </Text>
  );
}
