import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import RootNavigator from '@/navigation/RootNavigator';

/** Internal — waits for AsyncStorage hydration before rendering screens so
 *  the first frame already reflects the user's saved theme. */
function App() {
  const { ready, theme } = useTheme();
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }} />;
  }
  return <RootNavigator />;
}

export default function Root() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
