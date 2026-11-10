import { useEffect, useState } from 'react';
import TextField from '../components/TextField.jsx';
import { isMockApi, resendCodeRequest, verifyEmailRequest } from '../services/api.js';

const RESEND_SECONDS = 30;

export default function VerifyEmailPage({ email, demoCode: firstDemoCode, onVerified, onBack }) {
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [demoCode, setDemoCode] = useState(firstDemoCode);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const fieldError = !code
    ? 'Verification code is required.'
    : code.length !== 6
      ? 'Enter the 6-digit code from your email.'
      : '';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setTouched(true);
    if (fieldError) {
      document.getElementById('code')?.focus();
      return;
    }
    setBusy(true);
    try {
      await verifyEmailRequest({ email, code });
      onVerified();
    } catch (err) {
      setError(err.message || 'Could not verify the code. Please try again.');
      setCode('');
      setTouched(false);
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
      const result = await resendCodeRequest({ email });
      setDemoCode(result?.demoCode);
      setCode('');
      setTouched(false);
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
        ← Change email
      </button>
      <header className="card-head">
        <h1>Verify your email</h1>
        <p>
          We sent a 6-digit code to <strong className="break">{email}</strong>. It expires in 10
          minutes.
        </p>
      </header>

      {isMockApi && demoCode && (
        <div className="alert alert--info" role="status">
          Demo mode: this preview can't send real email. Your code is{' '}
          <strong className="demo-code">{demoCode}</strong>.
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
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onBlur={() => setTouched(true)}
          error={touched ? fieldError : ''}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Verifying…' : 'Verify'}
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
