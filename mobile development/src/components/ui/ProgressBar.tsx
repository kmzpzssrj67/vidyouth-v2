import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeTokens } from '@/theme/ThemeProvider';

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  /** Track height in px. Default 8. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export default function ProgressBar({ value, height = 8, style }: ProgressBarProps) {
  const t = useThemeTokens();
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: t.colors.glassBg,
          borderColor: t.colors.glassBorder,
          height,
          borderRadius: height,
        },
        style,
      ]}
    >
      <View style={[styles.fill, { width: `${v * 100}%`, borderRadius: height }]}>
        <LinearGradient
          colors={t.colors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: height }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fill: {
    height: '100%',
    overflow: 'hidden',
  },
});
