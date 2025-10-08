export enum AuthenticationType {
  FINGERPRINT = 1,
  FACIAL_RECOGNITION = 2,
  IRIS = 3,
}

export interface LocalAuthenticationOptions {
  promptMessage?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
}

export interface LocalAuthenticationResult {
  success: boolean;
  error?: string;
  warning?: string;
}

export const hasHardwareAsync = async (): Promise<boolean> => true;

export const supportedAuthenticationTypesAsync = async (): Promise<AuthenticationType[]> => [
  AuthenticationType.FINGERPRINT,
];

export const isEnrolledAsync = async (): Promise<boolean> => true;

export const authenticateAsync = async (
  _options?: LocalAuthenticationOptions,
): Promise<LocalAuthenticationResult> => ({ success: true });

export default {
  hasHardwareAsync,
  supportedAuthenticationTypesAsync,
  isEnrolledAsync,
  authenticateAsync,
};
