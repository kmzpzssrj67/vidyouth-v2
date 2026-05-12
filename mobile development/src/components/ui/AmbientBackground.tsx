import React from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeTokens } from '@/theme/ThemeProvider';

/**
 * Full-screen layered background. Three radial blobs simulate the bokeh
 * aura system from the web dashboard. Reads colours from the active theme.
 */
export default function AmbientBackground() {
  const t = useThemeTokens();
  const { width, height } = useWindowDimensions();
  const blobSize = Math.max(width, height) * 0.85;

  const blob: ViewStyle = {
    position: 'absolute',
    width: blobSize,
    height: blobSize,
    borderRadius: blobSize / 2,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[t.colors.bgGradientStart, t.colors.bgPrimary, t.colors.bgGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          blob,
          {
            top: -blobSize * 0.45,
            right: -blobSize * 0.35,
            backgroundColor: t.colors.auraA,
            opacity: 0.9,
          },
        ]}
      />
      <View
        style={[
          blob,
          {
            top: height * 0.25,
            left: -blobSize * 0.5,
            backgroundColor: t.colors.auraB,
            opacity: 0.8,
          },
        ]}
      />
      <View
        style={[
          blob,
          {
            bottom: -blobSize * 0.4,
            right: -blobSize * 0.4,
            backgroundColor: t.colors.auraC,
            opacity: 0.85,
          },
        ]}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
