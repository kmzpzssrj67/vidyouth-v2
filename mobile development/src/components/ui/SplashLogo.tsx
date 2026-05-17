import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, ImageSourcePropType } from 'react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';
import VidyouthLogoSvg from './VidyouthLogoSvg';

interface SplashLogoProps {
  /** Drop a real PNG/SVG-as-PNG here when the asset is ready. If omitted,
   *  the SVG Vidyouth Intelligence Institute badge is rendered. */
  source?: ImageSourcePropType;
  /** Diameter of the logo glyph in pixels. Default 132. */
  size?: number;
}

/**
 * Hero logo lockup used on the Splash screen. Two layered halos pulse
 * behind the Vidyouth Intelligence Institute badge (or a provided image),
 * with the institutional wordmark below.
 *
 *   <SplashLogo source={require('./assets/logo.png')} />
 */
export default function SplashLogo({ source, size = 132 }: SplashLogoProps) {
  const t = useThemeTokens();

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });
  const innerHaloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const haloSize = size * 1.9;
  const innerHaloSize = size * 1.35;

  return (
    <View style={[styles.wrap, { minWidth: haloSize, minHeight: haloSize }]}>
      {/* outer halo */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            backgroundColor: t.colors.auraA,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      {/* inner halo */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: innerHaloSize,
            height: innerHaloSize,
            borderRadius: innerHaloSize / 2,
            backgroundColor: t.colors.auraB,
            opacity: 0.7,
            transform: [{ scale: innerHaloScale }],
          },
        ]}
      />

      {/* glyph — real PNG when supplied, else the SVG badge */}
      <View
        style={[
          styles.glyphRing,
          {
            width: size + 18,
            height: size + 18,
            borderRadius: (size + 18) / 2,
            borderColor: t.colors.glassBorderStrong,
            backgroundColor: '#FFFFFF',
            shadowColor: t.colors.glowPrimary,
            shadowOpacity: 0.55 * t.effects.glowIntensity + 0.05,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
          },
        ]}
      >
        {source ? (
          <Image
            source={source}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : (
          <VidyouthLogoSvg size={size} accent="#22C55E" background="#FFFFFF" />
        )}
      </View>
    </View>
  );
}

interface SplashWordmarkProps {
  /** Show the institutional sub-line. Default true. */
  institutional?: boolean;
}

/** Wordmark block: brand name + AI Learning Lab + institutional fineprint. */
export function SplashWordmark({ institutional = true }: SplashWordmarkProps) {
  const t = useThemeTokens();
  return (
    <View style={styles.wordmarkWrap}>
      <Text
        style={[
          styles.brand,
          { color: t.colors.textPrimary, fontSize: t.fontSize.display },
        ]}
      >
        Vidyouth
      </Text>
      <View
        style={[
          styles.divider,
          { backgroundColor: t.colors.glassBorderStrong },
        ]}
      />
      <Text
        style={[
          styles.aiLab,
          { color: t.colors.accentPrimary, fontSize: t.fontSize.sm },
        ]}
      >
        AI LEARNING LAB
      </Text>
      {institutional ? (
        <Text
          style={[
            styles.institute,
            { color: t.colors.textMuted, fontSize: t.fontSize.xs },
          ]}
        >
          INTELLIGENCE INSTITUTE PVT. LTD.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
  glyphRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  wordmarkWrap: {
    alignItems: 'center',
    marginTop: 28,
  },
  brand: {
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  divider: {
    width: 32,
    height: StyleSheet.hairlineWidth * 2,
    marginVertical: 14,
  },
  aiLab: {
    fontWeight: '700',
    letterSpacing: 4.8,
  },
  institute: {
    marginTop: 10,
    fontWeight: '600',
    letterSpacing: 2.4,
  },
});
