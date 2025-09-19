# Authentication & Session Architecture

_Last updated: Phase 2 pre-flight_

## Overview
- **Authentication** uses signed JWT access tokens (short lived) and refresh tokens (long lived) issued by the Express API.
- **Session persistence** is backed by the `user_sessions` table, storing a hashed refresh token per device with metadata (IP, user agent, expiry, revocation).
- **Transport**: both tokens are delivered via HttpOnly, SameSite cookies to mitigate XSS; API calls rely on cookies + CSRF header pair.
- **Frontend**: React app no longer persists tokens in localStorage. Axios sends credentials by default and reads CSRF header from `/api/auth/csrf` bootstrap endpoint.

## Token Lifecycle
1. **Login/Register**
   - Credentials validated.
   - New session row inserted with hashed refresh token and absolute expiry window.
   - Response sets two cookies:
     - `AUTH_COOKIE_NAME` – 15 minute access token (`JWT_ACCESS_EXPIRES_IN`).
     - `AUTH_REFRESH_COOKIE_NAME` – 7 day refresh token (`JWT_REFRESH_EXPIRES_IN`).
2. **Authenticated Requests**
   - Access token validated on each request (signature + expiration + user status + ban flag).
   - `req.user` populated with id, role, status for downstream authorization.
3. **Refresh Flow**
   - Frontend hits `/api/auth/refresh` when receiving `401 TOKEN_EXPIRED`.
   - Backend validates refresh cookie, compares hashed token with stored `user_sessions` record, checks revocation/expiry.
   - Session `lastSeenAt` updated; new access token issued, refresh rotated (old session revoked, new row created with `replacedBySessionId`).
4. **Logout**
   - `/api/auth/logout` clears cookies, revokes current session by setting `revokedAt` and reason.
   - `/api/auth/logout-all` revokes all sessions for the user.

## Security Controls
- **Account Lockout**: after `LOGIN_FAILURE_LIMIT` attempts within `LOGIN_FAILURE_WINDOW_MINUTES`, account is temporarily locked (`ACCOUNT_LOCK_MINUTES`), logged via security logger.
- **HttpOnly Cookies**: configured via `AUTH_COOKIE_*` env vars, `secure` auto-enforced in production.
- **CSRF Protection**: double submit token pattern (`CSRF_COOKIE_NAME` + `VITE_CSRF_HEADER_NAME`). Token minted at `/api/auth/csrf` and refreshed on login/register.
- **Rate Limiting**: per-route rate limit for auth endpoints plus per-email reset limits.
- **Security Logging**: successes/failures go through `SECURITY_EVENT_LOG_CHANNEL` for monitoring/alerting.

## Password Reset
1. `POST /api/auth/forgot-password`
   - Validates rate limit (per email and global).
   - Generates 6 digit OTP + random reset token; stores hashed values in `password_reset_tokens` with TTL `PASSWORD_RESET_TOKEN_TTL_MINUTES`.
   - Sends email via Firebase Admin (HTML + plain text templates).
2. `POST /api/auth/verify-otp`
   - Verifies OTP, increments `attemptCount`, returns short-lived signed reset token for the next step.
3. `POST /api/auth/reset-password`
   - Validates reset token, enforces password policy, updates password, revokes all existing sessions.

## Roles & Permissions
- User role stored on `users.role` (enum `Role`).
- Admin middleware ensures active session + `role` check before `/api/admin/*`.
- Fine-grained permissions configured via helper service (to be implemented in Phase 2.2).

## Feature Flags & Migration
- Gradual rollout controlled via `FEATURE_*` env flags and forthcoming flag table.
- Legacy auth fallback (if needed) can consult feature flag to allow legacy token parsing until migration complete.

## Integration Tasks
- Frontend: update AuthContext, Axios default `withCredentials`, CSRF bootstrap, lockout messaging.
- Backend: implement new endpoints, update controllers to use sessions and cookies, ensure Prisma migrations applied, update tests.
- Ops: rotate JWT/CSRF secrets, configure Postgres, ensure monitoring pipeline captures security logs.
