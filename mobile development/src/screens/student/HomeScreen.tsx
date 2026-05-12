import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Sparkles, BookOpen, Trophy, Clock } from 'lucide-react-native';

import { useThemeTokens } from '@/theme/ThemeProvider';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import ProgressBar from '@/components/ui/ProgressBar';
import ProgressRing from '@/components/ui/ProgressRing';
import PrimaryButton from '@/components/ui/PrimaryButton';

/** Placeholder student home — exists so the navigator has something to land on
 *  and so we can verify the global theme covers more than the login screen. */
export default function HomeScreen() {
  const t = useThemeTokens();

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: t.colors.textMuted, fontSize: t.fontSize.xs }]}>
          TODAY · WEDNESDAY 06 MAY
        </Text>
        <Text style={[styles.title, { color: t.colors.textPrimary, fontSize: t.fontSize.xxl }]}>
          Welcome back, Priya
        </Text>
        <Text style={[styles.sub, { color: t.colors.textSecondary, fontSize: t.fontSize.sm }]}>
          One lesson today and you'll hit your weekly streak.
        </Text>

        <GlassCard strong style={{ marginTop: 18 }} padding={t.spacing.lg}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={[
                  styles.heroEyebrow,
                  { color: t.colors.accentPrimary, fontSize: t.fontSize.xs },
                ]}
              >
                <Sparkles size={11} color={t.colors.accentPrimary} />  CONTINUE LEARNING
              </Text>
              <Text
                style={[
                  styles.heroTitle,
                  { color: t.colors.textPrimary, fontSize: t.fontSize.lg },
                ]}
              >
                Networking fundamentals
              </Text>
              <Text
                style={[
                  styles.heroMeta,
                  { color: t.colors.textSecondary, fontSize: t.fontSize.sm },
                ]}
              >
                Lesson 7 of 24 · ~18 min remaining
              </Text>
              <ProgressBar value={0.29} style={{ marginTop: 12 }} />
              <View style={{ marginTop: 16 }}>
                <PrimaryButton label="Resume lesson" />
              </View>
            </View>
            <ProgressRing value={0.29} size={88} stroke={9} />
          </View>
        </GlassCard>

        <Text
          style={[
            styles.section,
            { color: t.colors.textPrimary, fontSize: t.fontSize.lg },
          ]}
        >
          Your week
        </Text>
        <View style={styles.statsRow}>
          <Stat
            icon={Clock}
            label="Time learnt"
            value="4h 20m"
            tint={t.colors.accentPrimary}
          />
          <Stat
            icon={BookOpen}
            label="Lessons"
            value="11"
            tint={t.colors.success}
          />
          <Stat
            icon={Trophy}
            label="Streak"
            value="6 days"
            tint={t.colors.warning}
          />
        </View>

        <Text
          style={[
            styles.section,
            { color: t.colors.textPrimary, fontSize: t.fontSize.lg },
          ]}
        >
          Tap any card to feel the press shimmer
        </Text>
        <GlassCard
          onPress={() => {}}
          padding={t.spacing.lg}
          accessibilityLabel="Open AWS course"
        >
          <Text style={[styles.cardEyebrow, { color: t.colors.textMuted, fontSize: t.fontSize.xs }]}>
            CLOUD · 32% COMPLETE
          </Text>
          <Text style={[styles.cardTitle, { color: t.colors.textPrimary, fontSize: t.fontSize.lg }]}>
            AWS Solutions Architect
          </Text>
          <Text style={[styles.cardMeta, { color: t.colors.textSecondary, fontSize: t.fontSize.sm }]}>
            Next lesson: VPC and subnets
          </Text>
          <ProgressBar value={0.32} style={{ marginTop: 12 }} />
        </GlassCard>

        <View style={{ height: 12 }} />
        <GlassCard onPress={() => {}} padding={t.spacing.lg}>
          <Text style={[styles.cardEyebrow, { color: t.colors.textMuted, fontSize: t.fontSize.xs }]}>
            PYTHON · 78% COMPLETE
          </Text>
          <Text style={[styles.cardTitle, { color: t.colors.textPrimary, fontSize: t.fontSize.lg }]}>
            Python for Data Science
          </Text>
          <Text style={[styles.cardMeta, { color: t.colors.textSecondary, fontSize: t.fontSize.sm }]}>
            Next lesson: Pandas joins and merges
          </Text>
          <ProgressBar value={0.78} style={{ marginTop: 12 }} />
        </GlassCard>
      </ScrollView>
    </ScreenBackground>
  );
}

interface StatProps {
  icon: any;
  label: string;
  value: string;
  tint: string;
}

function Stat({ icon: Icon, label, value, tint }: StatProps) {
  const t = useThemeTokens();
  return (
    <View style={{ flex: 1 }}>
      <GlassCard padding={t.spacing.md}>
        <Icon size={18} color={tint} />
        <Text
          style={[
            styles.statValue,
            { color: t.colors.textPrimary, fontSize: t.fontSize.xl },
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.statLabel,
            { color: t.colors.textMuted, fontSize: t.fontSize.xs },
          ]}
        >
          {label.toUpperCase()}
        </Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 16, paddingBottom: 32 },
  eyebrow: { fontWeight: '700', letterSpacing: 1.6 },
  title: { fontWeight: '700', letterSpacing: -0.5, marginTop: 6 },
  sub: { fontWeight: '500', marginTop: 4, lineHeight: 20 },
  section: { fontWeight: '700', letterSpacing: -0.3, marginTop: 24, marginBottom: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroEyebrow: { fontWeight: '700', letterSpacing: 1.4 },
  heroTitle: { fontWeight: '700', letterSpacing: -0.4, marginTop: 8 },
  heroMeta: { fontWeight: '500', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statValue: { fontWeight: '700', letterSpacing: -0.4, marginTop: 8 },
  statLabel: { fontWeight: '700', letterSpacing: 1.4, marginTop: 2 },
  cardEyebrow: { fontWeight: '700', letterSpacing: 1.4 },
  cardTitle: { fontWeight: '700', letterSpacing: -0.4, marginTop: 6 },
  cardMeta: { fontWeight: '500', marginTop: 4 },
});
