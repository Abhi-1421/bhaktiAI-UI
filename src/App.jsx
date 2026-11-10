import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import { completeLogin, PROVIDERS, readCallback } from './services/oauth.js';

export default function App() {
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'verify' | 'success' | 'welcome'
  const [user, setUser] = useState(null);
  const [signup, setSignup] = useState(null); // { email, userName, demoCode } while verifying
  const [notice, setNotice] = useState('');
  const [oauth, setOauth] = useState(null); // { status: 'loading' | 'error', ... }

  // When a provider redirects back to this page, finish the social login.
  useEffect(() => {
    const callback = readCallback();
    if (!callback) return;
    window.history.replaceState(null, '', window.location.pathname);
    setOauth({ status: 'loading', provider: callback.provider });
    completeLogin(callback)
      .then((result) => {
        setUser(result);
        setView('welcome');
        setOauth(null);
      })
      .catch((err) => setOauth({ status: 'error', message: err.message }));
  }, []);

  const loggedIn = (u) => {
    setUser(u);
    setNotice('');
    setView('welcome');
  };

  const logout = () => {
    setUser(null);
    setView('login');
  };

  return (
    <main className="shell">
      <div className={`card${view === 'signup' ? ' card--wide' : ''}`}>
        {oauth?.status === 'loading' ? (
          <div className="loading" role="status">
            <span className="spinner spinner--lg" aria-hidden="true" />
            <p>Completing {PROVIDERS[oauth.provider].label} sign-in…</p>
          </div>
        ) : view === 'signup' ? (
          <SignUpPage
            onBack={() => setView('login')}
            onSignedUp={(details) => {
              setSignup(details);
              setView('verify');
            }}
          />
        ) : view === 'forgot' ? (
          <ForgotPasswordPage
            onBack={() => setView('login')}
            onDone={() => {
              setNotice('Password updated. Log in with your new password.');
              setView('login');
            }}
          />
        ) : view === 'verify' && signup ? (
          <VerifyEmailPage
            email={signup.email}
            demoCode={signup.demoCode}
            onBack={() => setView('signup')}
            onVerified={() => setView('success')}
          />
        ) : view === 'success' && signup ? (
          <SuccessPage
            userName={signup.userName}
            onLogin={() => {
              setSignup(null);
              setNotice('');
              setView('login');
            }}
          />
        ) : view === 'welcome' && user ? (
          <WelcomePage user={user} onLogout={logout} />
        ) : (
          <LoginPage
            notice={notice}
            externalError={oauth?.status === 'error' ? oauth.message : ''}
            onForgot={() => {
              setNotice('');
              setOauth(null);
              setView('forgot');
            }}
            onSignUp={() => {
              setNotice('');
              setOauth(null);
              setView('signup');
            }}
            onLoggedIn={loggedIn}
          />
        )}
      </div>
    </main>
  );
}
