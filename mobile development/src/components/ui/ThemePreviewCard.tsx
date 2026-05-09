import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeTokens } from '@/theme/ThemeProvider';
import GlassCard from './GlassCard';
import ProgressBar from './ProgressBar';

/**
 * Live preview surface used inside Theme Studio. Shows a mini glass card,
 * sample button, progress bar, and text hierarchy — all bound to the
 * current theme so users can see their tweaks in real time.
 */
export default function ThemePreviewCard() {
  const t = useThemeTokens();

  return (
    <GlassCard strong padding={t.spacing.lg}>
      <Text
        style={[
          styles.eyebrow,
          { color: t.colors.textMuted, fontSize: t.fontSize.xs },
        ]}
      >
        LIVE PREVIEW
      </Text>
      <Text
        style={[
          styles.h,
          { color: t.colors.textPrimary, fontSize: t.fontSize.xl },
        ]}
      >
        Continue your AI journey
      </Text>
      <Text
        style={[
          styles.sub,
          { color: t.colors.textSecondary, fontSize: t.fontSize.sm },
        ]}
      >
        Lesson 7 of 24 · 18 min remaining
      </Text>

      <ProgressBar value={0.29} style={styles.progress} />

      <View style={styles.row}>
        <View
          style={[
            styles.btnGhost,
            {
              borderRadius: t.radius.pill,
              backgroundColor: t.colors.glassBg,
              borderColor: t.colors.glassBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.btnGhostLabel,
              { color: t.colors.textPrimary, fontSize: t.fontSize.sm },
            ]}
          >
            Skip
          </Text>
        </View>

        <LinearGradient
          colors={t.colors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btnPrimary, { borderRadius: t.radius.pill }]}
        >
          <Text
            style={[
              styles.btnPrimaryLabel,
              { color: t.colors.bgPrimary, fontSize: t.fontSize.sm },
            ]}
          >
            Resume lesson
          </Text>
        </LinearGradient>
      </View>

      <View
        style={[
          styles.metaRow,
          { borderTopColor: t.colors.glassBorder },
        ]}
      >
        <Text
          style={[
            styles.meta,
            { color: t.colors.success, fontSize: t.fontSize.xs },
          ]}
        >
          ● On track
        </Text>
        <Text
          style={[
            styles.meta,
            { color: t.colors.warning, fontSize: t.fontSize.xs },
          ]}
        >
          ● 2 due
        </Text>
        <Text
          style={[
            styles.meta,
            { color: t.colors.danger, fontSize: t.fontSize.xs },
          ]}
        >
          ● 1 overdue
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontWeight: '700', letterSpacing: 1.6 },
  h: { fontWeight: '700', letterSpacing: -0.4, marginTop: 8 },
  sub: { fontWeight: '500', marginTop: 4, lineHeight: 18 },
  progress: { marginTop: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  btnGhostLabel: { fontWeight: '600' },
  btnPrimary: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    flex: 1,
    alignItems: 'center',
  },
  btnPrimaryLabel: { fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  meta: { fontWeight: '600' },
});
