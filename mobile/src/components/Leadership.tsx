import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { altFor, leadership, type Leader } from '@/data/site';
import { PaletteScope, useColors, useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { DoubleRule } from './Backgrounds';
import { LinkedinIcon } from './Brand';
import { Eyebrow } from './Layout';
import { Reveal } from './Motion';
import { Serif, Txt } from './Txt';
import { tap } from '@/lib/haptics';

const GAP = 12;

/**
 * Website About → Leadership section ("band-paper": stays light in both themes).
 * Original photographs, names, roles, bios and LinkedIn links, unchanged.
 * Two-column grid; the host screen's ScrollView provides the vertical scrolling.
 */
export function Leadership({ index = '04' }: { index?: string }) {
  const { paper } = useTheme();
  const rows: Leader[][] = [];
  for (let i = 0; i < leadership.length; i += 2) rows.push(leadership.slice(i, i + 2));
  return (
    <PaletteScope value={paper}>
      <View style={{ backgroundColor: paper.bg, paddingTop: 56, paddingBottom: 48 }}>
        <View style={{ paddingHorizontal: space.gutter }}>
          <Eyebrow>{`${index} — Leadership`}</Eyebrow>
          <Txt variant="h1" style={{ marginTop: 20 }} accessibilityRole="header">
            The people building <Serif size={40}>Varuag Labs.</Serif>
          </Txt>
          <Txt variant="body" tone="muted" style={{ marginTop: 16 }}>
            A founder-led team covering technology, operations, and growth.
          </Txt>
          <DoubleRule style={{ marginTop: 28 }} />
        </View>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 28, gap: GAP }} accessibilityLabel="Leadership team">
          {rows.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', gap: GAP, alignItems: 'stretch' }}>
              {row.map((m, c) => (
                <PortraitCard key={m.id} member={m} number={r * 2 + c + 1} delay={(r * 2 + c) * 70} />
              ))}
              {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </View>
      </View>
    </PaletteScope>
  );
}

function PortraitCard({ member, number, delay }: { member: Leader; number: number; delay: number }) {
  const c = useColors();
  return (
    <Reveal delay={delay} style={{ flex: 1, minWidth: 0 }}>
      <View style={{ borderRadius: radius.lg, overflow: 'hidden', aspectRatio: 1, backgroundColor: '#e8e6df' }}>
        <Image
          source={member.photo}
          accessibilityLabel={altFor(member)}
          contentFit="cover"
          contentPosition={{ left: '50%', top: '22%' }}
          transition={400}
          style={{ width: '100%', height: '100%', transform: [{ scale: 1.02 }] }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(214,179,74,0.18)']}
          locations={[0.55, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      </View>
      <Txt variant="mono" tone="gold" style={{ marginTop: 12, fontSize: 10, lineHeight: 15 }}>
        {member.role}
      </Txt>
      <Txt variant="h3" style={{ marginTop: 6, fontSize: 17, lineHeight: 22 }}>
        {`${number}. ${member.name}`}
      </Txt>
      <Txt variant="bodySm" tone="muted" style={{ marginTop: 8, marginBottom: 14, fontSize: 12.5, lineHeight: 18 }}>
        {member.bio}
      </Txt>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`View ${member.name}'s LinkedIn profile`}
        onPress={() => {
          tap();
          Linking.openURL(member.linkedin).catch(() => {});
        }}
        style={({ pressed }) => ({
          marginTop: 'auto',
          alignSelf: 'flex-start',
          minHeight: 40,
          paddingHorizontal: 12,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: pressed ? c.fg : c.lineStrong,
          backgroundColor: pressed ? c.fg : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        })}
      >
        {({ pressed }) => (
          <>
            <LinkedinIcon size={14} color={pressed ? c.bg : c.fg} />
            <Txt variant="button" style={{ fontSize: 12, color: pressed ? c.bg : c.fg }}>
              LinkedIn
            </Txt>
          </>
        )}
      </Pressable>
    </Reveal>
  );
}
