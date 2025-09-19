# Repository Guidelines

## Project Structure & Module Organization
The repo is grouped by deployment target. `frontend/` hosts the Vite + React UI (`src/` for views, `public/` assets, `dist/` builds). `backend/` contains the Express + Prisma API (`src/` routes/services, `prisma/` schema and migrations, `uploads/` temp files). Firebase Functions live under `functions/` with `index.js` wiring Firestore routes. Shared utilities sit in `shared/`, and infra docs plus `docker-compose.yml` live at the root. Colocate UI tests as `Component.test.jsx` and API specs as `*.test.js` beside the modules they cover.

## Build, Test, and Development Commands
- `npm run dev` (root): boots frontend and backend together with hot reload.
- `docker compose up -d database`: starts Postgres; follow with `cd backend && npm run prisma:migrate` on first run.
- `cd frontend && npm run build`: compiles production UI; use `npm run preview` to inspect.
- `cd backend && npm run dev`: watches API changes; `npm run prisma:studio` opens the database inspector.

## Coding Style & Naming Conventions
Use the repo Prettier config (2-space indent, single quotes, 80-char wrap). Format with `npx prettier --write .` before commits. Run `cd frontend && npm run lint` and `cd backend && npx eslint .`. Use camelCase for variables/functions, PascalCase for React component files, and lowercase for Express route filenames.

## Testing Guidelines
UI code relies on Vitest + React Testing Library; place specs as `Component.test.jsx` next to components and run `cd frontend && npm test`. API code uses Jest + supertest with `*.test.js`; execute via `cd backend && npm test` (add the script when introducing coverage). Favor focused scenarios and document any gaps in the PR description.

## Commit & Pull Request Guidelines
Follow Conventional Commits such as `feat(backend): add seed endpoint` or `fix(frontend): adjust CORS base URL`. PRs must describe scope, link related issues, include UI screenshots for visual changes, and list verification steps (build, lint, migrations). Confirm Prisma migrations are committed whenever the schema changes.

## Security & Configuration Tips
Copy each package’s `.env.example` to `.env` and keep secrets (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `VITE_API_BASE_URL`) out of git. Review CORS origins before deployment, secure Firebase credentials outside the repo, and clear temporary uploads from `backend/uploads/` prior to pushing.
