/**
 * Lightweight stack-style navigator using React state.
 *
 * Why not React Navigation yet:
 *   - works identically on web preview and native
 *   - zero native modules to wire
 *   - the goal here is to prove the theme covers every screen, which this
 *     does. Swap to @react-navigation/native + native-stack + bottom-tabs
 *     when shipping to TestFlight / Play Internal.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Home as HomeIcon,
  Settings as SettingsIcon,
  Palette,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, Text } from 'react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';

import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import HomeScreen from '@/screens/student/HomeScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import ThemeStudioScreen from '@/screens/settings/ThemeStudioScreen';

type Route =
  | { name: 'splash' }
  | { name: 'login' }
  | { name: 'tabs'; tab: 'home' | 'settings' }
  | { name: 'theme-studio' };

export default function RootNavigator() {
  // App always boots into Splash. SplashScreen calls onContinue() after its
  // intro animation, replacing itself with Login (no back-stack entry).
  const [route, setRoute] = useState<Route>({ name: 'splash' });

  const goLogin = () => setRoute({ name: 'login' });
  const goTabs = (tab: 'home' | 'settings' = 'home') =>
    setRoute({ name: 'tabs', tab });
  const goThemeStudio = () => setRoute({ name: 'theme-studio' });

  if (route.name === 'splash') {
    return <SplashScreen onContinue={goLogin} />;
  }

  if (route.name === 'login') {
    return <LoginScreen onSignIn={() => goTabs('home')} />;
  }

  if (route.name === 'theme-studio') {
    return <ThemeStudioScreen onBack={() => goTabs('settings')} />;
  }

  return (
    <View style={styles.tabsRoot}>
      <View style={styles.tabsBody}>
        {route.tab === 'home' ? (
          <HomeScreen />
        ) : (
          <SettingsScreen
            onOpenThemeStudio={goThemeStudio}
            onLogout={goLogin}
          />
        )}
      </View>
      <TabBar
        active={route.tab}
        onSelect={(tab) => setRoute({ name: 'tabs', tab })}
        onPalette={goThemeStudio}
      />
    </View>
  );
}

interface TabBarProps {
  active: 'home' | 'settings';
  onSelect: (next: 'home' | 'settings') => void;
  onPalette: () => void;
}

function TabBar({ active, onSelect, onPalette }: TabBarProps) {
  const t = useThemeTokens();
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: t.colors.glassBgStrong,
          borderTopColor: t.colors.glassBorder,
        },
      ]}
    >
      <TabItem
        icon={HomeIcon}
        label="Home"
        active={active === 'home'}
        onPress={() => onSelect('home')}
      />
      <TabItem
        icon={Palette}
        label="Theme"
        active={false}
        onPress={onPalette}
        accent
      />
      <TabItem
        icon={SettingsIcon}
        label="Settings"
        active={active === 'settings'}
        onPress={() => onSelect('settings')}
      />
    </View>
  );
}

interface TabItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
  accent?: boolean;
}

function TabItem({ icon: Icon, label, active, onPress, accent }: TabItemProps) {
  const t = useThemeTokens();
  const tint = accent
    ? t.colors.accentPrimary
    : active
    ? t.colors.accentPrimary
    : t.colors.textMuted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={styles.tabItem}
      hitSlop={8}
    >
      <Icon size={20} color={tint} />
      <Text
        style={{
          color: tint,
          fontWeight: active || accent ? '700' : '600',
          letterSpacing: 0.2,
          fontSize: t.fontSize.xs,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabsRoot: { flex: 1 },
  tabsBody: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
