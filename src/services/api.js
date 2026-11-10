// Backend calls for email/password auth.
// With no VITE_API_BASE_URL these run in DEMO mode: they just wait and succeed,
// so the UI can be previewed without a server. Point VITE_API_BASE_URL at your
// backend to make them real.

const BASE = import.meta.env.VITE_API_BASE_URL;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const isMockApi = !BASE;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status}).`);
  return data;
}

export async function loginRequest({ username, password }) {
  if (BASE) return post('/auth/login', { username, password });
  await wait(700);
  return { name: username };
}

// ---- Email verification ----------------------------------------------------
// Backend contract (when VITE_API_BASE_URL is set):
//   POST /auth/signup         -> creates a pending account and emails a 6-digit code
//   POST /auth/signup/resend  { email }        -> emails a fresh code
//   POST /auth/signup/verify  { email, code }  -> 200 when correct, 4xx { message } otherwise
// Demo mode can't send real email from the browser, so it generates the code
// locally and hands it back as `demoCode` so the preview can show it on screen.

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const pendingCodes = new Map(); // email -> { code, expires, attempts }

function issueDemoCode(email) {
  const code = String((crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000);
  pendingCodes.set(email, { code, expires: Date.now() + CODE_TTL_MS, attempts: 0 });
  return code;
}

export async function signUpRequest(payload) {
  if (BASE) return post('/auth/signup', payload);
  await wait(900);
  return { ok: true, demoCode: issueDemoCode(payload.email) };
}

export async function resendCodeRequest({ email }) {
  if (BASE) return post('/auth/signup/resend', { email });
  await wait(600);
  return { ok: true, demoCode: issueDemoCode(email) };
}

function checkDemoCode(key, code) {
  const entry = pendingCodes.get(key);
  if (!entry || Date.now() > entry.expires) {
    pendingCodes.delete(key);
    throw new Error('This code has expired. Request a new one.');
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    throw new Error('Too many incorrect attempts. Request a new code.');
  }
  if (entry.code !== code) {
    entry.attempts += 1;
    const left = MAX_ATTEMPTS - entry.attempts;
    throw new Error(
      left > 0
        ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`
        : 'Too many incorrect attempts. Request a new code.'
    );
  }
  pendingCodes.delete(key);
}

export async function verifyEmailRequest({ email, code }) {
  if (BASE) return post('/auth/signup/verify', { email, code });
  await wait(600);
  checkDemoCode(email, code);
  return { ok: true };
}

// ---- Forgot password -------------------------------------------------------
// `identifier` is the account's email, or its phone number in +E.164 form.
//   POST /auth/password/forgot { identifier }                   -> emails / texts a 6-digit code
//                                                                  (always 200, so callers can't probe which accounts exist)
//   POST /auth/password/reset  { identifier, code, newPassword } -> 200 when the code is right, 4xx { message } otherwise
// Demo mode keeps no accounts, so a "reset" only checks the code.
export async function forgotPasswordRequest({ identifier }) {
  if (BASE) return post('/auth/password/forgot', { identifier });
  await wait(700);
  return { ok: true, demoCode: issueDemoCode(`reset:${identifier}`) };
}

export async function resetPasswordRequest({ identifier, code, newPassword }) {
  if (BASE) return post('/auth/password/reset', { identifier, code, newPassword });
  await wait(700);
  checkDemoCode(`reset:${identifier}`, code);
  return { ok: true };
}

// Used for providers whose token exchange can't happen in the browser (Twitter/X).
export async function exchangeCodeOnBackend(provider, body) {
  if (!BASE) return null;
  return post(`/auth/oauth/${provider}`, body);
}
