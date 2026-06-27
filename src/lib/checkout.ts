import * as WebBrowser from 'expo-web-browser';

import { verifyPayment, type VerifyResult } from './wallet-api';

/**
 * Open Paystack checkout in an in-app browser, then verify the transaction by
 * its reference once the browser closes. Returns the verification result.
 */
export async function runPaystackCheckout(
  authorizationUrl: string,
  reference: string,
): Promise<VerifyResult> {
  await WebBrowser.openBrowserAsync(authorizationUrl);
  return verifyPayment(reference);
}
