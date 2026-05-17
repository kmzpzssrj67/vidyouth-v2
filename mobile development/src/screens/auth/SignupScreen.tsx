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
import { User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react-native';

import { useThemeTokens } from '@/theme/ThemeProvider';
import ScreenBackground from '@/components/ui/ScreenBackground';
import BrandMark from '@/components/ui/BrandMark';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { signup, ping } from '@/services/auth';

interface SignupScreenProps {
  /** Called after a successful account creation — navigator should push the
   *  user into the student tabs (same as a successful login). */
  onSignedUp?: () => void;
  /** Back to login. */
  onSignIn?: () => void;
}

function translateError(code: string): string {
  switch (code) {
    case 'signup_unavailable':  return 'An account with that email or mobile already exists.';
    case 'weak_password':       return 'Password needs 8+ characters with at least one letter and one number.';
    case 'invalid_request':     return 'Check the details and try again.';
    case 'network_unreachable': return 'Backend not reachable. Is the API running on localhost:8080?';
    default:                    return code.replace(/_/g, ' ');
  }
}

function scorePassword(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (p.length >= 12) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function SignupScreen({ onSignedUp, onSignIn }: SignupScreenProps) {
  const t = useThemeTokens();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    ping().then(setApiOnline);
  }, []);

  const score = scorePassword(password);
  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'];
  const strengthColors = [t.colors.textMuted, t.colors.danger, t.colors.warning, t.colors.success, t.colors.success];

  const handleSignUp = async () => {
    setError(null);
    if (!displayName.trim()) { setError('Enter your name.'); return; }
    if (!email.trim())       { setError('Enter your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password needs at least one letter and one number.'); return;
    }
    if (password !== confirm) { setError('Passwords don’t match.'); return; }

    setSubmitting(true);
    try {
      await signup({
        displayName: displayName.trim(),
        password,
        channel: 'email',
        email: email.trim(),
      });
      onSignedUp?.();
    } catch (err) {
      setError(translateError((err as Error).message));
    } finally {
      setSubmitting(false);
    }
  };

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
              Create your account
            </Text>
            <Text style={[styles.sub, { color: t.colors.textSecondary }]}>
              Start your learning journey with Vidyouth.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: t.colors.textSecondary }]}>Full name</Text>
              <GlassInput
                icon={User}
                placeholder="Priya Sharma"
                autoCapitalize="words"
                autoComplete="name"
                value={displayName}
                onChangeText={setDisplayName}
                accessibilityLabel="Full name"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: t.colors.textSecondary }]}>Email address</Text>
              <GlassInput
                icon={Mail}
                placeholder="you@vidyouth.ai"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                accessibilityLabel="Email address"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: t.colors.textSecondary }]}>Password</Text>
              <GlassInput
                icon={Lock}
                placeholder="At least 8 characters, 1 letter + 1 number"
                autoCapitalize="none"
                autoComplete="password-new"
                togglePassword
                value={password}
                onChangeText={setPassword}
                accessibilityLabel="Password"
              />
              <View style={styles.meterRow}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.meterBar,
                      {
                        backgroundColor:
                          i < score ? strengthColors[score] : t.colors.glassBorder,
                      },
                    ]}
                  />
                ))}
              </View>
              {password.length > 0 ? (
                <Text style={[styles.meterText, { color: strengthColors[score] }]}>
                  {strengthLabels[score]}
                </Text>
              ) : (
                <Text style={[styles.meterText, { color: t.colors.textMuted }]}>
                  Use 8+ characters with at least one letter and one number.
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: t.colors.textSecondary }]}>Confirm password</Text>
              <GlassInput
                icon={ShieldCheck}
                placeholder="Re-enter password"
                autoCapitalize="none"
                autoComplete="password-new"
                togglePassword
                value={confirm}
                onChangeText={setConfirm}
                accessibilityLabel="Confirm password"
              />
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: t.colors.danger }]} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <PrimaryButton
              label="Create account"
              onPress={handleSignUp}
              loading={submitting}
              icon={ArrowRight}
              style={styles.signUpBtn}
            />

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: t.colors.textMuted }]}>
                Already have an account?{' '}
              </Text>
              <Pressable
                onPress={onSignIn}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Sign in"
              >
                <Text style={[styles.footerLink, { color: t.colors.accentPrimary }]}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </GlassCard>

          {apiOnline !== null ? (
            <View
              style={[
                styles.pingPill,
                { borderColor: t.colors.glassBorder, backgroundColor: t.colors.glassBg },
              ]}
            >
              <View
                style={[
                  styles.pingDot,
                  { backgroundColor: apiOnline ? t.colors.success : t.colors.danger },
                ]}
              />
              <Text
                style={[
                  styles.pingText,
                  { color: apiOnline ? t.colors.success : t.colors.danger },
                ]}
              >
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
  brandRow: { alignItems: 'center', marginBottom: 22, marginTop: 8 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  heading: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  sub: { fontSize: 14, marginTop: 6, lineHeight: 20, fontWeight: '500' },
  fieldGroup: { marginTop: 18 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  meterRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  meterBar: { flex: 1, height: 4, borderRadius: 999 },
  meterText: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  errorText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  signUpBtn: { marginTop: 18 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    flexWrap: 'wrap',
  },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '700' },
  pingPill: {
    alignSelf: 'center',
    marginTop: 18,
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
