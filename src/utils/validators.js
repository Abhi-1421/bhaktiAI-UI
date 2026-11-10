// Every validator returns an error message string, or '' when the value is valid.

const NAME_RE = /^\p{L}[\p{L}\p{M}\s'’.-]*$/u;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

export function validateName(value, label, { required = true, min = 2, max = 30 } = {}) {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : '';
  if (v.length < min) return `${label} must be at least ${min} characters.`;
  if (v.length > max) return `${label} must be at most ${max} characters.`;
  if (!NAME_RE.test(v)) {
    return `${label} can only contain letters, spaces, apostrophes, hyphens and periods.`;
  }
  return '';
}

export function validateEmail(value) {
  const v = value.trim();
  if (!v) return 'Email address is required.';
  if (v.length > 254) return 'Email address is too long.';
  if (v.includes('..') || !EMAIL_RE.test(v)) {
    return 'Enter a valid email address, e.g. name@example.com.';
  }
  return '';
}

// The username is either an email address or a phone number with country code.
const stripPhone = (v) => v.replace(/[\s().-]/g, '');

export function identifierType(value) {
  const v = value.trim();
  if (EMAIL_RE.test(v) && !v.includes('..')) return 'email';
  if (PHONE_RE.test(stripPhone(v))) return 'phone';
  return null;
}

export function validateIdentifier(value) {
  const v = value.trim();
  if (!v) return 'Username is required. Enter your email or phone number.';
  if (v.length > 254) return 'Username is too long.';
  if (identifierType(v)) return '';
  if (v.includes('@')) return 'Enter a valid email address, e.g. name@example.com.';
  if (/^\d/.test(v)) return 'Include your country code, e.g. +919876543210.';
  return 'Enter a valid email address or a phone number like +919876543210.';
}

// Emails are lower-cased; phone numbers lose spaces/dashes and keep the leading +.
export function normalizeIdentifier(value) {
  const v = value.trim();
  return identifierType(v) === 'phone' ? stripPhone(v) : v.toLowerCase();
}

export const passwordChecks = (v = '') => [
  { id: 'len', label: '8+ characters', ok: v.length >= 8 },
  { id: 'upper', label: 'Uppercase letter', ok: /[A-Z]/.test(v) },
  { id: 'lower', label: 'Lowercase letter', ok: /[a-z]/.test(v) },
  { id: 'digit', label: 'Number', ok: /\d/.test(v) },
  { id: 'special', label: 'Special character', ok: /[^A-Za-z0-9\s]/.test(v) },
];

export function validatePassword(v) {
  if (!v) return 'Password is required.';
  if (/\s/.test(v)) return 'Password cannot contain spaces.';
  if (v.length > 64) return 'Password must be at most 64 characters.';
  const missing = passwordChecks(v).filter((c) => !c.ok);
  if (missing.length) {
    return `Password needs: ${missing.map((c) => c.label.toLowerCase()).join(', ')}.`;
  }
  return '';
}

export function validateConfirm(password, confirm) {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}

export function phoneHint(country) {
  return country.len
    ? `Enter ${country.len.join(' or ')} digits, without the country code or leading 0.`
    : 'Enter 6–14 digits, without the country code.';
}

export function validatePhone(number, country) {
  if (!number) return 'Phone number is required.';
  if (!/^\d+$/.test(number)) return 'Phone number can contain digits only.';
  if (country.len) {
    if (!country.len.includes(number.length)) {
      return `${country.name} numbers must have ${country.len.join(' or ')} digits.`;
    }
  } else if (number.length < 6 || number.length > 14) {
    return 'Enter a valid phone number (6–14 digits).';
  }
  if (country.pattern && !country.pattern.test(number)) {
    return `That doesn't look like a valid ${country.name} number.`;
  }
  return '';
}
