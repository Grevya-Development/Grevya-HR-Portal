/**
 * Validates whether an email address is permitted for Grevya HR Portal registration and invitations.
 * 
 * Permitted formats:
 * 1. Any valid email address ending in @grevya.com (case-insensitive).
 * 2. Any valid Gmail address whose local-part ends in .grevya (e.g. harikanth.grevya@gmail.com, arun.grevya@gmail.com).
 * 
 * Rejected formats:
 * - harikanth@gmail.com (no .grevya suffix in local part)
 * - harikanth.grevya@yahoo.com (non-grevya, non-gmail domain)
 * - harikanth@anothercompany.com
 */
export function isPermittedGrevyaEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();

  // Standard email syntax check
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(normalized)) return false;

  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;

  // Rule 1: @grevya.com
  if (domain === 'grevya.com') {
    return true;
  }

  // Rule 2: @gmail.com whose local part ends with .grevya
  if (domain === 'gmail.com' && localPart.endsWith('.grevya')) {
    return true;
  }

  return false;
}

export const EMAIL_POLICY_MESSAGE =
  'Registration and invitations are restricted to official @grevya.com or *.grevya@gmail.com addresses.';
