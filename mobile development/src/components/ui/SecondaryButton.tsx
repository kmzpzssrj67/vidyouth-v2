import React from 'react';
import { Text, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';
import PressShimmer from './PressShimmer';

interface SecondaryButtonProps {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
  /** When true, fills width 100%. */
  block?: boolean;
  /** Removes background fill, just an outlined ghost button. */
  ghost?: boolean;
  accessibilityLabel?: string;
}

/**
 * Glass / outlined alternative to PrimaryButton. Used for cancel actions,
 * "Reset", filter chips, etc. Press-shimmer enabled.
 */
export default function SecondaryButton({
  label,
  onPress,
  icon: Icon,
  style,
  block = false,
  ghost = false,
  accessibilityLabel,
}: SecondaryButtonProps) {
  const t = useThemeTokens();

  return (
    <PressShimmer
      onPress={onPress}
      radius={t.radius.pill}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[block && styles.block, style]}
    >
      <View
        style={[
          styles.fill,
          {
            borderRadius: t.radius.pill,
            backgroundColor: ghost ? 'transparent' : t.colors.glassBg,
            borderColor: t.colors.glassBorder,
          },
        ]}
      >
        {Icon ? (
          <Icon size={16} color={t.colors.textPrimary} style={styles.icon} />
        ) : null}
        <Text
          style={[
            styles.label,
            { color: t.colors.textPrimary, fontSize: t.fontSize.md },
          ]}
        >
          {label}
        </Text>
      </View>
    </PressShimmer>
  );
}

const styles = StyleSheet.create({
  block: { alignSelf: 'stretch' },
  fill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 50,
  },
  icon: { marginRight: 8 },
  label: { fontWeight: '600', letterSpacing: 0.15 },
});
