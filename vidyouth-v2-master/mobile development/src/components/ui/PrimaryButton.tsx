import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, LucideIcon } from 'lucide-react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';
import PressShimmer from './PressShimmer';

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Trailing icon. Defaults to ArrowRight. Pass null to hide. */
  icon?: LucideIcon | null;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon = ArrowRight,
  style,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const t = useThemeTokens();
  const Icon = icon;
  const isDisabled = disabled || loading;

  const glow = t.effects.glowIntensity;

  return (
    <PressShimmer
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      radius={t.radius.pill}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        {
          opacity: isDisabled ? 0.55 : 1,
        },
        Platform.OS === 'ios' && !isDisabled
          ? {
              shadowColor: t.colors.glowPrimary,
              shadowOpacity: 0.45 * glow + 0.05,
              shadowRadius: 18 + 8 * glow,
              shadowOffset: { width: 0, height: 8 },
            }
          : {},
        Platform.OS === 'android' && !isDisabled
          ? { elevation: t.effects.cardElevation * 0.6 }
          : {},
        style,
      ]}
      scaleOnPress
    >
      <LinearGradient
        colors={t.colors.accentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fill, { borderRadius: t.radius.pill }]}
      >
        <View style={styles.row}>
          {loading ? (
            <ActivityIndicator size="small" color={t.colors.bgPrimary} />
          ) : (
            <Text
              style={[
                styles.label,
                { color: t.colors.bgPrimary, fontSize: t.fontSize.md },
              ]}
            >
              {label}
            </Text>
          )}
          {Icon && !loading ? (
            <Icon size={18} color={t.colors.bgPrimary} style={styles.trailingIcon} />
          ) : null}
        </View>
      </LinearGradient>
    </PressShimmer>
  );
}

const styles = StyleSheet.create({
  fill: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700', letterSpacing: 0.2 },
  trailingIcon: { marginLeft: 8 },
});
