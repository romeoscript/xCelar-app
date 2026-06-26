import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';

/**
 * Combine a country dial code with a locally-typed number into E.164 form,
 * e.g. (+234, "0801 234 5678") -> "+2348012345678". Strips spaces/symbols and
 * a leading national-trunk zero so it isn't duplicated after the dial code.
 */
export function toE164(country: Country, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '').replace(/^0+/, '');
  return `${country.dialCode}${digits}`;
}

/**
 * Split an E.164 number back into a country (longest matching dial code) and
 * its national part, so a stored number can prefill a phone input. Defaults to
 * Nigeria when empty or unrecognised.
 */
export function parseE164(value: string): { country: Country; national: string } {
  if (!value) {
    return { country: DEFAULT_COUNTRY, national: '' };
  }
  const match = [...COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => value.startsWith(country.dialCode));
  if (match) {
    return { country: match, national: value.slice(match.dialCode.length) };
  }
  return { country: DEFAULT_COUNTRY, national: value.replace(/^\+/, '') };
}
