import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';

interface BrandMarkProps {
  style?: StyleProp<ViewStyle>;
  /** Compact mode — used inside dense headers. */
  compact?: boolean;
}

/** Vidyouth logo lockup: gradient sparkle glyph + "Vidyouth" / "AI Learning Lab". */
export default function BrandMark({ style, compact = false }: BrandMarkProps) {
  const t = useThemeTokens();
  const size = compact ? 36 : 44;
  return (
    <View style={[styles.row, style]}>
      <LinearGradient
        colors={t.colors.accentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.glyph,
          {
            width: size,
            height: size,
            borderRadius: t.radius.lg,
            shadowColor: t.colors.glowPrimary,
            shadowOpacity: 0.5 * t.effects.glowIntensity,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          },
        ]}
      >
        <Sparkles size={compact ? 16 : 20} color={t.colors.bgPrimary} strokeWidth={2.4} />
      </LinearGradient>

      <View>
        <Text
          style={[
            styles.wordmark,
            {
              color: t.colors.textPrimary,
              fontSize: compact ? t.fontSize.lg : t.fontSize.xl,
            },
          ]}
        >
          Vidyouth
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: t.colors.textMuted, fontSize: t.fontSize.xs },
          ]}
        >
          AI LEARNING LAB
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  glyph: { alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontWeight: '600', letterSpacing: 2.2, marginTop: 2 },
});
