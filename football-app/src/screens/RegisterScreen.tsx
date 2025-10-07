import React, { useCallback, useState } from 'react';
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
import { registerUser, selectAuthLoading } from '../store/slices/authSlice';

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
              {loading || submitting ? 'Creating account…' : 'Create account'}
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
