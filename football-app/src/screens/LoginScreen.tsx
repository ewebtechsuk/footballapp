import React, { useCallback, useState } from 'react';
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
import { loginUser, selectAuthLoading } from '../store/slices/authSlice';

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
              {loading || submitting ? 'Signing in…' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.secondaryAction}>
            <Text style={styles.secondaryText}>Need an account? Register now</Text>
          </TouchableOpacity>

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
