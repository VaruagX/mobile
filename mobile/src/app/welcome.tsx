import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Lock } from 'lucide-react-native';
import { BrandHeader, Eyebrow, Gutter, Screen } from '@/components/Layout';
import { Hero } from '@/components/Hero';
import { Leadership } from '@/components/Leadership';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Serif, Txt } from '@/components/Txt';
import { useColors } from '@/theme/ThemeProvider';
import { site } from '@/data/site';
import { Reveal } from '@/components/Motion';

/** Public home (signed out): the website's hero, focus areas, leadership and sign-in. */
export default function Welcome() {
  const c = useColors();
  return (
    <Screen header={<BrandHeader />}>
      <Hero
        eyebrow={site.positioning}
        primary={{ label: 'Sign in', icon: ArrowRight, onPress: () => router.push('/login') }}
        secondary={{ label: 'Website', onPress: () => Linking.openURL(site.website).catch(() => {}) }}
        status="Varuag Labs OS"
      />

      <Gutter style={{ marginTop: 40 }}>
        <Eyebrow>01 — What we build</Eyebrow>
        <Txt variant="h2" style={{ marginTop: 14 }}>
          One workspace for <Serif size={32}>every project.</Serif>
        </Txt>
        <Txt variant="body" tone="muted" style={{ marginTop: 12 }}>
          Varuag Labs OS is where our clients follow approved progress, our team ships work, and invoices stay in one place.
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 22, rowGap: 12 }}>
          {site.focusAreas.map((f) => (
            <View key={f} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold }} />
              <Txt variant="monoSm" tone="faint">
                {f}
              </Txt>
            </View>
          ))}
        </View>
      </Gutter>

      <Gutter style={{ marginTop: 28, gap: 12 }}>
        {[
          ['Admin', 'Run projects, milestones, invoices and payments.'],
          ['Team', 'Update tasks, upload deliverables and flag blockers.'],
          ['Client', 'Follow approved progress, files, invoices and support.'],
        ].map(([title, body], i) => (
          <Reveal key={title} delay={i * 90}>
            <Card>
              <Txt variant="mono" tone="gold">{`0${i + 1} · ${title}`}</Txt>
              <Txt variant="body" tone="muted" style={{ marginTop: 8 }}>
                {body}
              </Txt>
            </Card>
          </Reveal>
        ))}
        <Card glass brackets style={{ marginTop: 6 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Lock size={18} color={c.goldText} />
            <Txt variant="bodySm" tone="muted" style={{ flex: 1 }}>
              Accounts are created by Varuag Labs. There is no public sign-up.
            </Txt>
          </View>
          <Button label="Sign in" icon={ArrowRight} full style={{ marginTop: 16 }} onPress={() => router.push('/login')} />
        </Card>
      </Gutter>

      <View style={{ marginTop: 48 }}>
        <Leadership index="02" />
      </View>
    </Screen>
  );
}
