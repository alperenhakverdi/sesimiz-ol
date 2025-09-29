# Security & Hardening Guide

This checklist summarizes the minimum steps required before deploying *Sesimiz Ol* to a production environment.

## 1. Environment & Secrets
- Generate unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (store outside git).
- Set `DATABASE_URL` to a managed PostgreSQL instance with TLS.
- Configure `CORS_ORIGIN` to the public frontend domain.
- Disable verbose logging: `NODE_ENV=production` and adjust logger level.

## 2. Prisma & Database
- Run migrations via `npx prisma migrate deploy` during deployment.
- Enforce least-privilege DB credentials and rotate regularly.
- Enable automated backups and point-in-time recovery on the DB server.
- Monitor slow queries (via Prisma or DB logs).

## 3. API & App Server
- Serve backend behind HTTPS (e.g., nginx reverse proxy).
- Helmet middleware already sets CSP, HSTS, and other security headers—verify values match deployment domain.
- Keep rate limits enabled (`express-rate-limit` in auth & messaging routes).
- Ensure CSRF tokens are required for all state-changing requests (already enforced).
- Validate payloads via existing Joi/validator middleware; extend rules when adding fields.

## 4. Authentication & Sessions
- Passwords hashed with bcrypt (12 rounds); enforce strong password policy on the frontend.
- JWT access tokens short lived; refresh tokens rotated on each refresh.
- Account lockout is implemented—monitor lockout events to detect brute-force attempts.
- Invalidate sessions on logout/all-device logout endpoints.

## 5. File Uploads
- Avatar uploads limited to 5 MB and verified by MIME type.
- Store uploads outside the repo (`backend/uploads`) and back the directory with a secure volume or object store.
- Consider adding antivirus scanning in production if allowing arbitrary uploads.

## 6. Monitoring & Alerts
- Enable application logging (pino) and ship logs to a central store.
- Track health endpoints (`/health`) with uptime monitoring.
- Set up alerting for 4xx/5xx spikes, rate-limit hits, and DB connection errors.

## 7. Ongoing Maintenance
- Regularly update npm dependencies (`npm outdated` / `npm audit fix`).
- Review audit logs for admin actions and failed logins.
- Run `npm run test` and `npm run lint` before each release.
- Document and test incident response (backup restore, user lockout).

For additional reference, see `docs/SECURITY_CHECKLIST.md` (if maintained) or expand this file as the platform evolves.
