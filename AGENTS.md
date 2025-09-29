# Contributor Quick Guide

Welcome to *Sesimiz Ol*. This is the drop-in cheat sheet for agents/contributors.

## Project Snapshot
- **Frontend:** `frontend/` (React 18 + Vite + Chakra UI)
- **Backend:** `backend/` (Node.js + Express + Prisma)
- **Infra:** `docker-compose.yml` (backend + frontend + optional nginx), shared helpers in `shared/`, scripts in `scripts/`.
- **Serverless:** `functions/` hosts Firebase Cloud Functions (optional).

## Local Workflow
1. `npm install` (root) → installs root toolchain (`concurrently`).
2. `cd frontend && npm install`, `cd backend && npm install`.
3. `cp .env.example .env` in root, backend, and frontend.
4. Database setup:
   ```bash
   cd backend
   npx prisma migrate dev
   npm run seed
   ```
5. Start everything from root: `npm run dev` (backend 3002, frontend 5173).

> Prefer SQLite for local dev (auto-managed by Prisma). Use PostgreSQL in production.

## Coding Standards
- Follow ESLint/Prettier defaults (2 spaces, single quotes, semicolons).
- React components in PascalCase (`StoryLikeButton.jsx`), backend controllers in `camelCaseController.js`.
- Keep hooks at the top level; avoid conditional `useColorModeValue` calls.
- Check `frontend/.eslintrc` and `backend` lint rules when touching files.

## Git & Reviews
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Run relevant lint/tests before opening a PR:
  ```bash
  cd frontend && npm run lint
  cd backend && npm test
  ```
- Mention Prisma migrations/seed changes in PR description.
- Screenshots/GIFs for UI adjustments are appreciated.

## Data & Seeds
- Seed script lives at `backend/src/seedDatabase.js` (`npm run seed`).
- Demo accounts include `fatma@example.com / demo123` plus additional sample users.

## Docker Tips
- `docker compose up --build` starts backend + frontend (nginx proxy optional).
- After containers start, run migrations inside backend container:
  ```bash
  docker compose exec backend npx prisma migrate deploy
  docker compose exec backend npm run seed
  ```

Need more detail? Check `README.md`, `DEVELOPMENT.md`, and `SECURITY.md` for expanded instructions.
