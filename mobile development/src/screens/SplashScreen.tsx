import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';
import ScreenBackground from '@/components/ui/ScreenBackground';
import SplashLogo, { SplashWordmark } from '@/components/ui/SplashLogo';
// When the real asset lands, uncomment the next line and pass `source={logo}`
// to <SplashLogo />.
// import logo from '../../assets/logo.png';

interface SplashScreenProps {
  /** Called once the splash animation completes (default 2.6s). */
  onContinue: () => void;
  /** Override the auto-advance delay (ms). Default 2600. */
  durationMs?: number;
}

/**
 * Branded entry experience. Sequence:
 *   0ms       background visible
 *   80ms      logo fades + scales in (halo begins pulsing)
 *   500ms     wordmark fades up
 *   900ms     tagline fades in
 *   1400ms    loader dots begin animating
 *   durationMs → onContinue() — navigator should `replace` to Login
 */
export default function SplashScreen({
  onContinue,
  durationMs = 2600,
}: SplashScreenProps) {
  const t = useThemeTokens();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordTranslate = useRef(new Animated.Value(8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(wordOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wordTranslate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const id = setTimeout(onContinue, durationMs);
    return () => clearTimeout(id);
  }, [
    durationMs,
    onContinue,
    logoOpacity,
    logoScale,
    wordOpacity,
    wordTranslate,
    taglineOpacity,
    loaderOpacity,
  ]);

  return (
    <ScreenBackground>
      <View style={styles.frame}>
        <View style={styles.center}>
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          >
            <SplashLogo /* source={logo} */ size={132} />
          </Animated.View>

          <Animated.View
            style={{
              opacity: wordOpacity,
              transform: [{ translateY: wordTranslate }],
            }}
          >
            <SplashWordmark />
          </Animated.View>

          <Animated.View style={{ opacity: taglineOpacity, marginTop: 18 }}>
            <Text
              style={[
                styles.tagline,
                { color: t.colors.textSecondary, fontSize: t.fontSize.md },
              ]}
            >
              Learn. Certify. Build your career.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: loaderOpacity }]}>
          <LoaderDots />
          <Text
            style={[
              styles.loaderLabel,
              { color: t.colors.textMuted, fontSize: t.fontSize.xs },
            ]}
          >
            PREPARING YOUR LEARNING EXPERIENCE
          </Text>
        </Animated.View>
      </View>
    </ScreenBackground>
  );
}

/** Three-dot pulse used while the splash is on screen. */
function LoaderDots() {
  const t = useThemeTokens();
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 480,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 480,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    animate(a, 0);
    animate(b, 160);
    animate(c, 320);
  }, [a, b, c]);

  const make = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) },
    ],
  });

  return (
    <View style={styles.dots}>
      <Animated.View
        style={[styles.dot, { backgroundColor: t.colors.accentPrimary }, make(a)]}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: t.colors.accentPrimary }, make(b)]}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: t.colors.accentPrimary }, make(c)]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loaderLabel: {
    fontWeight: '700',
    letterSpacing: 2,
  },
});
