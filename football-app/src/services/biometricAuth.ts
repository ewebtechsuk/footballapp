import {
  AuthenticationType,
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
} from 'expo-local-authentication';

export interface BiometricSupport {
  available: boolean;
  enrolled: boolean;
  supportedTypes: AuthenticationType[];
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export const detectBiometricSupport = async (): Promise<BiometricSupport> => {
  try {
    const [hasHardware, enrolled, supportedTypes] = await Promise.all([
      hasHardwareAsync(),
      isEnrolledAsync(),
      supportedAuthenticationTypesAsync(),
    ]);

    return {
      available: hasHardware,
      enrolled: enrolled,
      supportedTypes,
    };
  } catch (error) {
    console.warn('Failed to detect biometric support', error);
    return {
      available: false,
      enrolled: false,
      supportedTypes: [],
    };
  }
};

export const requestBiometricAuthentication = async (
  promptMessage = 'Confirm your identity',
): Promise<BiometricAuthResult> => {
  try {
    const result = await authenticateAsync({ promptMessage, disableDeviceFallback: true });
    return {
      success: result.success,
      error: result.success ? undefined : result.error ?? result.warning,
    };
  } catch (error) {
    console.warn('Biometric authentication failed', error);
    return {
      success: false,
      error: 'Unable to start biometric authentication',
    };
  }
};
