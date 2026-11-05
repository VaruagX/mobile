import { View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import type { LucideIcon } from 'lucide-react-native';
import { site } from '@/data/site';
import { useColors } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { GridBackground, Glow } from './Backgrounds';
import { VLMark } from './Brand';
import { Button } from './Button';
import { Eyebrow } from './Layout';
import { Float, MaskLine, PulseDot, Reveal } from './Motion';
import { GoldText } from './GoldText';
import { Txt } from './Txt';

type Action = { label: string; onPress: () => void; icon?: LucideIcon };

/**
 * The website hero, adapted to phone width: eyebrow, "WE TURN IDEAS INTO DIGITAL REALITY."
 * with the masked line-up animation and gold "REALITY.", the original description,
 * role-specific actions and the brand stage (gold VL mark over orbit rings).
 */
export function Hero({
  eyebrow,
  primary,
  secondary,
  status,
  glow = 'gold',
}: {
  eyebrow: string;
  primary?: Action;
  secondary?: Action;
  status: string;
  glow?: 'gold' | 'blue';
}) {
  const c = useColors();
  return (
    <View style={{ paddingTop: 28, overflow: 'hidden' }}>
      <GridBackground />
      <View style={{ paddingHorizontal: space.gutter }}>
        <Reveal delay={60}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <View style={{ marginTop: 22 }} accessible accessibilityRole="header" accessibilityLabel="We turn ideas into digital reality.">
          <MaskLine delay={100}>
            <Txt variant="display" upper>
              {site.heroLines[0]}
            </Txt>
          </MaskLine>
          <MaskLine delay={190}>
            <Txt variant="display" upper>
              {site.heroLines[1]}
            </Txt>
          </MaskLine>
          <MaskLine delay={280}>
            <GoldText>{site.heroLines[2]}</GoldText>
          </MaskLine>
        </View>
        <Reveal delay={420}>
          <Txt variant="lead" tone="muted" style={{ marginTop: 18 }}>
            {site.heroDescription}
          </Txt>
        </Reveal>
        {primary || secondary ? (
          <Reveal delay={520} style={{ marginTop: 22, flexDirection: 'row', gap: 10 }}>
            {primary ? <Button label={primary.label} icon={primary.icon} onPress={primary.onPress} style={{ flex: 1, paddingHorizontal: 10 }} /> : null}
            {secondary ? <Button label={secondary.label} variant="ghost" onPress={secondary.onPress} style={{ flex: 1, paddingHorizontal: 10 }} /> : null}
          </Reveal>
        ) : null}
      </View>

      {/* Brand stage: website hero fallback (VL mark, glow, orbit rings). */}
      <View style={{ height: 172, marginTop: 10, marginHorizontal: space.gutter }} aria-hidden>
        <Glow size={230} color={glow === 'gold' ? c.glowGold : c.glowBlue} style={{ left: '50%', top: '50%', marginLeft: -115, marginTop: -125 }} />
        <Svg width="100%" height={172} style={{ position: 'absolute' }}>
          <Ellipse cx="50%" cy="108" rx="46%" ry="38" stroke={c.lineStrong} fill="none" />
          <Ellipse cx="50%" cy="108" rx="36%" ry="29" stroke="rgba(214,179,74,0.4)" strokeDasharray="2 7" fill="none" />
        </Svg>
        <View style={{ position: 'absolute', top: 34, left: 0, right: 0, alignItems: 'center' }}>
          <Float>
            <VLMark width={124} />
          </Float>
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, marginRight: 12 }}>
            <PulseDot />
            <Txt variant="monoSm" tone="faint" numberOfLines={1} style={{ flexShrink: 1 }}>
              {status}
            </Txt>
          </View>
          <Txt variant="monoSm" tone="faint" numberOfLines={1} style={{ flexShrink: 0 }}>
            Technology <Txt variant="monoSm" tone="gold">|</Txt> Innovation
          </Txt>
        </View>
      </View>
    </View>
  );
}
