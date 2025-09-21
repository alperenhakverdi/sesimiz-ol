# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` hosts the Vite + React UI; views live in `frontend/src/`, static assets in `frontend/public/`, and colocated tests follow `Component.test.jsx`.
- `backend/` contains the Express API with routes/services in `backend/src/`, Prisma schema + migrations under `backend/prisma/`, and transient uploads in `backend/uploads/`.
- Firebase Functions sit in `functions/`, shared utilities belong in `shared/`, and deployment docs plus `docker-compose.yml` live at the repo root.

## Build, Test, and Development Commands
- Run `npm run dev` from the root to launch frontend and backend with hot reload against your local Postgres.
- Start the database via `docker compose up -d database`, then run `cd backend && npm run prisma:migrate` on a fresh instance.
- Build and preview the UI with `cd frontend && npm run build` followed by `npm run preview`; inspect Prisma data using `cd backend && npm run prisma:studio`.

## Coding Style & Naming Conventions
- Respect the repo Prettier config (2-space indent, single quotes, ~80 char wrap); format with `npx prettier --write .`.
- Use `cd frontend && npm run lint` and `cd backend && npx eslint .` before opening a PR.
- Name JS/TS variables and functions in camelCase, React components in PascalCase, and Express route files in lowercase.

## Testing Guidelines
- Frontend tests use Vitest + React Testing Library; colocate specs as `Component.test.jsx` and run `cd frontend && npm test`.
- Backend tests rely on Jest + supertest; keep `*.test.js` beside the modules they cover and execute via `cd backend && npm test`.
- Document any coverage gaps or pending scenarios in PR descriptions, especially when altering schema or auth flows.

## Commit & Pull Request Guidelines
- Follow Conventional Commits such as `feat(backend): add seed endpoint`; keep scopes aligned with affected packages.
- PRs should outline scope, link to related issues, include UI screenshots for visual changes, and list verification steps (build, lint, migrations).
- Confirm new Prisma migrations accompany schema changes and note any manual follow-up required post-deploy.

## Security & Configuration Tips
- Copy each package’s `.env.example` to `.env` and keep secrets (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `VITE_API_BASE_URL`) out of git.
- Review backend CORS origins before releases and store Firebase credentials securely (never in the repo).
- Clear `backend/uploads/` of temporary artifacts before pushing branches or tagging releases.
