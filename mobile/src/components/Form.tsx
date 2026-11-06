import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Paperclip, X, type LucideIcon } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useColors } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';
import { fileSize } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { Button, IconButton } from './Button';
import { Eyebrow } from './Layout';
import { Txt } from './Txt';

/** Website .field: 50px input, hairline border, gold focus ring. */
export function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  multiline,
  secure,
  keyboardType,
  autoCapitalize,
  error,
  maxLength,
  autoComplete,
  prefix,
  suffix,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
  maxLength?: number;
  autoComplete?: 'email' | 'password' | 'name' | 'tel' | 'off';
  prefix?: string;
  suffix?: string;
}) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);
  const border = error ? c.danger : focused ? c.gold : c.lineStrong;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <Txt variant="bodySm" weight="medium">
          {label}
        </Txt>
        {hint ? (
          <Txt variant="monoSm" tone="faint" style={{ letterSpacing: 1.2 }}>
            {hint}
          </Txt>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          minHeight: multiline ? 120 : 50,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: focused ? c.bg : c.bg2,
          paddingHorizontal: 16,
          boxShadow: focused ? '0px 0px 0px 4px rgba(214,179,74,0.16)' : undefined,
        }}
      >
        {prefix ? (
          <Txt variant="body" tone="muted" style={{ marginRight: 6 }}>
            {prefix}
          </Txt>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.faint}
          multiline={multiline}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoComplete={autoComplete}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={{
            flex: 1,
            color: c.fg,
            fontFamily: fonts.regular,
            fontSize: 16,
            paddingVertical: multiline ? 14 : 12,
            minHeight: multiline ? 118 : 48,
            outlineStyle: 'none',
          } as object}
        />
        {suffix ? (
          <Txt variant="body" tone="muted" style={{ marginLeft: 6 }}>
            {suffix}
          </Txt>
        ) : null}
        {secure ? (
          <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} onPress={() => setHidden((h) => !h)} hitSlop={10}>
            {hidden ? <Eye size={18} color={c.muted} /> : <EyeOff size={18} color={c.muted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Txt variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

/** Single-choice pills (status, priority, payment method, role...). */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="bodySm" weight="medium">
        {label}
      </Txt>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => {
                tap();
                onChange(o.value);
              }}
              style={{
                minHeight: 40,
                paddingHorizontal: 14,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: active ? c.gold : c.lineStrong,
                backgroundColor: active ? c.goldTint : 'transparent',
                justifyContent: 'center',
              }}
            >
              <Txt variant="bodySm" weight={active ? 'semibold' : 'medium'} tone={active ? 'gold' : 'fg'}>
                {o.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Multi-select pills (project members). */
export function MultiSelect({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="bodySm" weight="medium">
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => {
          const active = values.includes(o.value);
          return (
            <Pressable
              key={o.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              onPress={() => {
                tap();
                onChange(active ? values.filter((v) => v !== o.value) : [...values, o.value]);
              }}
              style={{
                minHeight: 40,
                paddingHorizontal: 14,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: active ? c.gold : c.lineStrong,
                backgroundColor: active ? c.goldTint : 'transparent',
                justifyContent: 'center',
              }}
            >
              <Txt variant="bodySm" weight={active ? 'semibold' : 'medium'} tone={active ? 'gold' : 'fg'}>
                {o.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SwitchRow({ label, description, value, onValueChange }: { label: string; description?: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
      <View style={{ flex: 1 }}>
        <Txt variant="body" weight="medium">
          {label}
        </Txt>
        {description ? (
          <Txt variant="bodySm" tone="muted" style={{ marginTop: 2 }}>
            {description}
          </Txt>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={(v) => {
          tap();
          onValueChange(v);
        }}
        trackColor={{ false: c.lineStrong, true: c.gold }}
        thumbColor={value ? c.onGold : c.fg}
        ios_backgroundColor={c.lineStrong}
        {...({ activeTrackColor: c.gold, activeThumbColor: c.onGold, trackColor: { false: c.lineStrong, true: c.gold } } as object)}
      />
    </View>
  );
}

export type PickedFile = { name: string; size: number; mime: string };

/** File picker. Files are only listed in the demo; uploads go to storage after integration. */
export function FilePicker({ files, onChange, label = 'Attach files' }: { files: PickedFile[]; onChange: (f: PickedFile[]) => void; label?: string }) {
  const c = useColors();
  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: false });
      if (res.canceled) return;
      onChange([
        ...files,
        ...res.assets.map((a) => ({ name: a.name, size: a.size ?? 0, mime: a.mimeType ?? 'application/octet-stream' })),
      ]);
    } catch {
      // Picker unavailable (e.g. preview); ignore.
    }
  };
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="bodySm" weight="medium">
        {label}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose files to upload"
        onPress={pick}
        style={({ pressed }) => ({
          minHeight: 64,
          borderRadius: radius.md,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: pressed ? c.gold : c.lineStrong,
          backgroundColor: pressed ? c.goldTint : c.bg2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        })}
      >
        <Paperclip size={16} color={c.goldText} />
        <Txt variant="bodySm" weight="medium" tone="gold">
          Choose files
        </Txt>
        <Txt variant="caption" tone="faint">
          up to 100 MB each
        </Txt>
      </Pressable>
      {files.map((f, i) => (
        <View key={`${f.name}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: c.line }}>
          <Txt variant="bodySm" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
            {f.name}
          </Txt>
          <Txt variant="caption" tone="faint">
            {fileSize(f.size)}
          </Txt>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${f.name}`} hitSlop={10} onPress={() => onChange(files.filter((_, j) => j !== i))}>
            <X size={16} color={c.muted} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

/** Bottom sheet modal in the website's glass style. */
export function Sheet({
  visible,
  onClose,
  eyebrow,
  title,
  subtitle,
  icon: HeaderIcon,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  /** Optional supporting line under the title (enables the compact icon header). */
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(4,5,8,0.62)' }} />
          <View
            accessibilityViewIsModal
            style={{
              maxHeight: '92%',
              backgroundColor: c.bg2,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              borderWidth: 1,
              borderColor: c.glassBorder,
              boxShadow: c.shadow,
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 10 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.lineStrong }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: space.gutter, paddingTop: 14, paddingBottom: 6 }}>
              {HeaderIcon ? (
                <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.goldTint, borderWidth: 1, borderColor: c.goldBorder }}>
                  <HeaderIcon size={20} color={c.gold} strokeWidth={1.8} />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                {eyebrow ? <Eyebrow tone="gold">{eyebrow}</Eyebrow> : null}
                <Txt variant="h3" style={{ marginTop: eyebrow ? 10 : 0 }} accessibilityRole="header">
                  {title}
                </Txt>
                {subtitle ? (
                  <Txt variant="bodySm" tone="muted" style={{ marginTop: 2 }}>
                    {subtitle}
                  </Txt>
                ) : null}
              </View>
              <IconButton icon={X} label="Close" onPress={onClose} size={40} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.gutter, gap: 18 }}>
              {children}
            </ScrollView>
            {footer ? (
              <View style={{ paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 14 + insets.bottom, borderTopWidth: 1, borderTopColor: c.line, gap: 10 }}>{footer}</View>
            ) : (
              <View style={{ height: insets.bottom + 8 }} />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Confirmation dialog. */
export function Confirm({
  visible,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const c = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(4,5,8,0.62)' }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 380, padding: 22, borderRadius: radius.card, backgroundColor: c.bg2, borderWidth: 1, borderColor: c.glassBorder, gap: 12 }}>
          <Txt variant="h3">{title}</Txt>
          <Txt variant="body" tone="muted">
            {body}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Button label="Cancel" variant="ghost" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
