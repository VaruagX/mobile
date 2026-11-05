import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Info, KeyRound, LogOut, RotateCcw } from 'lucide-react-native';
import { Gutter, ListRow, Screen, ScreenHeader, SectionHeader, cardListStyle } from '@/components/Layout';
import { Card } from '@/components/Surface';
import { Button } from '@/components/Button';
import { Field, OptionGroup, Sheet, SwitchRow } from '@/components/Form';
import { Txt } from '@/components/Txt';
import { useToast } from '@/components/Toast';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';
import { useStore } from '@/store/DemoStore';
import { useMe, useSession } from '@/store/Session';
import Constants from 'expo-constants';

export default function Settings() {
  const { preference, setPreference } = useTheme();
  const { actions } = useStore();
  const { user, role } = useMe();
  const { signOut } = useSession();
  const toast = useToast();
  const [prefs, setPrefs] = useState({ push: true, tasks: true, projects: true, billing: role !== 'team', support: role !== 'team' });
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState<string>();

  const savePw = () => {
    if (!pw.current) return setPwErr('Enter your current password.');
    if (pw.next.length < 8) return setPwErr('Use at least 8 characters.');
    if (pw.next !== pw.confirm) return setPwErr('The new passwords do not match.');
    setPwOpen(false);
    toast('Demo build: password changes go live with the API.');
  };

  return (
    <Screen header={<ScreenHeader title="Settings" eyebrow={user.name} />}>
      <SectionHeader label="Appearance" style={{ marginTop: 24 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card>
          <OptionGroup<ThemePreference>
            label="Theme"
            value={preference}
            onChange={setPreference}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'Match phone' },
            ]}
          />
        </Card>
      </Gutter>

      <SectionHeader label="Notifications" style={{ marginTop: 30 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card style={cardListStyle}>
          <SwitchRow label="Push notifications" description="Alerts on this phone" value={prefs.push} onValueChange={(push) => setPrefs({ ...prefs, push })} />
          {role !== 'client' ? <SwitchRow label="Tasks" description="Assignments, reviews and blockers" value={prefs.tasks} onValueChange={(tasks) => setPrefs({ ...prefs, tasks })} /> : null}
          <SwitchRow label="Project updates" description={role === 'client' ? 'New approved updates and files' : 'Milestones and client updates'} value={prefs.projects} onValueChange={(projects) => setPrefs({ ...prefs, projects })} />
          {role !== 'team' ? <SwitchRow label="Billing" description="Invoices, payments and receipts" value={prefs.billing} onValueChange={(billing) => setPrefs({ ...prefs, billing })} /> : null}
          {role !== 'team' ? <SwitchRow label="Support" description="Replies to requests" value={prefs.support} onValueChange={(support) => setPrefs({ ...prefs, support })} /> : null}
        </Card>
      </Gutter>

      <SectionHeader label="Security" style={{ marginTop: 30 }} />
      <Gutter style={{ marginTop: 14 }}>
        <Card style={cardListStyle}>
          <ListRow icon={KeyRound} title="Change password" onPress={() => { setPw({ current: '', next: '', confirm: '' }); setPwErr(undefined); setPwOpen(true); }} last />
        </Card>
      </Gutter>

      <SectionHeader label="About" style={{ marginTop: 30 }} />
      <Gutter style={{ marginTop: 14, gap: 14 }}>
        <Card style={cardListStyle}>
          <ListRow icon={Info} title="Varuag Labs OS" subtitle={`Version ${Constants.expoConfig?.version ?? '1.0.0'} · UI review build with demo data`} last />
        </Card>
        <Card>
          <Txt variant="bodySm" tone="muted">
            This build uses demo data stored on the phone. Nothing is sent to a server. Changes reset when the app restarts.
          </Txt>
          <Button label="Reset demo data" icon={RotateCcw} variant="ghost" size="sm" style={{ marginTop: 14 }} onPress={() => { actions.reset(); toast('Demo data reset'); }} />
        </Card>
        <Button
          label="Sign out"
          icon={LogOut}
          variant="ghost"
          full
          onPress={() => {
            signOut();
            router.replace('/welcome');
          }}
        />
      </Gutter>

      <Sheet visible={pwOpen} onClose={() => setPwOpen(false)} eyebrow="Security" title="Change password" footer={<Button label="Update password" full onPress={savePw} />}>
        <Field label="Current password" value={pw.current} onChangeText={(current) => setPw({ ...pw, current })} secure autoCapitalize="none" />
        <Field label="New password" hint="8+ characters" value={pw.next} onChangeText={(next) => setPw({ ...pw, next })} secure autoCapitalize="none" />
        <Field label="Confirm new password" value={pw.confirm} onChangeText={(confirm) => setPw({ ...pw, confirm })} secure autoCapitalize="none" error={pwErr} />
        <View />
      </Sheet>
    </Screen>
  );
}
