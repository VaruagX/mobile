import { useState } from 'react';
import { FlatList, Linking, Pressable, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
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

const CARD_W = 264;
const GAP = 14;

/**
 * Website About → Leadership section ("band-paper": stays light in both themes).
 * Original photographs, names, roles, bios and LinkedIn links, unchanged.
 */
export function Leadership({ index = '04' }: { index?: string }) {
  const { paper } = useTheme();
  const [page, setPage] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP));
    if (i !== page) setPage(Math.max(0, Math.min(leadership.length - 1, i)));
  };
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
        <FlatList
          data={leadership}
          keyExtractor={(m) => m.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + GAP}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={32}
          contentContainerStyle={{ paddingHorizontal: space.gutter, gap: GAP, paddingTop: 28 }}
          renderItem={({ item, index: i }) => <PortraitCard member={item} delay={i * 70} />}
          accessibilityLabel="Leadership team"
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 }} aria-hidden>
          {leadership.map((m, i) => (
            <View key={m.id} style={{ width: i === page ? 22 : 6, height: 4, borderRadius: 2, backgroundColor: i === page ? paper.gold : paper.lineStrong }} />
          ))}
        </View>
      </View>
    </PaletteScope>
  );
}

function PortraitCard({ member, delay }: { member: Leader; delay: number }) {
  const c = useColors();
  return (
    <Reveal delay={delay} style={{ width: CARD_W }}>
      <View style={{ borderRadius: radius.lg, overflow: 'hidden', aspectRatio: 4 / 5, backgroundColor: '#e8e6df' }}>
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
      <Txt variant="mono" tone="gold" style={{ marginTop: 18 }}>
        {member.role}
      </Txt>
      <Txt variant="h3" style={{ marginTop: 6 }}>
        {member.name}
      </Txt>
      <Txt variant="bodySm" tone="muted" style={{ marginTop: 10, fontSize: 14, lineHeight: 22 }}>
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
          marginTop: 16,
          alignSelf: 'flex-start',
          minHeight: 42,
          paddingHorizontal: 16,
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
              View LinkedIn profile
            </Txt>
          </>
        )}
      </Pressable>
    </Reveal>
  );
}
