import { useEffect, useState } from 'react';
import TextField from '../components/TextField.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { useForm } from '../hooks/useForm.js';
import {
  identifierType,
  normalizeIdentifier,
  validateConfirm,
  validateIdentifier,
  validatePassword,
} from '../utils/validators.js';
import { forgotPasswordRequest, isMockApi, resetPasswordRequest } from '../services/api.js';

const RESEND_SECONDS = 30;

const validateRequest = (v) => ({ username: validateIdentifier(v.username) });

const validateReset = (v) => ({
  code: !v.code
    ? 'Verification code is required.'
    : v.code.length !== 6
      ? 'Enter the 6-digit code.'
      : '',
  password: validatePassword(v.password),
  confirmPassword: validateConfirm(v.password, v.confirmPassword),
});

// Step 1: who are you? We send a code to that email or phone number.
function RequestStep({ onSent, onBack }) {
  const form = useForm({ username: '' }, validateRequest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    form.touchAll();
    if (form.errors.username) {
      document.getElementById('username')?.focus();
      return;
    }
    const identifier = normalizeIdentifier(form.values.username);
    setBusy(true);
    try {
      const result = await forgotPasswordRequest({ identifier });
      onSent({ identifier, demoCode: result?.demoCode });
    } catch (err) {
      setError(err.message || 'Could not send the code. Please try again.');
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
        <h1>Forgot your password?</h1>
        <p>Enter your username and we will send a verification code to reset it.</p>
      </header>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="username"
          label="Username"
          required
          type="text"
          placeholder="Email or phone number with country code"
          hint="Use your email, or your phone number like +919876543210."
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={form.values.username}
          onChange={(e) => form.setValue('username', e.target.value)}
          onBlur={() => form.touch('username')}
          error={form.shown('username')}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Sending code…' : 'Send code'}
        </button>
      </form>
    </>
  );
}

// Step 2: enter the code and choose a new password.
function ResetStep({ identifier, demoCode: firstDemoCode, onDone, onBack }) {
  const form = useForm({ code: '', password: '', confirmPassword: '' }, validateReset);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [demoCode, setDemoCode] = useState(firstDemoCode);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const channel = identifierType(identifier) === 'phone' ? 'SMS' : 'email';

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    form.touchAll();
    const firstInvalid = ['code', 'password', 'confirmPassword'].find((k) => form.errors[k]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setBusy(true);
    try {
      await resetPasswordRequest({
        identifier,
        code: form.values.code,
        newPassword: form.values.password,
      });
      onDone();
    } catch (err) {
      setError(err.message || 'Could not reset the password. Please try again.');
      form.setValue('code', '');
      document.getElementById('code')?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    setResending(true);
    try {
      const result = await forgotPasswordRequest({ identifier });
      setDemoCode(result?.demoCode);
      form.setValue('code', '');
      setCooldown(RESEND_SECONDS);
      setInfo('A new code has been sent. The previous code no longer works.');
    } catch (err) {
      setError(err.message || 'Could not send a new code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <button type="button" className="link back" onClick={onBack}>
        ← Change username
      </button>
      <header className="card-head">
        <h1>Reset your password</h1>
        <p>
          If an account exists for <strong className="break">{identifier}</strong>, we sent a
          6-digit code by {channel}. It expires in 10 minutes.
        </p>
      </header>

      {isMockApi && demoCode && (
        <div className="alert alert--info" role="status">
          Demo mode: this preview can't send real {channel === 'SMS' ? 'text messages' : 'email'}.
          Your code is <strong className="demo-code">{demoCode}</strong>.
        </div>
      )}
      {info && (
        <div className="alert alert--success" role="status">
          {info}
        </div>
      )}
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="code"
          label="Verification code"
          required
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter 6-digit code"
          value={form.values.code}
          onChange={(e) => form.setValue('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
          onBlur={() => form.touch('code')}
          error={form.shown('code')}
        />
        <PasswordField
          id="password"
          label="New password"
          required
          showRules
          placeholder="Create a new password"
          autoComplete="new-password"
          maxLength={64}
          value={form.values.password}
          onChange={(e) => form.setValue('password', e.target.value)}
          onBlur={() => form.touch('password')}
          error={form.shown('password')}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          required
          placeholder="Re-enter the new password"
          autoComplete="new-password"
          maxLength={64}
          value={form.values.confirmPassword}
          onChange={(e) => form.setValue('confirmPassword', e.target.value)}
          onBlur={() => form.touch('confirmPassword')}
          error={form.shown('confirmPassword')}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <p className="switch">
        Didn't get the code?{' '}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button type="button" className="link" onClick={handleResend} disabled={resending}>
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>
    </>
  );
}

export default function ForgotPasswordPage({ onBack, onDone }) {
  const [sent, setSent] = useState(null); // { identifier, demoCode } once the code is on its way

  return sent ? (
    <ResetStep
      identifier={sent.identifier}
      demoCode={sent.demoCode}
      onBack={() => setSent(null)}
      onDone={onDone}
    />
  ) : (
    <RequestStep onSent={setSent} onBack={onBack} />
  );
}
