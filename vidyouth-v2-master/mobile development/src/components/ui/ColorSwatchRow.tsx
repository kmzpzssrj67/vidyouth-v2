import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';

interface ColorSwatchRowProps {
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}

/**
 * One row of the Theme Studio "Custom colours" section: label + current
 * swatch + horizontal strip of preset swatches. Tap a swatch to apply.
 */
export default function ColorSwatchRow({
  label,
  value,
  options,
  onChange,
}: ColorSwatchRowProps) {
  const t = useThemeTokens();
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.label, { color: t.colors.textSecondary, fontSize: t.fontSize.sm }]}>
          {label}
        </Text>
        <View
          style={[
            styles.currentDot,
            {
              backgroundColor: value,
              borderColor: t.colors.glassBorderStrong,
            },
          ]}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {options.map((c) => {
            const active = c.toLowerCase() === value.toLowerCase();
            return (
              <Pressable
                key={c}
                onPress={() => onChange(c)}
                accessibilityRole="button"
                accessibilityLabel={`Use ${c}`}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: c,
                    borderColor: active ? t.colors.accentPrimary : t.colors.glassBorder,
                    borderWidth: active ? 2.5 : 1,
                  },
                ]}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { fontWeight: '600', letterSpacing: 0.2 },
  currentDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
