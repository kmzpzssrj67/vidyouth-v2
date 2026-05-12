import React, { ReactNode } from 'react';
import { Text, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';
import PressShimmer from './PressShimmer';

interface SocialButtonProps {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  iconNode?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Glass secondary action with brand-coloured icon (Google, OTP, Apple, etc.). */
export default function SocialButton({
  label,
  onPress,
  icon: Icon,
  iconNode,
  style,
}: SocialButtonProps) {
  const t = useThemeTokens();
  return (
    <PressShimmer
      onPress={onPress}
      radius={t.radius.pill}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={style}
    >
      <View
        style={[
          styles.wrap,
          {
            borderRadius: t.radius.pill,
            backgroundColor: t.colors.glassBg,
            borderColor: t.colors.glassBorder,
          },
        ]}
      >
        <View style={styles.row}>
          {iconNode ?? (Icon ? <Icon size={18} color={t.colors.textPrimary} /> : null)}
          <Text
            style={[
              styles.label,
              { color: t.colors.textPrimary, fontSize: t.fontSize.md },
            ]}
          >
            {label}
          </Text>
        </View>
      </View>
    </PressShimmer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 52,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: { fontWeight: '600', letterSpacing: 0.1 },
});
