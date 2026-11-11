import { MailIcon, PhoneCallIcon } from '@/components/icons';

/**
 * One field takes either an email or a phone number. Anything with an "@" or
 * a letter is treated as an email; the rest is a phone number, which the
 * server normalises (local 0803… numbers default to Nigeria).
 */
export function isEmailIdentifier(value: string): boolean {
  return /[@a-z]/i.test(value);
}

/** Mail while the field is empty or holds an email, a phone once it's digits. */
export function identifierIcon(value: string) {
  return value.trim() === '' || isEmailIdentifier(value) ? MailIcon : PhoneCallIcon;
}
