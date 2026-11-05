import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, TriangleAlert } from 'lucide-react-native';
import { useColors } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { success as hapticSuccess } from '@/lib/haptics';
import { Txt } from './Txt';

type Toast = { id: number; text: string; tone: 'success' | 'error' };
const ToastContext = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, tone: Toast['tone'] = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    if (tone === 'success') hapticSuccess();
    setToast({ id: Date.now(), text, tone });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 10, left: 16, right: 16, alignItems: 'center' }}>
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(350)}
            exiting={FadeOutUp.duration(250)}
            accessibilityLiveRegion="polite"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              maxWidth: 420,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: toast.tone === 'success' ? c.goldBorder : c.danger,
              backgroundColor: c.bg2,
              boxShadow: c.shadow,
            }}
          >
            {toast.tone === 'success' ? <CircleCheck size={18} color={c.goldText} /> : <TriangleAlert size={18} color={c.danger} />}
            <Txt variant="bodySm" weight="medium" style={{ flexShrink: 1 }}>
              {toast.text}
            </Txt>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
