import { useState } from 'react';
import TextField from '../components/TextField.jsx';
import PasswordField from '../components/PasswordField.jsx';
import PhoneField from '../components/PhoneField.jsx';
import SocialButtons from '../components/SocialButtons.jsx';
import { useForm } from '../hooks/useForm.js';
import { defaultCountryIso, findCountry } from '../data/countries.js';
import {
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../utils/validators.js';
import { signUpRequest } from '../services/api.js';

const FIELD_ORDER = [
  'firstName',
  'lastName',
  'preferredName',
  'email',
  'phone',
  'password',
  'confirmPassword',
];

const validate = (v) => ({
  firstName: validateName(v.firstName, 'First name'),
  lastName: validateName(v.lastName, 'Last name'),
  preferredName: validateName(v.preferredName, 'Preferred name', { required: false }),
  email: validateEmail(v.email),
  phone: validatePhone(v.phone, findCountry(v.countryIso)),
  password: validatePassword(v.password),
  confirmPassword: validateConfirm(v.password, v.confirmPassword),
});

export default function SignUpPage({ onBack, onSignedUp }) {
  const form = useForm(
    {
      firstName: '',
      lastName: '',
      preferredName: '',
      email: '',
      countryIso: defaultCountryIso(),
      phone: '',
      password: '',
      confirmPassword: '',
    },
    validate
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { values } = form;

  const bind = (name) => ({
    value: values[name],
    onChange: (e) => form.setValue(name, e.target.value),
    onBlur: () => {
      if (typeof values[name] === 'string' && name !== 'password' && name !== 'confirmPassword') {
        const trimmed = values[name].trim();
        if (trimmed !== values[name]) form.setValue(name, trimmed);
      }
      form.touch(name);
    },
    error: form.shown(name),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    form.touchAll();
    const firstInvalid = FIELD_ORDER.find((k) => form.errors[k]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    const country = findCountry(values.countryIso);
    setBusy(true);
    try {
      const result = await signUpRequest({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        preferredName: values.preferredName.trim() || null,
        email: values.email.trim().toLowerCase(),
        phone: { countryCode: `+${country.dial}`, number: values.phone },
        phoneE164: `+${country.dial}${values.phone}`,
        password: values.password,
      });
      onSignedUp({
        email: values.email.trim().toLowerCase(),
        userName: values.preferredName.trim() || values.firstName.trim(),
        demoCode: result?.demoCode,
      });
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="link back" onClick={onBack}>
        ← Back to login
      </button>
      <header className="card-head">
        <h1>Create your account</h1>
        <p>
          Fields marked <span className="req">*</span> are required.
        </p>
      </header>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row-2">
          <TextField
            id="firstName"
            label="First name"
            required
            placeholder="e.g. John"
            autoComplete="given-name"
            maxLength={30}
            {...bind('firstName')}
          />
          <TextField
            id="lastName"
            label="Last name"
            required
            placeholder="e.g. Doe"
            autoComplete="family-name"
            maxLength={30}
            {...bind('lastName')}
          />
        </div>
        <TextField
          id="preferredName"
          label="Preferred name"
          optional
          placeholder="What should we call you?"
          autoComplete="nickname"
          maxLength={30}
          {...bind('preferredName')}
        />
        <TextField
          id="email"
          label="Email address"
          required
          type="email"
          inputMode="email"
          placeholder="name@example.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          {...bind('email')}
        />
        <PhoneField
          id="phone"
          label="Phone number"
          required
          countryIso={values.countryIso}
          onCountryChange={(iso) => form.setValue('countryIso', iso)}
          value={values.phone}
          onChange={(digits) => form.setValue('phone', digits)}
          onBlur={() => form.touch('phone')}
          error={form.shown('phone')}
        />
        <PasswordField
          id="password"
          label="Password"
          required
          showRules
          placeholder="Create a password"
          autoComplete="new-password"
          maxLength={64}
          {...bind('password')}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          required
          placeholder="Re-enter your password"
          autoComplete="new-password"
          maxLength={64}
          {...bind('confirmPassword')}
        />

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="switch">
        Already have an account?{' '}
        <button type="button" className="link" onClick={onBack}>
          Login
        </button>
      </p>

      <SocialButtons mode="signup" />
    </>
  );
}
