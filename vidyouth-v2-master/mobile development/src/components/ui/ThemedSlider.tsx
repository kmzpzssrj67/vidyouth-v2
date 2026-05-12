import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Slider from '@react-native-community/slider';
import { useThemeTokens } from '@/theme/ThemeProvider';

interface ThemedSliderProps {
  label: string;
  /** Optional formatted value displayed beside the label (e.g. "55%"). */
  valueLabel?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (n: number) => void;
  /** Called once on touch end — use this to persist to AsyncStorage. */
  onSlidingComplete?: (n: number) => void;
  style?: StyleProp<ViewStyle>;
}

/** Themed wrapper around @react-native-community/slider with row label/value. */
export default function ThemedSlider({
  label,
  valueLabel,
  value,
  min = 0,
  max = 1,
  step,
  onValueChange,
  onSlidingComplete,
  style,
}: ThemedSliderProps) {
  const t = useThemeTokens();
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: t.colors.textSecondary, fontSize: t.fontSize.sm }]}>
          {label}
        </Text>
        {valueLabel ? (
          <Text
            style={[
              styles.value,
              { color: t.colors.textMuted, fontSize: t.fontSize.sm },
            ]}
          >
            {valueLabel}
          </Text>
        ) : null}
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step ?? 0}
        value={value}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={t.colors.accentPrimary}
        maximumTrackTintColor={t.colors.glassBorder}
        thumbTintColor={t.colors.accentPrimary}
        style={styles.slider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: { fontWeight: '600', letterSpacing: 0.2 },
  value: { fontWeight: '600' },
  slider: { width: '100%', height: 32 },
});
