import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { signInWithAppleToken, signInWithGoogleToken, type AuthSession } from '@/lib/auth-api';
import { env } from '@/lib/env';

/**
 * Sign in with Apple or Google, then exchange the provider's token for an
 * Xcelar session. Each returns null when the user cancels, so callers can stay
 * quiet; real failures throw with a message for the user.
 */

function isGoogleSignInConfigured(): boolean {
  return Boolean(env.googleIosClientId && env.googleWebClientId);
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

export async function signInWithApple(): Promise<AuthSession | null> {
  // A fresh nonce per attempt: Apple embeds its hash in the token, and the
  // server checks it against the raw value, so a stolen token can't be replayed.
  const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) {
      throw new Error('Apple didn’t return a sign-in token. Please try again.');
    }
    // Apple shares the name only on the very first sign-in.
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
    return await signInWithAppleToken({
      identityToken: credential.identityToken,
      nonce: rawNonce,
      fullName: fullName || undefined,
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
}

export async function signInWithGoogle(): Promise<AuthSession | null> {
  if (!isGoogleSignInConfigured()) {
    throw new Error('Google sign-in isn’t set up yet.');
  }
  // Loaded on demand: the native module isn't in Expo Go, and importing it
  // there at startup would crash the app.
  let google: typeof import('@react-native-google-signin/google-signin');
  try {
    google = await import('@react-native-google-signin/google-signin');
  } catch {
    throw new Error('Google sign-in works in the installed app, not in Expo Go.');
  }
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;
  GoogleSignin.configure({ iosClientId: env.googleIosClientId, webClientId: env.googleWebClientId });
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;
    const { idToken } = response.data;
    if (!idToken) {
      throw new Error('Google didn’t return a sign-in token. Please try again.');
    }
    return await signInWithGoogleToken(idToken);
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    throw error;
  }
}
