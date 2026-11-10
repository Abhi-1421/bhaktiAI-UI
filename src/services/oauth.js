// Social login: sends the browser to each provider's public OAuth endpoint,
// then reads the response when the provider redirects back to this page.
import { exchangeCodeOnBackend } from './api.js';

const env = import.meta.env;

export const PROVIDERS = {
  google: {
    label: 'Google',
    envVar: 'VITE_GOOGLE_CLIENT_ID',
    clientId: env.VITE_GOOGLE_CLIENT_ID,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  facebook: {
    label: 'Facebook',
    envVar: 'VITE_FACEBOOK_CLIENT_ID',
    clientId: env.VITE_FACEBOOK_CLIENT_ID,
    authUrl: 'https://www.facebook.com/dialog/oauth',
    userInfoUrl: 'https://graph.facebook.com/me',
  },
  twitter: {
    label: 'X (Twitter)',
    envVar: 'VITE_TWITTER_CLIENT_ID',
    clientId: env.VITE_TWITTER_CLIENT_ID,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
  },
  apple: {
    label: 'Apple',
    envVar: 'VITE_APPLE_CLIENT_ID',
    clientId: env.VITE_APPLE_CLIENT_ID,
    authUrl: 'https://appleid.apple.com/auth/authorize',
  },
};

const PENDING_KEY = 'oauth_pending';
const store = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export const getRedirectUri = () =>
  env.VITE_REDIRECT_URI || window.location.origin + window.location.pathname;

function randomString(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length);
}

async function sha256Base64Url(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeJwt(token) {
  const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(payload));
}

export async function buildAuthRequest(key) {
  const provider = PROVIDERS[key];
  const state = `${key}.${randomString(24)}`;
  const params = new URLSearchParams({
    client_id: provider.clientId || `YOUR_${key.toUpperCase()}_CLIENT_ID`,
    redirect_uri: getRedirectUri(),
    state,
  });
  let verifier = null;

  switch (key) {
    case 'google':
      params.set('response_type', 'token');
      params.set('scope', 'openid email profile');
      params.set('prompt', 'select_account');
      break;
    case 'facebook':
      params.set('response_type', 'token');
      params.set('scope', 'public_profile,email');
      break;
    case 'twitter':
      verifier = randomString(64);
      params.set('response_type', 'code');
      params.set('scope', 'tweet.read users.read');
      params.set('code_challenge', await sha256Base64Url(verifier));
      params.set('code_challenge_method', 'S256');
      break;
    case 'apple':
      params.set('response_type', 'code id_token');
      params.set('response_mode', 'fragment');
      break;
    default:
      throw new Error(`Unknown provider: ${key}`);
  }

  return {
    url: `${provider.authUrl}?${params.toString()}`,
    state,
    verifier,
    configured: Boolean(provider.clientId),
  };
}

// Redirects to the provider when a client ID is configured. Otherwise returns
// the URL it *would* use so the UI can explain what's missing.
export async function startSocialLogin(key) {
  const request = await buildAuthRequest(key);
  if (!request.configured) return { redirected: false, url: request.url };
  store.set({ state: request.state, verifier: request.verifier });
  window.location.assign(request.url);
  return { redirected: true, url: request.url };
}

// Looks for an OAuth response in the URL (query string or #fragment).
export function readCallback() {
  const merged = {};
  new URLSearchParams(window.location.search).forEach((v, k) => (merged[k] = v));
  new URLSearchParams(window.location.hash.replace(/^#/, '')).forEach((v, k) => (merged[k] = v));
  const provider = merged.state?.split('.')[0];
  if (!provider || !PROVIDERS[provider]) return null;
  return { provider, params: merged };
}

// Validates the response and fetches the signed-in user's profile.
export async function completeLogin({ provider, params }) {
  const pending = store.get();
  store.clear();

  if (params.error) throw new Error(params.error_description || params.error);
  if (!pending || pending.state !== params.state) {
    throw new Error('Security check failed (state mismatch). Please try signing in again.');
  }

  switch (provider) {
    case 'google': {
      const res = await fetch(PROVIDERS.google.userInfoUrl, {
        headers: { Authorization: `Bearer ${params.access_token}` },
      });
      if (!res.ok) throw new Error(`Google responded with status ${res.status}.`);
      const d = await res.json();
      return {
        provider,
        profile: { id: d.sub, name: d.name, email: d.email, picture: d.picture },
        raw: d,
      };
    }

    case 'facebook': {
      const query = new URLSearchParams({
        fields: 'id,name,email,picture.type(large)',
        access_token: params.access_token,
      });
      const res = await fetch(`${PROVIDERS.facebook.userInfoUrl}?${query}`);
      if (!res.ok) throw new Error(`Facebook responded with status ${res.status}.`);
      const d = await res.json();
      return {
        provider,
        profile: { id: d.id, name: d.name, email: d.email, picture: d.picture?.data?.url },
        raw: d,
      };
    }

    case 'twitter': {
      // X's token endpoint blocks browser (CORS) requests, so the code must be
      // exchanged by your backend.
      const profile = await exchangeCodeOnBackend('twitter', {
        code: params.code,
        codeVerifier: pending.verifier,
        redirectUri: getRedirectUri(),
      });
      if (profile) return { provider, profile, raw: profile };
      return {
        provider,
        profile: { name: 'X (Twitter) account' },
        note: 'X returned an authorization code. Exchanging it for a token must happen on a backend (the token endpoint blocks browser requests). Set VITE_API_BASE_URL and implement POST /auth/oauth/twitter to finish this step.',
        raw: { code: params.code },
      };
    }

    case 'apple': {
      const claims = params.id_token ? decodeJwt(params.id_token) : {};
      return {
        provider,
        profile: { id: claims.sub, name: 'Apple account', email: claims.email },
        note: 'Verify the id_token signature on your backend before trusting these claims.',
        raw: claims,
      };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
