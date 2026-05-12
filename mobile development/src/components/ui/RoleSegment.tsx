import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeTokens } from '@/theme/ThemeProvider';

export type Role = 'student' | 'admin' | 'organisation';

interface RoleSegmentProps {
  value: Role;
  onChange: (next: Role) => void;
  style?: StyleProp<ViewStyle>;
}

const ROLES: { key: Role; label: string }[] = [
  { key: 'student', label: 'Student' },
  { key: 'admin', label: 'Admin' },
  { key: 'organisation', label: 'Organisation' },
];

/**
 * Three-pill segmented control. Active fills with the accent gradient;
 * inactive pills are translucent glass. UI-only — caller owns state.
 */
export default function RoleSegment({ value, onChange, style }: RoleSegmentProps) {
  const t = useThemeTokens();
  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: t.colors.glassBg,
          borderColor: t.colors.glassBorder,
          borderRadius: t.radius.pill,
          padding: 4,
        },
        style,
      ]}
    >
      {ROLES.map((r) => {
        const active = r.key === value;
        return (
          <Pressable
            key={r.key}
            onPress={() => onChange(r.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Select ${r.label} role`}
            style={[
              styles.pill,
              { borderRadius: t.radius.pill },
              active && {
                shadowColor: t.colors.glowPrimary,
                shadowOpacity: 0.45 * t.effects.glowIntensity,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              },
            ]}
          >
            {active ? (
              <LinearGradient
                colors={t.colors.accentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: t.radius.pill }]}
              />
            ) : null}
            <Text
              style={[
                styles.label,
                {
                  color: active ? t.colors.bgPrimary : t.colors.textSecondary,
                  fontSize: t.fontSize.sm,
                  fontWeight: active ? '700' : '600',
                },
              ]}
            >
              {r.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignSelf: 'stretch',
  },
  pill: {
    flex: 1,
    overflow: 'hidden',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  label: { letterSpacing: 0.2 },
});
