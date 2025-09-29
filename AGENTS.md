# Repository Guidelines

## Project Structure & Module Organization
- `backend/` hosts the Express API; core code lives in `backend/src/`, Prisma schema in `backend/prisma/`, automated tests in `backend/tests/`, and seed utilities in `backend/scripts/`.
- `frontend/` contains the Vite React app with components, pages, and contexts under `frontend/src/` and static assets in `frontend/public/`.
- `functions/` provides Firebase Cloud Functions targeting Node 18, while `docs/`, `scripts/`, and `shared/` hold reference material, operational helpers, and shared assets.
- Copy `.env.example` files (root and `backend/`) before running any service; adjust ports and database URLs as needed.

## Build, Test, and Development Commands
- `npm run dev` (root) boots the full stack: backend on `http://localhost:3002` and frontend via Vite (default `5173`).
- `cd backend && npm run dev` starts the API with hot reload.
- `cd frontend && npm run dev` launches the React client.
- `cd backend && npm test` runs Jest + Supertest suites; `npm run test:coverage` adds Istanbul coverage output.
- Prisma workflows: `npm run prisma:generate`, `npm run prisma:migrate`, and `npm run seed` for development data.

## Coding Style & Naming Conventions
- Follow the shared Prettier config (2-space indent, single quotes, semicolons) and ESLint rules in both apps.
- Prefer `const`/`let`; avoid `var`. Backend routes use lowercase filenames (e.g., `stories.js`), controllers use `camelCaseController.js`, and React components use PascalCase (e.g., `HomePage.jsx`).
- Keep commits and diffs ASCII; document any intentional deviations.

## Testing Guidelines
- Backend tests reside in `backend/tests/endpoints/` and related folders, leveraging Jest setup that auto-applies migrations using `TEST_DATABASE_URL`.
- Write tests alongside features; mirror filenames with a `.test.js` suffix.
- Inspect coverage locally with `npm run test:coverage`; investigate any drops before merging.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`feat:`, `fix:`, `docs:`, `refactor:`); write imperative, concise subjects.
- PRs should include a clear summary, linked issues, backend/frontend testing notes, and screenshots for UI tweaks.
- Verify lint (`cd frontend && npm run lint`) and Jest suites before requesting review; mention Prisma migrations or seed changes explicitly.

## Security & Configuration Tips
- Never commit secrets; rely on `.env` files and keep them out of version control.
- Update `VITE_API_BASE_URL` when the backend port or host changes.
- Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` promptly if exposed, and restrict CORS origins to trusted hosts.
