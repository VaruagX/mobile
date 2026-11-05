import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Briefcase, Building2, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { Eyebrow, Gutter, Screen, ScreenHeader } from '@/components/Layout';
import { Field } from '@/components/Form';
import { Button } from '@/components/Button';
import { Card, IconTile } from '@/components/Surface';
import { Logo } from '@/components/Brand';
import { Serif, Txt } from '@/components/Txt';
import { Chip } from '@/components/Chips';
import { Reveal } from '@/components/Motion';
import { HOME_ROUTE, useSession } from '@/store/Session';
import { useColors } from '@/theme/ThemeProvider';
import type { Role } from '@/data/types';
import { tap } from '@/lib/haptics';

const DEMO: { role: Role; title: string; body: string; email: string; icon: LucideIcon }[] = [
  { role: 'admin', title: 'Admin', body: 'Gaurav Kale · runs the studio', email: 'admin@demo.varuaglabs.in', icon: ShieldCheck },
  { role: 'team', title: 'Team', body: 'Rohan Patil · frontend developer', email: 'rohan@demo.varuaglabs.in', icon: Briefcase },
  { role: 'client', title: 'Client', body: 'Raj Mehta · Mehta Realty', email: 'raj@mehtarealty.demo', icon: Building2 },
];

export default function Login() {
  const c = useColors();
  const { signInAs, signInWithPassword } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setError(undefined);
    if (!email.includes('@')) return setError('Enter the email Varuag Labs registered for you.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    const res = signInWithPassword(email, password);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.replace('/');
  };

  const go = (role: Role) => {
    signInAs(role);
    router.replace(HOME_ROUTE[role] as never);
  };

  return (
    <Screen header={<ScreenHeader title="Sign in" eyebrow="Varuag Labs OS" />} grid>
      <Gutter style={{ paddingTop: 32 }}>
        <Reveal>
          <Logo height={30} />
          <Txt variant="h1" style={{ marginTop: 28 }}>
            Welcome <Serif size={40}>back.</Serif>
          </Txt>
          <Txt variant="body" tone="muted" style={{ marginTop: 10 }}>
            Sign in with the email and password Varuag Labs shared with you.
          </Txt>
        </Reveal>

        <Card glass brackets style={{ marginTop: 28, gap: 18 }} padding={20}>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secure autoCapitalize="none" autoComplete="password" error={error} />
          <Button label="Sign in" iconRight={ArrowRight} full loading={busy} onPress={submit} />
          <Txt variant="caption" tone="faint" align="center">
            Forgot your password? Ask your Varuag Labs admin to reset it.
          </Txt>
        </Card>

        <View style={{ marginTop: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>Demo access</Eyebrow>
          <Chip label="UI review build" tone="blue" dot />
        </View>
        <Txt variant="bodySm" tone="muted" style={{ marginTop: 10 }}>
          Open a workspace with demo data. Password for the demo emails: demo1234
        </Txt>
        <View style={{ marginTop: 14, gap: 10 }}>
          {DEMO.map((d, i) => (
            <Reveal key={d.role} delay={i * 80}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open the ${d.title} demo workspace`}
                onPress={() => {
                  tap();
                  go(d.role);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: pressed ? c.goldBorder : c.line,
                  backgroundColor: pressed ? c.goldTint : c.card,
                })}
              >
                <IconTile tone="gold">
                  <d.icon size={18} color={c.goldText} strokeWidth={1.7} />
                </IconTile>
                <View style={{ flex: 1 }}>
                  <Txt variant="title">{d.title}</Txt>
                  <Txt variant="bodySm" tone="muted">
                    {d.body}
                  </Txt>
                  <Txt variant="caption" tone="faint" style={{ marginTop: 2 }}>
                    {d.email}
                  </Txt>
                </View>
                <ArrowRight size={18} color={c.goldText} />
              </Pressable>
            </Reveal>
          ))}
        </View>
      </Gutter>
    </Screen>
  );
}
