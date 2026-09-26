# Authentication

The existing Express controllers/routes, Mongoose User model, React auth context,
Axios client and role-based route guard remain the integration points.

## Configuration

Keep real configuration only in `server/.env` or deployment environment variables:

- `EMAIL_USER`: Gmail sender account.
- `EMAIL_PASS`: Gmail App Password, not the account's normal password.
- `CLIENT_URL`: existing frontend origin configuration; registration no longer sends links.
- `JWT_SECRET`: strong random signing secret; never expose it to the frontend.
- `JWT_EXPIRES_IN`: optional, defaults to `1h`; use a duration such as `30m` or `1h`.
- Existing `MONGO_URI`, `PORT`, and `NODE_ENV` retain their purposes.

Gmail App Password setup: https://nodemailer.com/guides/using-gmail

Run `npm install` in both `server` and `client`, then their existing `npm run dev`
commands. The Vite development proxy forwards `/api` to port 8006. Production
hosting must forward `/api` to Express and serve the React application for
`/verify-email`, `/login`, and other frontend routes. Use HTTPS in production.

## Flow and endpoints

1. `POST /api/auth/register`: creates an unverified user and sends a six-digit
   registration OTP valid for 10 minutes. No JWT is returned. React navigates to
   `/verify-email`. A delivery failure leaves the account available for resend.
2. The `/verify-email` page accepts the registered email and six-digit OTP, then
   calls `POST /api/auth/verify-email` with `{ email, code }`. Success marks the
   account verified, clears the registration OTP, and redirects to `/login` with
   a confirmation message. Wrong/expired codes keep the user on the page.
   The page supports resend and manual email entry after refresh or direct access.
   Old verification links are no longer accepted.
3. `POST /api/auth/login` with `{ email, password }` returns an expiring JWT and
   user profile immediately for verified users. No login OTP is sent. Unverified
   users receive `EMAIL_NOT_VERIFIED` and are directed to `/verify-email`.
4. `POST /api/auth/resend-verification` with `{ email }` replaces a registration
   OTP. The legacy login OTP endpoints remain available for outstanding challenges,
   but the frontend no longer uses them. Both signup and login have Show/Hide
   password controls.

Tokens/codes are stored as keyed SHA-256 hashes. OTP comparison is timing-safe.
Database conditional updates enforce single use, five attempts, and a 60-second
per-account email cooldown, including after a code is consumed or delivery fails.
Registration uses separate `registrationOtp` and `lastRegistrationEmailAt` fields;
it does not modify the login `authCode` or `lastAuthEmailAt` fields.
Resending replaces the previous code. Public authentication routes also
allow at most 30 requests per IP per 15 minutes. `/auth/me` is not rate-limited by
that authentication limiter. Its default IP store is process-local: use a shared
rate-limit store for multiple server instances, and configure Express proxy trust
for the actual hosting topology before deploying behind a reverse proxy.

Existing unverified accounts must verify email. Middleware accepts the new
`password` authentication claim and existing `email-otp` sessions, with the same
signature, expiry, and account checks. Frontend session keys retain their existing
names (`gigafrik_token`, `gigafrik_user`). Initial access is checked with `/auth/me`;
expiry, cross-tab changes, and protected API 401s clear or revalidate the session.
Login errors and role-related 403s do not trigger global logout.

The old one-click demo login cannot bypass verification. Home shortcuts now open
login. Demo data seeding is disabled unless `ENABLE_DEMO_SEED=true` and is always
disabled in production. Seeding deletes existing data; use only a disposable local
database. Seed accounts require access to their email inbox like any other account.

## Validation

- `cd server; npm test`: service/controller/middleware tests with mocked Mongoose
  operations and Nodemailer, including replay, concurrent consumption, expiry,
  attempt limits, resend, mail failure, and JWT checks.
- `cd client; npm test`: Axios session-clearing and error-preservation tests.
- `cd client; npm run build`: production bundle check.

Live acceptance check with a test inbox and MongoDB: register, enter the registration
OTP, sign in with email/password, access the correct dashboard, resend a registration code and
confirm the previous code fails, then use a short JWT lifetime to check logout.
Automated tests do not send real email or connect to the configured database.
