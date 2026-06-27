import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** True when the device has biometric hardware AND the user has enrolled it. */
export async function isBiometricAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

/** A human label for the strongest enrolled method, e.g. "Face ID". */
export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const { FACIAL_RECOGNITION, FINGERPRINT } = LocalAuthentication.AuthenticationType;

  if (types.includes(FACIAL_RECOGNITION)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
  }
  if (types.includes(FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }
  return 'Biometrics';
}

/** Prompt for a biometric scan. Returns whether it succeeded. */
export async function authenticate(promptMessage: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    // Fall back to the device passcode so a user is never locked out entirely.
    disableDeviceFallback: false,
  });
  return result.success;
}
