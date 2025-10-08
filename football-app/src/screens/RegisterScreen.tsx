import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
  registerUser,
  registerWithMobileNumber,
  selectAuthLoading,
} from '../store/slices/authSlice';
import { getMockOtpCode, sendMockOtpToPhone, verifyMockOtpCode } from '../services/mobileAuth';
import type { SocialProvider } from '../services/socialAuth';

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<SocialProvider | null>(null);
  const [mobileFullName, setMobileFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileCode, setMobileCode] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileSubmitting, setMobileSubmitting] = useState(false);
  const demoOtpCode = useMemo(() => getMockOtpCode(), []);

  const handleSubmit = useCallback(async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing details', 'Please provide your full name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Missing details', 'An email address is required.');
      return;
    }

    if (!password.trim() || password.length < 6) {
      Alert.alert('Weak password', 'Choose a password with at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(registerUser({ fullName, email, password, marketingOptIn })).unwrap();
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Unable to create your account right now.';
      Alert.alert('Registration failed', message);
    } finally {
      setSubmitting(false);
    }
  }, [confirmPassword, dispatch, email, fullName, marketingOptIn, password]);

  const handleSocialSignUp = useCallback(
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
        Alert.alert('Sign up failed', message);
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

  const handleMobileRegister = useCallback(async () => {
    if (!mobileFullName.trim()) {
      Alert.alert('Missing name', 'Enter your full name to continue.');
      return;
    }

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

      await dispatch(
        registerWithMobileNumber({
          fullName: mobileFullName,
          phoneNumber: mobileNumber,
          marketingOptIn,
        }),
      ).unwrap();
      setMobileCode('');
      setMobileNumber('');
      setMobileFullName('');
      setMobileOtpSent(false);
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : 'Unable to create an account with that mobile number right now.';
      Alert.alert('Registration failed', message);
    } finally {
      setMobileSubmitting(false);
    }
  }, [dispatch, marketingOptIn, mobileCode, mobileFullName, mobileNumber, mobileOtpSent]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={64}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join tournaments, manage teams, and unlock premium experiences.</Text>

          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Get started fast</Text>
            <Text style={styles.quickActionsSubtitle}>
              Register with your favourite provider in a couple of taps.
            </Text>

            <TouchableOpacity
              style={[
                styles.socialButton,
                styles.googleButton,
                (activeSocialProvider && activeSocialProvider !== 'google') || loading
                  ? styles.socialButtonDisabled
                  : null,
              ]}
              onPress={() => handleSocialSignUp('google')}
              disabled={
                !!activeSocialProvider || loading || submitting || mobileSubmitting || mobileSending
              }
            >
              <Text style={styles.socialButtonText}>
                {activeSocialProvider === 'google'
                  ? 'Connecting to Google…'
                  : 'Continue with Google'}
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
              onPress={() => handleSocialSignUp('facebook')}
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
              <Text style={styles.label}>Full name</Text>
              <TextInput
                value={mobileFullName}
                onChangeText={setMobileFullName}
                placeholder="Alex Morgan"
                style={styles.input}
                textContentType="name"
              />
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
                onPress={handleMobileRegister}
                disabled={loading || mobileSubmitting}
              >
                <Text style={styles.primaryButtonText}>
                  {loading || mobileSubmitting ? 'Creating account…' : 'Sign up with mobile'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              Marketing preferences below apply to every registration method.
            </Text>
          </View>

          <View style={[styles.dividerRow, styles.emailDivider]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or use email</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Alex Morgan"
              style={styles.input}
              textContentType="name"
            />
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
              placeholder="Create a secure password"
              style={styles.input}
              textContentType="newPassword"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter your password"
              style={styles.input}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrapper}>
              <Text style={styles.toggleLabel}>Marketing updates</Text>
              <Text style={styles.toggleDescription}>
                Receive tournament announcements and exclusive partner offers.
              </Text>
            </View>
            <Switch value={marketingOptIn} onValueChange={setMarketingOptIn} />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (loading || submitting) && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || submitting}
          >
            <Text style={styles.primaryButtonText}>
              {loading || submitting ? 'Creating account…' : 'Create account with email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.secondaryAction}>
            <Text style={styles.secondaryText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
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
    backgroundColor: '#f9fafb',
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    textAlign: 'center',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  quickActionsTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickActionsSubtitle: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#1f2937',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    color: '#0f172a',
  },
  socialButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#f1f5f9',
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
    justifyContent: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cbd5f5',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 12,
  },
  helperText: {
    color: '#64748b',
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
    borderColor: '#94a3b8',
    marginRight: 12,
  },
  tertiaryButtonDisabled: {
    opacity: 0.7,
  },
  tertiaryButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  mobilePrimaryButton: {
    flex: 1,
  },
  emailDivider: {
    marginTop: 16,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  toggleTextWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  toggleDescription: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
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
    color: '#2563eb',
    fontSize: 15,
  },
});

export default RegisterScreen;
