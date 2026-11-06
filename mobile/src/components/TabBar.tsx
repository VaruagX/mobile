import { Platform, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import type { LucideIcon } from 'lucide-react-native';
import { useColors, useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { tap } from '@/lib/haptics';
import { Txt } from './Txt';

export type TabMeta = Record<string, { label: string; icon: LucideIcon; badge?: number }>;

/**
 * Floating glass pill tab bar. The active tab gets the website nav's gold dot
 * (.nav-link[data-active]::after).
 */
export function FloatingTabBar({ state, navigation, meta }: BottomTabBarProps & { meta: TabMeta }) {
  const c = useColors();
  const { name } = useTheme();
  const insets = useSafeAreaInsets();
  const solid = name === 'dark' ? 'rgba(16,18,24,0.9)' : 'rgba(255,255,255,0.9)';
  return (
    <View
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: Math.max(insets.bottom, 10) + 6,
        height: 68,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: c.glassBorder,
        overflow: 'hidden',
        boxShadow: c.shadow,
      }}
    >
      {Platform.OS === 'android' ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: solid }} />
      ) : (
        <BlurView intensity={40} tint={name} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: solid }} />
      )}
      <View accessibilityRole="tablist" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 }}>
        {state.routes.map((route, index) => {
          const m = meta[route.name];
          if (!m) return null;
          const focused = state.index === index;
          const Icon = m.icon;
          const onPress = () => {
            tap();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={m.badge ? `${m.label}, ${m.badge} new` : m.label}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', gap: 3 }}
            >
              <View>
                <Icon size={21} color={focused ? c.fg : c.muted} strokeWidth={focused ? 2 : 1.7} />
                {m.badge ? (
                  <View style={{ position: 'absolute', top: -5, right: -9, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt style={{ fontSize: 9.5, lineHeight: 12, color: c.onGold, fontFamily: 'Geist_600SemiBold' }}>{String(m.badge)}</Txt>
                  </View>
                ) : null}
              </View>
              <Txt variant="caption" weight={focused ? 'semibold' : 'medium'} tone={focused ? 'fg' : 'muted'} style={{ fontSize: 10.5 }} numberOfLines={1}>
                {m.label}
              </Txt>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: focused ? c.gold : 'transparent' }} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
