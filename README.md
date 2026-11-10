# bhaktiAI-UI


Login, Sign Up and social login screens.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run preview    # production build served locally
npm run build:single   # one self-contained HTML file in dist-single/
```

## What's included

- **Login page**: username, password, and **Login / Sign Up** buttons side by side.
- **Sign Up page**: First name, Last name, Preferred name (optional), Email, Phone
  (country-code dropdown + number box), Password, Confirm password.
  - Validation runs on blur and live afterwards, and again on submit (focus jumps to the first invalid field).
  - Password: 8–64 chars, upper, lower, number, special character, no spaces, with a strength meter and checklist.
  - Phone: digits only, length checked per country (India also checks it starts with 6–9). Countries without
    a specific rule fall back to 6–14 digits. Edit `src/data/countries.js` to tighten or add rules.
- **Social login**: Google, Facebook, X (Twitter), Apple buttons with logos on both pages.

## Social login setup

Each button redirects to the provider's public OAuth endpoint and reads the response when it redirects back.
Until a client ID is set, clicking a button opens a dialog explaining what's missing instead of redirecting.

1. Copy `.env.example` to `.env`.
2. Create an OAuth app per provider and register the redirect URI (default: the page URL, e.g. `http://localhost:5173/`).
3. Fill in the `VITE_*_CLIENT_ID` values and restart `npm run dev`.

| Provider | Flow used in the browser | Notes |
| --- | --- | --- |
| Google | Implicit (`response_type=token`), then `userinfo` | Works fully client-side |
| Facebook | Implicit, then Graph API `/me` | Facebook requires an HTTPS redirect URI outside localhost |
| X (Twitter) | Authorization code + PKCE | Token exchange needs a backend (`POST /auth/oauth/twitter`) |
| Apple | `code id_token` via URL fragment | Verify the `id_token` on a backend; name/email scopes need `form_post` + backend |

## Email / password and verification

Sign Up → **Verify your email** (6-digit code, 10-minute expiry, resend after 30s) → success screen
("Congrats {name}, your account is successfully created. Click Here to Login") → Login page.

`src/services/api.js` runs in **demo mode** until `VITE_API_BASE_URL` is set. A browser can't send email,
so demo mode generates the code locally and shows it on the verify screen. With the variable set, the app calls:

| Endpoint | Purpose |
| --- | --- |
| `POST /auth/login` | `{ username, password }` |
| `POST /auth/signup` | creates a pending account and emails a 6-digit code |
| `POST /auth/signup/resend` | `{ email }` → emails a fresh code (old one stops working) |
| `POST /auth/signup/verify` | `{ email, code }` → 200 if correct, otherwise 4xx `{ message }` |

Generate, store (hashed), expire and rate-limit the codes on the server; the demo's attempt limit is only a stand-in.

## Username and Forgot Password

The username is an **email address** or a **phone number with country code** (e.g. `+919876543210`).
Emails are lower-cased and phone numbers lose spaces/dashes before being sent as `username` / `identifier`.

**Forgot password?** (link on the login page): enter username → a 6-digit code is sent by email or SMS →
enter the code plus a new password → back to login. The new password is only sent together with a valid code.

| Endpoint | Purpose |
| --- | --- |
| `POST /auth/password/forgot` | `{ identifier }` → sends a code. Always return 200 so the response doesn't reveal which accounts exist |
| `POST /auth/password/reset` | `{ identifier, code, newPassword }` → 200 if the code is right, otherwise 4xx `{ message }` |

Demo mode keeps no accounts, so the reset only checks the code; nothing is stored.
