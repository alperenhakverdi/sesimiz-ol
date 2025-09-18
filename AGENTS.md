# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` — Vite + React UI (Chakra UI), source in `src/`, static in `public/`, build to `dist/`.
- `backend/` — Express API with Prisma. App in `src/`, schema/migrations in `prisma/`, uploads in `uploads/`.
- `functions/` — Firebase Cloud Functions (Node 18). Entry `index.js`, controllers in root and `routes/`.
- Infra/docs: `docker-compose.yml`, `.firebase/`, `firebase.json`, `docs/`, `shared/`.
- Environment: copy `.env.example` to project-specific `.env` files (e.g., `backend/.env`, `frontend/.env`).

## Build, Test, and Development Commands
- Root dev: `npm run dev` — runs backend and frontend concurrently.
- Local DB: `docker compose up -d database` — start Postgres only. First-time: `cd backend && npm run prisma:migrate`.
- Full stack (containers): `docker compose up` — spins up DB, backend, frontend.
- Frontend: `cd frontend && npm run build` (bundles), `npm run preview` (serve build), `npm run lint` (ESLint).
- Backend: `cd backend && npm run dev` (watch), `npm run prisma:studio` (DB UI), `npm run prisma:migrate` (apply dev migrations).
- Cloud Functions (local): `cd functions && npm run serve`.

## Coding Style & Naming Conventions
- Use Prettier config at repo root (2 spaces, single quotes, width 80). Run `npx prettier --write .` before PRs.
- Lint: frontend uses ESLint (`npm run lint`); backend uses ESLint defaults (`npx eslint .`).
- Naming: camelCase for vars/functions; PascalCase for React components/files (e.g., `UserProfile.jsx`); backend routes lowercase (e.g., `routes/stories.js`).

## Testing Guidelines
- Currently no automated tests. When adding tests:
  - Frontend: Vitest + React Testing Library (`*.test.jsx` next to components).
  - Backend: Jest + supertest (`*.test.js` alongside `src/`).
  - Add `npm test` scripts in each package; aim for meaningful coverage of changed code.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits: `feat(backend): add seed endpoint` or `fix(frontend): correct CORS base URL`.
- PRs must include: concise description, linked issues, screenshots for UI, steps to verify, and notes on env/migrations.
- Ensure: builds succeed, lints pass, Prisma migrations committed when schema changes.

## Security & Configuration Tips
- Never commit secrets. Required examples:
  - Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.
  - Frontend: `VITE_API_BASE_URL` (e.g., `http://localhost:3001/api`).
  - Functions: align with Node 18; keep service creds local.
- Validate CORS in `.env`/deploy configs before merging.

