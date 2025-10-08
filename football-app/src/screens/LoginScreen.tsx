import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  authenticateWithSocialProvider,
  loginUser,
  loginWithBiometrics,
  loginWithMobileNumber,
  selectAuthLoading,
  selectBiometricEnabledUsers,
} from '../store/slices/authSlice';
import { detectBiometricSupport, requestBiometricAuthentication } from '../services/biometricAuth';
import { getMockOtpCode, sendMockOtpToPhone, verifyMockOtpCode } from '../services/mobileAuth';
import type { SocialProvider } from '../services/socialAuth';

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const biometricUsers = useAppSelector(selectBiometricEnabledUsers);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState<string | null>(null);
  const [activeSocialProvider, setActiveSocialProvider] = useState<SocialProvider | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileCode, setMobileCode] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileSubmitting, setMobileSubmitting] = useState(false);
  const demoOtpCode = useMemo(() => getMockOtpCode(), []);

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Unable to sign in. Please try again.';
      Alert.alert('Login failed', message);
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, email, password]);

  const handleSocialSignIn = useCallback(
    async (provider: SocialProvider) => {
      if (activeSocialProvider) {
        return;
      }

      setActiveSocialProvider(provider);
      try {
        await dispatch(authenticateWithSocialProvider({ provider })).unwrap();
      } catch (error) {
        const message =
          typeof error === 'string'
            ? error
            : 'Unable to connect to that provider right now. Please try again.';
        Alert.alert('Sign in failed', message);
      } finally {
        setActiveSocialProvider(null);
      }
    },
    [activeSocialProvider, dispatch],
  );

  const handleSendMobileOtp = useCallback(async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Missing mobile number', 'Enter your mobile number to receive a code.');
      return;
    }

    setMobileSending(true);
    try {
      const code = await sendMockOtpToPhone(mobileNumber);
      setMobileOtpSent(true);
      Alert.alert('Verification code sent', `Use code ${code} to verify your mobile number.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'We could not send a verification code. Please try again shortly.';
      Alert.alert('Unable to send code', message);
    } finally {
      setMobileSending(false);
    }
  }, [mobileNumber]);

  const handleMobileLogin = useCallback(async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Missing mobile number', 'Enter your mobile number to continue.');
      return;
    }

    if (!mobileOtpSent) {
      Alert.alert('Verification required', 'Send yourself a verification code first.');
      return;
    }

    if (!mobileCode.trim()) {
      Alert.alert('Missing code', 'Enter the 6-digit verification code.');
      return;
    }

    setMobileSubmitting(true);
    try {
      const verified = await verifyMockOtpCode(mobileCode);
      if (!verified) {
        Alert.alert('Invalid code', 'The verification code you entered is incorrect.');
        return;
      }

      await dispatch(loginWithMobileNumber({ phoneNumber: mobileNumber })).unwrap();
      setMobileCode('');
      setMobileOtpSent(false);
    } catch (error) {
      const message =
        typeof error === 'string' ? error : 'Unable to sign in with that mobile number right now.';
      Alert.alert('Sign in failed', message);
    } finally {
      setMobileSubmitting(false);
    }
  }, [dispatch, mobileCode, mobileNumber, mobileOtpSent]);

  const handleBiometricLogin = useCallback(
    async (userId: string) => {
      const targetUser = biometricUsers.find((user) => user.id === userId);
      if (!targetUser) {
        return;
      }

      setBiometricError(null);
      setBiometricLoading(userId);

      try {
        const support = await detectBiometricSupport();

        if (!support.available) {
          const message = 'This device does not support biometric authentication.';
          Alert.alert('Biometrics not supported', message);
          setBiometricError(message);
          return;
        }

        if (!support.enrolled) {
          const message =
            'Set up Face ID, Touch ID or fingerprint unlock on your device to use biometric sign in.';
          Alert.alert('Biometrics not set up', message);
          setBiometricError(message);
          return;
        }

        const authResult = await requestBiometricAuthentication('Sign in to Football App');
        if (!authResult.success) {
          const message = authResult.error ?? 'We could not verify your identity with biometrics.';
          Alert.alert('Authentication failed', message);
          setBiometricError(message);
          return;
        }

        await dispatch(loginWithBiometrics({ userId: targetUser.id })).unwrap();
      } catch (error) {
        const message =
          typeof error === 'string'
            ? error
            : 'Unable to complete biometric sign in. Please try again.';
        Alert.alert('Sign in failed', message);
        setBiometricError(message);
      } finally {
        setBiometricLoading(null);
      }
    },
    [biometricUsers, dispatch],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={64}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your teams and competitions.</Text>

          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Quick sign in</Text>
            <Text style={styles.quickActionsSubtitle}>
              Choose a social account or verify with your mobile number.
            </Text>

            <TouchableOpacity
              style={[
                styles.socialButton,
                styles.googleButton,
                (activeSocialProvider && activeSocialProvider !== 'google') || loading
                  ? styles.socialButtonDisabled
                  : null,
              ]}
              onPress={() => handleSocialSignIn('google')}
              disabled={
                !!activeSocialProvider || loading || submitting || mobileSubmitting || mobileSending
              }
            >
              <Text style={styles.socialButtonText}>
                {activeSocialProvider === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialButton,
                styles.facebookButton,
                (activeSocialProvider && activeSocialProvider !== 'facebook') || loading
                  ? styles.socialButtonDisabled
                  : null,
              ]}
              onPress={() => handleSocialSignIn('facebook')}
              disabled={
                !!activeSocialProvider || loading || submitting || mobileSubmitting || mobileSending
              }
            >
              <Text style={[styles.socialButtonText, styles.facebookButtonText]}>
                {activeSocialProvider === 'facebook'
                  ? 'Connecting to Facebook…'
                  : 'Continue with Facebook'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or mobile number</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                placeholder="e.g. +44 7123 456 789"
                style={styles.input}
                textContentType="telephoneNumber"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Verification code</Text>
              <TextInput
                value={mobileCode}
                onChangeText={setMobileCode}
                keyboardType="number-pad"
                placeholder="Enter 6-digit code"
                style={styles.input}
                maxLength={6}
              />
              <Text style={styles.helperText}>Demo code: {demoOtpCode}</Text>
            </View>

            <View style={styles.mobileActions}>
              <TouchableOpacity
                style={[styles.tertiaryButton, mobileSending && styles.tertiaryButtonDisabled]}
                onPress={handleSendMobileOtp}
                disabled={mobileSending || loading}
              >
                <Text style={styles.tertiaryButtonText}>
                  {mobileSending ? 'Sending…' : mobileOtpSent ? 'Resend code' : 'Send code'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.mobilePrimaryButton,
                  (loading || mobileSubmitting) && styles.primaryButtonDisabled,
                ]}
                onPress={handleMobileLogin}
                disabled={loading || mobileSubmitting}
              >
                <Text style={styles.primaryButtonText}>
                  {loading || mobileSubmitting ? 'Verifying…' : 'Sign in with mobile'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.dividerRow, styles.emailDivider]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or use email</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              style={styles.input}
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              style={styles.input}
              textContentType="password"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (loading || submitting) && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || submitting}
          >
            <Text style={styles.primaryButtonText}>
              {loading || submitting ? 'Signing in…' : 'Sign in with email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.secondaryAction}>
            <Text style={styles.secondaryText}>Need an account? Register now</Text>
          </TouchableOpacity>

          {biometricUsers.length ? (
            <View style={styles.biometricCard}>
              <Text style={styles.biometricTitle}>Biometric sign in</Text>
              <Text style={styles.biometricSubtitle}>
                Use Face ID or Touch ID for quicker access to your teams.
              </Text>
              {biometricUsers.map((user) => {
                const isAuthenticating = biometricLoading === user.id;
                const identifier =
                  user.authProvider === 'mobile' && user.phoneNumber
                    ? `${user.phoneNumber} · Mobile`
                    : user.authProvider === 'google'
                    ? `${user.email} · Google`
                    : user.authProvider === 'facebook'
                    ? `${user.email} · Facebook`
                    : user.email;
                return (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.biometricButton,
                      isAuthenticating && styles.biometricButtonDisabled,
                    ]}
                    onPress={() => handleBiometricLogin(user.id)}
                    disabled={isAuthenticating || loading || submitting}
                    accessibilityRole="button"
                  >
                    <Text style={styles.biometricButtonText}>
                      {isAuthenticating ? 'Authenticating…' : `Sign in as ${user.fullName}`}
                    </Text>
                    <Text style={styles.biometricButtonEmail}>{identifier}</Text>
                  </TouchableOpacity>
                );
              })}
              {biometricError ? <Text style={styles.biometricError}>{biometricError}</Text> : null}
            </View>
          ) : null}

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Admin access</Text>
            <Text style={styles.helpText}>Use owner@clubhouse.app with password admin123 to access the admin centre.</Text>
            <Text style={styles.helpText}>Regular demo user: jane@supporters.club / football</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5f5',
    marginBottom: 24,
    textAlign: 'center',
  },
  quickActionsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  quickActionsTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickActionsSubtitle: {
    color: '#cbd5f5',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#cbd5f5',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  socialButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#f8fafc',
  },
  facebookButton: {
    backgroundColor: '#1d4ed8',
  },
  socialButtonText: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 15,
  },
  facebookButtonText: {
    color: '#f8fafc',
  },
  socialButtonDisabled: {
    opacity: 0.7,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    justifyContent: 'center',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#cbd5f5',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 12,
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tertiaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    marginRight: 12,
  },
  tertiaryButtonDisabled: {
    opacity: 0.7,
  },
  tertiaryButtonText: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  mobilePrimaryButton: {
    flex: 1,
  },
  emailDivider: {
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryAction: {
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#93c5fd',
    fontSize: 15,
  },
  biometricCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  biometricTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  biometricSubtitle: {
    color: '#cbd5f5',
    fontSize: 14,
    lineHeight: 20,
  },
  biometricButton: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  biometricButtonDisabled: {
    opacity: 0.7,
  },
  biometricButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  biometricButtonEmail: {
    color: '#dbeafe',
    fontSize: 12,
    marginTop: 4,
  },
  biometricError: {
    color: '#fda4af',
    fontSize: 13,
    marginTop: 8,
  },
  helpCard: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  helpTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 8,
  },
  helpText: {
    color: '#cbd5f5',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default LoginScreen;
