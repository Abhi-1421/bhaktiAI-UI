import { useEffect, useRef } from 'react';

export default function SuccessPage({ userName, onLogin }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="success" role="status">
      <div className="check" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <h1 ref={headingRef} tabIndex={-1}>
        Congrats {userName}, your account is successfully created.
      </h1>
      <p className="switch">
        <button type="button" className="link" onClick={onLogin}>
          Click Here
        </button>{' '}
        to Login
      </p>
    </div>
  );
}
