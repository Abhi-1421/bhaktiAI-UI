import { useState } from 'react';
import { AppleLogo, FacebookLogo, GoogleLogo, XLogo } from './Logos.jsx';
import SetupDialog from './SetupDialog.jsx';
import { PROVIDERS, startSocialLogin } from '../services/oauth.js';

const BUTTONS = [
  { key: 'google', Logo: GoogleLogo },
  { key: 'facebook', Logo: FacebookLogo },
  { key: 'twitter', Logo: XLogo },
  { key: 'apple', Logo: AppleLogo },
];

export default function SocialButtons({ mode = 'login' }) {
  const [busy, setBusy] = useState(null);
  const [setup, setSetup] = useState(null);
  const [error, setError] = useState('');

  async function handleClick(key) {
    setError('');
    setBusy(key);
    try {
      const result = await startSocialLogin(key);
      if (!result.redirected) setSetup({ key, url: result.url });
    } catch (err) {
      setError(`Could not start ${PROVIDERS[key].label} sign-in: ${err.message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label="Social sign-in">
      <div className="divider">
        <span>{mode === 'signup' ? 'or sign up with' : 'or continue with'}</span>
      </div>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <div className="social">
        {BUTTONS.map(({ key, Logo }) => (
          <button
            key={key}
            type="button"
            className="btn-social"
            disabled={busy !== null}
            onClick={() => handleClick(key)}
            aria-label={`${mode === 'signup' ? 'Sign up' : 'Log in'} with ${PROVIDERS[key].label}`}
          >
            {busy === key ? <span className="spinner" aria-hidden="true" /> : <Logo />}
            <span>{PROVIDERS[key].label}</span>
          </button>
        ))}
      </div>
      {setup && (
        <SetupDialog providerKey={setup.key} url={setup.url} onClose={() => setSetup(null)} />
      )}
    </section>
  );
}
