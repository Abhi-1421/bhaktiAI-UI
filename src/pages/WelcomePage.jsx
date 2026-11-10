const PROVIDER_LABELS = {
  password: 'with your username',
  google: 'with Google',
  facebook: 'with Facebook',
  twitter: 'with X (Twitter)',
  apple: 'with Apple',
};

// Shown after any successful login so the response from the provider is visible.
export default function WelcomePage({ user, onLogout }) {
  const { provider, profile = {}, note, raw } = user;
  const displayName = profile.name || profile.email || 'there';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const rows = [
    ['Name', profile.name],
    ['Email', profile.email],
    ['Provider ID', profile.id],
  ].filter(([, value]) => value);

  return (
    <>
      <header className="card-head center">
        <div className="avatar" aria-hidden="true">
          {profile.picture ? (
            <img src={profile.picture} alt="" referrerPolicy="no-referrer" />
          ) : (
            initials
          )}
        </div>
        <h1>Hi, {displayName}!</h1>
        <p>You are signed in {PROVIDER_LABELS[provider] || ''}.</p>
      </header>

      {note && <div className="alert alert--info">{note}</div>}

      {rows.length > 0 && (
        <dl className="details">
          {rows.map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {raw && (
        <details className="raw">
          <summary>Response from provider</summary>
          <pre>{JSON.stringify(raw, null, 2)}</pre>
        </details>
      )}

      <button type="button" className="btn btn-secondary btn-block" onClick={onLogout}>
        Log out
      </button>
    </>
  );
}
