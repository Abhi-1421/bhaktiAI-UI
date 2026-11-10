import { useState } from 'react';
import TextField from '../components/TextField.jsx';
import PasswordField from '../components/PasswordField.jsx';
import SocialButtons from '../components/SocialButtons.jsx';
import { useForm } from '../hooks/useForm.js';
import { normalizeIdentifier, validateIdentifier } from '../utils/validators.js';
import { isMockApi, loginRequest } from '../services/api.js';

const validate = (v) => ({
  username: validateIdentifier(v.username),
  password: v.password ? '' : 'Password is required.',
});

const INITIAL = { username: '', password: '' };

export default function LoginPage({ onSignUp, onForgot, onLoggedIn, notice, externalError }) {
  const form = useForm(INITIAL, validate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    form.touchAll();
    const firstInvalid = ['username', 'password'].find((k) => form.errors[k]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setBusy(true);
    try {
      const username = normalizeIdentifier(form.values.username);
      const user = await loginRequest({ username, password: form.values.password });
      onLoggedIn({ provider: 'password', profile: { name: user?.name || username } });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const bannerError = error || externalError;

  return (
    <>
      <header className="card-head">
        <h1>Welcome back</h1>
        <p>Log in to continue to your account.</p>
      </header>

      {notice && (
        <div className="alert alert--success" role="status">
          {notice}
        </div>
      )}
      {bannerError && (
        <div className="alert alert--error" role="alert">
          {bannerError}
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
        <PasswordField
          id="password"
          label="Password"
          required
          placeholder="Enter your password"
          autoComplete="current-password"
          value={form.values.password}
          onChange={(e) => form.setValue('password', e.target.value)}
          onBlur={() => form.touch('password')}
          error={form.shown('password')}
        />

        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Logging in…' : 'Login'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onSignUp} disabled={busy}>
            Sign Up
          </button>
        </div>

        <div className="forgot-row">
          <button type="button" className="link" onClick={onForgot} disabled={busy}>
            Forgot password?
          </button>
        </div>
      </form>

      {isMockApi && (
        <p className="hint center demo-note">
          Demo mode: no backend is connected, so any valid credentials will sign you in.
        </p>
      )}

      <SocialButtons mode="login" />
    </>
  );
}
