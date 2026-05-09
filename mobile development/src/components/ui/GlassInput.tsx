import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LucideIcon, Eye, EyeOff } from 'lucide-react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  icon?: LucideIcon;
  /** Show/hide eye toggle for password fields. Sets secureTextEntry automatically. */
  togglePassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const GlassInput = forwardRef<TextInput, GlassInputProps>(function GlassInput(
  {
    icon: Icon,
    togglePassword = false,
    containerStyle,
    accessibilityLabel,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const t = useThemeTokens();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(togglePassword);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: t.colors.glassBg,
          borderColor: focused ? t.colors.accentPrimary : t.colors.glassBorder,
          borderRadius: t.radius.lg,
          paddingHorizontal: t.spacing.md,
        },
        containerStyle,
      ]}
    >
      {Icon ? (
        <Icon
          size={18}
          color={focused ? t.colors.accentPrimary : t.colors.textMuted}
          style={styles.leadingIcon}
        />
      ) : null}

      <TextInput
        ref={ref}
        {...rest}
        accessibilityLabel={accessibilityLabel}
        secureTextEntry={togglePassword ? hidden : rest.secureTextEntry}
        placeholderTextColor={t.colors.textMuted}
        selectionColor={t.colors.accentPrimary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { color: t.colors.textPrimary, fontSize: t.fontSize.md },
        ]}
      />

      {togglePassword ? (
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          style={styles.trailingTap}
        >
          {hidden ? (
            <Eye size={18} color={t.colors.textSecondary} />
          ) : (
            <EyeOff size={18} color={t.colors.textSecondary} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 52,
  },
  leadingIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontWeight: '500' },
  trailingTap: { paddingLeft: 8, paddingVertical: 8 },
});

export default GlassInput;
