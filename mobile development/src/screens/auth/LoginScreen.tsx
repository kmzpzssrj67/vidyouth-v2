import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Mail, Lock, ArrowRight, Smartphone } from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';

import { useThemeTokens } from '@/theme/ThemeProvider';
import ScreenBackground from '@/components/ui/ScreenBackground';
import BrandMark from '@/components/ui/BrandMark';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SocialButton from '@/components/ui/SocialButton';
import RoleSegment, { Role } from '@/components/ui/RoleSegment';
import { login, ping } from '@/services/auth';

interface LoginScreenProps {
  /** Called once the (placeholder) sign-in succeeds. The navigator uses
   *  this to push the user into the student tabs. */
  onSignIn?: () => void;
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
}

function translateAuthError(code: string): string {
  switch (code) {
    case 'invalid_credentials': return 'Email/mobile or password is wrong.';
    case 'account_locked':      return 'Account is locked. Try again in a few minutes.';
    case 'invalid_request':     return 'Check the details and try again.';
    case 'network_unreachable': return 'Backend not reachable. Is the API running on localhost:8080?';
    default:                    return code.replace(/_/g, ' ');
  }
}

function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M43.6 20.5H42V20.4H24v7.2h11.1c-1.5 4.3-5.6 7.4-10.6 7.4-6.2 0-11.2-5-11.2-11.2S18.3 12.6 24.5 12.6c2.9 0 5.5 1.1 7.5 2.9l5.1-5.1C33.7 6.9 29.4 5 24.5 5 13.7 5 5 13.7 5 24.5S13.7 44 24.5 44c10.4 0 19-7.5 19-19 0-1.5-.2-3-.4-4.5z"
        fill="#FFC107"
      />
      <Path
        d="M7.3 14.7l5.9 4.4C14.8 15.3 19.3 12.6 24.5 12.6c2.9 0 5.5 1.1 7.5 2.9l5.1-5.1C33.7 6.9 29.4 5 24.5 5 16.9 5 10.3 9 7.3 14.7z"
        fill="#FF3D00"
      />
      <Path
        d="M24.5 44c4.7 0 9-1.7 12.3-4.6l-5.7-4.7c-2 1.4-4.5 2.3-6.6 2.3-5 0-9.1-3-10.6-7.3l-5.8 4.5C10.1 39.9 16.7 44 24.5 44z"
        fill="#4CAF50"
      />
      <Path
        d="M43.6 20.5H42V20.4H24v7.2h11.1c-.7 2-2 3.7-3.7 5l5.7 4.7c-.4.4 6.4-4.7 6.4-12.8 0-1.5-.1-3-.5-4z"
        fill="#1976D2"
      />
    </Svg>
  );
}

export default function LoginScreen({
  onSignIn,
  onCreateAccount,
  onForgotPassword,
}: LoginScreenProps) {
  const t = useThemeTokens();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    ping().then(setApiOnline);
  }, []);

  const handleSignIn = async () => {
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Enter your email/mobile and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login({ identifier: identifier.trim(), password });
      onSignIn?.();
    } catch (err) {
      const code = (err as Error).message;
      setError(translateAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = () => onSignIn?.();
  const handleOtp = () => onSignIn?.();

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <BrandMark />
          </View>

          <GlassCard strong padding={t.spacing.xl} style={styles.card}>
            <Text style={[styles.heading, { color: t.colors.textPrimary }]}>
              Welcome back
            </Text>
            <Text style={[styles.sub, { color: t.colors.textSecondary }]}>
              Continue your AI-powered learning journey.
            </Text>

            <RoleSegment value={role} onChange={setRole} style={styles.segment} />

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                Email or mobile number
              </Text>
              <GlassInput
                icon={Mail}
                placeholder="you@vidyouth.ai"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={identifier}
                onChangeText={setIdentifier}
                accessibilityLabel="Email or mobile number"
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                  Password
                </Text>
                <Pressable
                  onPress={onForgotPassword}
                  hitSlop={8}
                  accessibilityRole="link"
                  accessibilityLabel="Forgot password"
                >
                  <Text style={[styles.linkSm, { color: t.colors.accentPrimary }]}>
                    Forgot password?
                  </Text>
                </Pressable>
              </View>
              <GlassInput
                icon={Lock}
                placeholder="Enter your password"
                autoCapitalize="none"
                autoComplete="password"
                togglePassword
                value={password}
                onChangeText={setPassword}
                accessibilityLabel="Password"
              />
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: t.colors.danger }]} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <PrimaryButton
              label="Sign in"
              onPress={handleSignIn}
              loading={submitting}
              icon={ArrowRight}
              style={styles.signInBtn}
            />

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: t.colors.glassBorder }]} />
              <Text style={[styles.orText, { color: t.colors.textMuted }]}>
                or continue with
              </Text>
              <View style={[styles.divider, { backgroundColor: t.colors.glassBorder }]} />
            </View>

            <View style={styles.socialRow}>
              <SocialButton
                label="Google"
                iconNode={<GoogleGlyph />}
                onPress={handleGoogle}
                style={styles.socialBtn}
              />
              <SocialButton
                label="OTP"
                icon={Smartphone}
                onPress={handleOtp}
                style={styles.socialBtn}
              />
            </View>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: t.colors.textMuted }]}>
                New to Vidyouth?{' '}
              </Text>
              <Pressable
                onPress={onCreateAccount}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Create account"
              >
                <Text style={[styles.footerLink, { color: t.colors.accentPrimary }]}>
                  Create account
                </Text>
              </Pressable>
            </View>
          </GlassCard>

          <Text style={[styles.trust, { color: t.colors.textMuted }]}>
            Learn. Certify. Build your career.
          </Text>

          {apiOnline !== null ? (
            <View style={[styles.pingPill, { borderColor: t.colors.glassBorder, backgroundColor: t.colors.glassBg }]}>
              <View style={[styles.pingDot, { backgroundColor: apiOnline ? t.colors.success : t.colors.danger }]} />
              <Text style={[styles.pingText, { color: apiOnline ? t.colors.success : t.colors.danger }]}>
                {apiOnline ? 'API online' : 'API offline'}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  brandRow: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  heading: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  sub: { fontSize: 14, marginTop: 6, lineHeight: 20, fontWeight: '500' },
  segment: { marginTop: 22 },
  fieldGroup: { marginTop: 18 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  linkSm: { fontSize: 12, fontWeight: '600' },
  signInBtn: { marginTop: 22 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 16,
    gap: 10,
  },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  orText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    flexWrap: 'wrap',
  },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '700' },
  trust: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  errorText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  pingPill: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pingDot: { width: 7, height: 7, borderRadius: 999 },
  pingText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
});
