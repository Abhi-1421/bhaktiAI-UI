import { useEffect, useRef } from 'react';
import { PROVIDERS, getRedirectUri } from '../services/oauth.js';

// Shown when a social button is clicked but no client ID is configured yet.
export default function SetupDialog({ providerKey, url, onClose }) {
  const provider = PROVIDERS[providerKey];
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="setup-title">Connect {provider.label} to enable sign-in</h2>
        <p>
          No client ID is set for {provider.label}, so the redirect was not started. Once it is
          configured, this button sends the browser to the provider at:
        </p>
        <code className="code">{url}</code>
        <ol className="steps">
          <li>Create an OAuth app in the {provider.label} developer console.</li>
          <li>
            Register this redirect URI: <code>{getRedirectUri()}</code>
          </li>
          <li>
            Put the client ID in <code>.env</code> as <code>{provider.envVar}</code> and restart the
            dev server.
          </li>
        </ol>
        <div className="dialog-actions">
          <a className="btn btn-secondary" href={url} target="_blank" rel="noopener noreferrer">
            Open provider page anyway
          </a>
          <button ref={closeRef} type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
