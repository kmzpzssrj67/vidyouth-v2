import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeTokens } from '@/theme/ThemeProvider';

interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  /** Centered label. Defaults to percentage. */
  label?: string;
  showPercent?: boolean;
}

export default function ProgressRing({
  value,
  size = 80,
  stroke = 8,
  label,
  showPercent = true,
}: ProgressRingProps) {
  const t = useThemeTokens();
  const v = Math.max(0, Math.min(1, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - v);
  const id = 'pr-grad';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={t.colors.accentGradient[0]} />
            <Stop offset="1" stopColor={t.colors.accentGradient[1]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={t.colors.glassBorder}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.labelWrap}>
          <Text style={[styles.label, { color: t.colors.textPrimary, fontSize: t.fontSize.md }]}>
            {label ?? (showPercent ? `${Math.round(v * 100)}%` : '')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  labelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700' },
});
