import { type Country } from '@/constants/countries';

/**
 * Combine a country dial code with a locally-typed number into E.164 form,
 * e.g. (+234, "0801 234 5678") -> "+2348012345678". Strips spaces/symbols and
 * a leading national-trunk zero so it isn't duplicated after the dial code.
 */
export function toE164(country: Country, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '').replace(/^0+/, '');
  return `${country.dialCode}${digits}`;
}
