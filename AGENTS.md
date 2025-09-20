# Repository Guidelines

## Project Structure & Module Organization
Frontend code lives in `frontend/` (Vite + React) with views in `frontend/src/`, assets under `frontend/public/`, and colocated tests as `Component.test.jsx`. The Express API sits in `backend/`; routes and services live in `backend/src/`, Prisma schema and migrations in `backend/prisma/`, and transient uploads in `backend/uploads/`. Firebase Functions reside in `functions/` with entrypoint wiring in `functions/index.js`. Shared utilities belong in `shared/`, while root-level infra docs and `docker-compose.yml` support deployments.

## Build, Test, and Development Commands
- `npm run dev` (root) starts frontend and backend with hot reload.
- `docker compose up -d database` spins up Postgres; follow with `cd backend && npm run prisma:migrate` on a fresh database.
- `cd frontend && npm run build` compiles the production UI; `npm run preview` serves the build locally.
- `cd backend && npm run dev` watches API changes; use `npm run prisma:studio` for DB inspection.

## Coding Style & Naming Conventions
Respect the repo Prettier config (2-space indent, single quotes, 80-char wrap) and run `npx prettier --write .` before commits. Lint UI code with `cd frontend && npm run lint` and API code with `cd backend && npx eslint .`. Use camelCase for variables/functions, PascalCase for React components, and lowercase filenames for Express routes.

## Testing Guidelines
Frontend tests rely on Vitest + React Testing Library; place specs beside components as `Component.test.jsx` and run `cd frontend && npm test`. API tests use Jest + supertest, named `*.test.js` next to their modules and executed via `cd backend && npm test`. Document any gaps in PR descriptions when coverage is incomplete.

## Commit & Pull Request Guidelines
Follow Conventional Commits such as `feat(backend): add seed endpoint`. Each PR should describe scope, link related issues, include UI screenshots when visuals change, and list verification steps (build, lint, migrations). Confirm new Prisma migrations are committed whenever the schema evolves.

## Security & Configuration Tips
Copy each package’s `.env.example` to `.env`, keeping secrets (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `VITE_API_BASE_URL`) out of version control. Review backend CORS origins before deployment, store Firebase credentials securely, and clear `backend/uploads/` of temporary files before pushing.
