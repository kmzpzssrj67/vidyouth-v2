/**
 * PressShimmer — wraps children in a Pressable with a light-bar sweep that
 * fires on press-in. Replaces the web hover shimmer for touch.
 *
 *   <PressShimmer onPress={...}>
 *     <Card />
 *   </PressShimmer>
 *
 * Honours `theme.effects.shimmerEnabled` and `theme.effects.shimmerIntensity`.
 */

import React, { ReactNode, useRef, useState } from 'react';
import {
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  LayoutChangeEvent,
  PressableProps,
  AccessibilityRole,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeTokens } from '@/theme/ThemeProvider';

interface PressShimmerProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;

  /** Override radius (defaults to theme.radius.xxl). Required for the
   *  shimmer overlay to clip correctly. */
  radius?: number;

  /** Outer container style — pass margin/width here. */
  style?: StyleProp<ViewStyle>;

  /** Set false on big inert hero panels that shouldn't subtly compress. */
  scaleOnPress?: boolean;

  /** Accessibility role passed to Pressable. */
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;

  /** Hit-slop expansion in pixels for small targets. */
  hitSlop?: PressableProps['hitSlop'];
}

export default function PressShimmer({
  children,
  onPress,
  onLongPress,
  disabled = false,
  radius,
  style,
  scaleOnPress = true,
  accessibilityRole,
  accessibilityLabel,
  hitSlop,
}: PressShimmerProps) {
  const { colors, effects, radius: r } = useThemeTokens();
  const cornerRadius = radius ?? r.xxl;

  const opacity = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const inactive = disabled || !effects.shimmerEnabled;

  const pressIn = () => {
    if (scaleOnPress) {
      Animated.timing(scale, {
        toValue: 0.985,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    if (inactive) return;
    sweep.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: effects.shimmerIntensity,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sweep, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pressOut = () => {
    if (scaleOnPress) {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    if (inactive) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  // sweep gradient travels from -width → +width
  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || (!onPress && !onLongPress)}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={style}
    >
      <Animated.View
        onLayout={onLayout}
        style={[
          styles.outer,
          { borderRadius: cornerRadius, transform: [{ scale }] },
        ]}
      >
        {children}

        {!inactive && width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              styles.overlay,
              {
                opacity,
                borderRadius: cornerRadius,
              },
            ]}
          >
            <Animated.View
              style={{
                width: width * 0.75,
                height: '100%',
                transform: [{ translateX }],
              }}
            >
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0)',
                  colors.shimmerSecondary,
                  colors.shimmerPrimary,
                  colors.shimmerSecondary,
                  'rgba(255,255,255,0)',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  overlay: {
    overflow: 'hidden',
  },
});
