# Development Setup

This guide walks through running *Sesimiz Ol* locally with the default SQLite database. If you prefer PostgreSQL, adjust the `DATABASE_URL` accordingly.

## 1. Prerequisites
- Node.js 20+
- npm 10+
- Git
- (Optional) Docker & docker-compose

## 2. Repository Setup
```bash
git clone <repo-url>
cd sesimiz-ol
npm install          # installs root tooling (concurrently)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## 3. Environment Variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
> For quick local runs keep `DATABASE_URL="file:./dev.db"` in `backend/.env`. PostgreSQL is recommended in production.

## 4. Database & Seed
```bash
cd backend
npx prisma migrate dev
npm run seed
cd ..
```
The seed creates demo users and stories (see `backend/src/seedDatabase.js`).

## 5. Start Development Servers
```bash
npm run dev
```
- Backend: http://localhost:3002 (API under `/api`)
- Frontend: http://localhost:5173

## 6. Useful Commands
| Command | Description |
|---------|-------------|
| `cd backend && npm run dev` | Run only the API with watch mode |
| `cd frontend && npm run dev` | Run only the frontend |
| `cd backend && npx prisma studio` | Inspect DB via Prisma Studio |
| `cd backend && npm test` | Backend Jest tests |
| `cd frontend && npm run lint` | Frontend ESLint |

## 7. Docker Option
1. Edit `.env` to suit Docker deployment (database URL, secrets).
2. Apply migrations/seed inside container:
   ```bash
   docker compose up --build
   docker compose exec backend npx prisma migrate deploy
   docker compose exec backend npm run seed
   ```
3. Frontend served at `http://localhost` via nginx, backend API at `http://localhost:3001/api`.

## 8. Troubleshooting
- **Prisma drift / DB reset**
  ```bash
  cd backend
  npx prisma migrate reset --force --skip-seed
  npm run seed
  ```
- **Port already in use:** stop old process (`lsof -i :5173` / `:3002`).
- **Avatar URLs not loading:** ensure `VITE_API_URL` matches backend origin.

## 9. Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| `fatma@example.com` | `demo123` | USER |
| `ayse@example.com` | `12345678` | USER |
| `admin@example.com` | `12345678` | (set via `scripts/make-admin.js`) |

You’re ready to build! See `README.md` for feature highlights and release instructions.
