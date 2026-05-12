import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import {
  Palette,
  Bell,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';

import { useThemeTokens } from '@/theme/ThemeProvider';
import { presetMeta } from '@/theme/presets';
import { useTheme } from '@/theme/ThemeProvider';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import PressShimmer from '@/components/ui/PressShimmer';

interface SettingsScreenProps {
  onOpenThemeStudio?: () => void;
  onLogout?: () => void;
}

interface RowProps {
  icon: LucideIcon;
  label: string;
  hint?: string;
  trailing?: string;
  danger?: boolean;
  onPress?: () => void;
}

function Row({ icon: Icon, label, hint, trailing, danger, onPress }: RowProps) {
  const t = useThemeTokens();
  const tone = danger ? t.colors.danger : t.colors.textPrimary;

  return (
    <PressShimmer onPress={onPress} radius={t.radius.lg} scaleOnPress>
      <View
        style={[
          styles.row,
          { borderRadius: t.radius.lg, backgroundColor: 'transparent' },
        ]}
      >
        <View
          style={[
            styles.iconBubble,
            {
              backgroundColor: t.colors.glassBg,
              borderColor: t.colors.glassBorder,
              borderRadius: t.radius.md,
            },
          ]}
        >
          <Icon size={18} color={tone} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: tone, fontSize: t.fontSize.md }]}>
            {label}
          </Text>
          {hint ? (
            <Text
              style={[
                styles.rowHint,
                { color: t.colors.textMuted, fontSize: t.fontSize.xs },
              ]}
            >
              {hint}
            </Text>
          ) : null}
        </View>
        {trailing ? (
          <Text
            style={[
              styles.trailing,
              { color: t.colors.textMuted, fontSize: t.fontSize.sm },
            ]}
          >
            {trailing}
          </Text>
        ) : null}
        <ChevronRight size={18} color={t.colors.textMuted} style={styles.chev} />
      </View>
    </PressShimmer>
  );
}

export default function SettingsScreen({
  onOpenThemeStudio,
  onLogout,
}: SettingsScreenProps) {
  const t = useThemeTokens();
  const { preset } = useTheme();

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: t.colors.textMuted, fontSize: t.fontSize.xs }]}>
          ACCOUNT
        </Text>
        <Text style={[styles.title, { color: t.colors.textPrimary, fontSize: t.fontSize.xxl }]}>
          Settings
        </Text>
        <Text style={[styles.lede, { color: t.colors.textSecondary, fontSize: t.fontSize.sm }]}>
          Profile, preferences and the Vidyouth Theme Studio.
        </Text>

        <Text style={[styles.group, { color: t.colors.textMuted, fontSize: t.fontSize.xs }]}>
          APPEARANCE
        </Text>
        <GlassCard padding={t.spacing.md}>
          <Row
            icon={Palette}
            label="Theme Studio"
            hint="Presets, colours, glass + shimmer"
            trailing={presetMeta[preset].label}
            onPress={onOpenThemeStudio}
          />
        </GlassCard>

        <Text style={[styles.group, { color: t.colors.textMuted, fontSize: t.fontSize.xs }]}>
          PREFERENCES
        </Text>
        <GlassCard padding={t.spacing.md}>
          <Row
            icon={Bell}
            label="Notifications"
            hint="Course reminders, live sessions"
            trailing="On"
          />
          <View style={[styles.sep, { backgroundColor: t.colors.glassBorder }]} />
          <Row
            icon={ShieldCheck}
            label="Privacy"
            hint="Data, devices, sign-in history"
          />
          <View style={[styles.sep, { backgroundColor: t.colors.glassBorder }]} />
          <Row
            icon={CreditCard}
            label="Billing"
            hint="Pro Student plan"
            trailing="₹0 due"
          />
        </GlassCard>

        <Text style={[styles.group, { color: t.colors.textMuted, fontSize: t.fontSize.xs }]}>
          SUPPORT
        </Text>
        <GlassCard padding={t.spacing.md}>
          <Row icon={HelpCircle} label="Help centre" hint="Search 200+ articles" />
        </GlassCard>

        <View style={{ height: 24 }} />
        <GlassCard padding={t.spacing.md}>
          <Row icon={LogOut} label="Sign out" danger onPress={onLogout} />
        </GlassCard>

        <Text style={[styles.foot, { color: t.colors.textMuted, fontSize: t.fontSize.xs }]}>
          Vidyouth · v1.0.0
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 16, paddingBottom: 32 },
  eyebrow: { fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  title: { fontWeight: '700', letterSpacing: -0.5, marginTop: 6 },
  lede: { fontWeight: '500', marginTop: 4, lineHeight: 20 },
  group: {
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  iconBubble: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 12,
  },
  rowLabel: { fontWeight: '600' },
  rowHint: { fontWeight: '500', marginTop: 2 },
  trailing: { fontWeight: '600', marginRight: 8 },
  chev: { marginLeft: 4 },
  sep: { height: StyleSheet.hairlineWidth, marginHorizontal: 8 },
  foot: {
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
    letterSpacing: 1.4,
  },
});
