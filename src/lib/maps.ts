import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

/**
 * Google Maps on both platforms, except inside Expo Go on iOS: Expo Go doesn't
 * bundle the Google Maps iOS SDK, so a Google MapView renders blank there.
 * Development and store builds include it and get Google.
 */
const isExpoGoIOS =
  Platform.OS === 'ios' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const MAP_PROVIDER = isExpoGoIOS ? PROVIDER_DEFAULT : PROVIDER_GOOGLE;
