import React, { ReactNode } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useThemeTokens } from '@/theme/ThemeProvider';
import AmbientBackground from './AmbientBackground';

interface ScreenBackgroundProps {
  children: ReactNode;
  edges?: readonly Edge[];
  /** Render a SafeAreaView on top of the background. Default true. */
  safe?: boolean;
}

/**
 * Standard screen wrapper: ambient gradient + glow blobs + SafeAreaView.
 * Use as the outermost element of every screen so the theme's background
 * always shows through consistently.
 */
export default function ScreenBackground({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  safe = true,
}: ScreenBackgroundProps) {
  const t = useThemeTokens();
  const Inner = safe ? SafeAreaView : View;
  return (
    <View style={[styles.root, { backgroundColor: t.colors.bgPrimary }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <AmbientBackground />
      <Inner style={styles.inner} edges={edges as Edge[]}>
        {children}
      </Inner>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
});
