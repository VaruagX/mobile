import { useEffect, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

export const easeOutExpo = Easing.bezier(...motion.easeOutExpo);
export const easeInOutQuart = Easing.bezier(...motion.easeInOutQuart);

/** Website .hero-fade / [data-reveal]: fade up 18px with the expo-out curve. */
export function Reveal({
  children,
  delay = 0,
  distance = 18,
  duration = motion.fadeUp,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(delay, withTiming(1, { duration, easing: easeOutExpo }));
  }, [delay, duration, p, reduced]);
  const animated = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * distance }],
  }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** Website .hero-line: each headline line slides up from behind a mask. */
export function MaskLine({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  const [height, setHeight] = useState(0);
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced || !height) return;
    p.value = withDelay(delay, withTiming(1, { duration: motion.lineUp, easing: easeOutExpo }));
  }, [delay, height, p, reduced]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * height * 1.08 }],
  }));
  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View
        style={[animated, !height && !reduced ? { opacity: 0 } : null]}
        onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/** Website .pulse-dot: blue dot with an expanding ring. */
export function PulseDot({ color }: { color?: string }) {
  const c = useColors();
  const tint = color ?? c.blue;
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration: 2000, easing: easeOutExpo }), -1, false);
  }, [p, reduced]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.9 * (1 - p.value),
    transform: [{ scale: 0.6 + 1.3 * p.value }],
  }));
  return (
    <View style={{ width: 7, height: 7 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tint }} />
      <Animated.View
        style={[
          { position: 'absolute', left: -4, top: -4, width: 15, height: 15, borderRadius: 8, borderWidth: 1, borderColor: tint },
          ring,
        ]}
      />
    </View>
  );
}

/** Gentle vertical float (website .wwb-float, 9px). */
export function Float({ children, distance = 9, duration = 3600 }: { children: ReactNode; distance?: number; duration?: number }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [duration, p, reduced]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: -distance * p.value }] }));
  return <Animated.View style={animated}>{children}</Animated.View>;
}

/** Animated width for progress fills. */
export function useGrow(target: number, delay = 200) {
  const reduced = useReducedMotion();
  const v = useSharedValue(reduced ? target : 0);
  useEffect(() => {
    v.value = reduced ? target : withDelay(delay, withTiming(target, { duration: 1100, easing: easeOutExpo }));
  }, [delay, reduced, target, v]);
  return useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, v.value))}%` }));
}
