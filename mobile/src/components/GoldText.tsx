import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/tokens';
import { Txt, type TextVariant } from './Txt';

/**
 * Website .text-gold-gradient: text filled with the gold gradient
 * (#b8922c → #d6b34a → #f6e2a0 in dark, deeper golds in light).
 * A transparent copy of the text sets the layout; an SVG draws the gradient fill on top.
 */
export function GoldText({ children, variant = 'display', upper = true }: { children: string; variant?: TextVariant; upper?: boolean }) {
  const c = useColors();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const t = type[variant];
  const text = upper ? children.toUpperCase() : children;
  const stops = c.goldGradient;
  return (
    <View accessible accessibilityLabel={children}>
      <Txt
        variant={variant}
        style={{ color: 'transparent' }}
        onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        importantForAccessibility="no"
      >
        {text}
      </Txt>
      {box ? (
        <Svg width={box.w + 4} height={box.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id={`gold${id}`} x1="0" y1="0" x2="1" y2="0.2">
              {stops.map((s, i) => (
                <Stop key={i} offset={[0, 0.3, 0.52, 0.72, 1][i]} stopColor={s} />
              ))}
            </LinearGradient>
          </Defs>
          <SvgText
            x={0}
            y={box.h / 2 + t.fontSize * 0.355}
            fill={`url(#gold${id})`}
            fontFamily={fonts.semibold}
            fontSize={t.fontSize}
            letterSpacing={t.letterSpacing}
          >
            {text}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}
