# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sesimiz Ol** is an anonymous voice communication platform for women to share their stories safely. It features:
- Anonymous story sharing with STK (NGO) organization support
- User engagement through likes, comments, follows, and bookmarks
- Admin panel for content moderation and platform management
- Full authentication system with JWT tokens and session management

## Architecture

### Technology Stack
- **Frontend**: React 18 + Vite + Chakra UI (responsive design)
- **Backend**: Node.js + Express + SQLite (via Prisma ORM)
- **Authentication**: JWT with refresh tokens, HttpOnly cookies, CSRF protection
- **File Storage**: Local filesystem with multer
- **Testing**: Jest + supertest (backend), Vitest + React Testing Library (frontend)
- **Deployment**: Docker with nginx proxy

### Project Structure
```
sesimiz-ol/
├── frontend/          # React app (port 5173 dev, 3000 prod)
├── backend/           # Express API (port 3001)
├── functions/         # Firebase Functions
├── shared/            # Shared utilities
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Development Commands

### Quick Start
```bash
# Start both frontend and backend with hot reload
npm run dev

# Database setup (first time)
docker compose up -d database
cd backend && npm run prisma:migrate

# Full Docker setup
docker compose up
```

### Backend Commands
```bash
cd backend

# Development
npm run dev                    # Start with hot reload
npm run start                  # Production start
npm run build                  # Generate Prisma client

# Database
npm run prisma:migrate         # Run migrations
npm run prisma:studio          # Open Prisma Studio
npm run prisma:deploy          # Deploy migrations (prod)
npm run seed                   # Seed database

# Testing
npm test                       # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage
npm run test:endpoints         # API endpoint tests only
npm run test:auth              # Auth tests only
npm run test:stories           # Stories tests only
npm run test:users             # Users tests only
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview                # Preview production build
npm run lint                   # ESLint check
```

## Authentication Architecture

The platform uses a sophisticated auth system with:

- **JWT Access Tokens**: Short-lived (15 min), delivered via HttpOnly cookies
- **Refresh Tokens**: Long-lived (7 days), stored in `user_sessions` table with device tracking
- **CSRF Protection**: Double-submit token pattern with custom headers
- **Session Management**: Full device tracking, logout all sessions capability
- **Account Security**: Rate limiting, account lockout after failed attempts
- **Password Reset**: OTP-based flow with email notifications (feature flag controlled)

### Key Auth Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - Single session logout
- `POST /api/auth/logout-all` - All sessions logout
- `GET /api/auth/csrf` - CSRF token endpoint

## Database Schema

Key entities managed via Prisma:
- **User**: Account data, roles (USER/ADMIN), ban status, email verification
- **Story**: Anonymous stories with approval workflow, categories, content moderation
- **Comment**: Nested comments with reactions and moderation
- **Organization**: STK/NGO organizations with member management
- **UserSession**: Session tracking with device metadata and security controls
- **Notification**: Real-time user notifications
- **Bookmark**: User story bookmarking
- **UserFollow**: User following relationships

## Code Patterns

### Frontend Patterns
- React Router v7 with lazy loading for code splitting
- Chakra UI components with custom theme (`frontend/src/theme/`)
- Context-based auth state management (`frontend/src/contexts/AuthContext`)
- SWR for data fetching with axios interceptors
- Error boundaries for robust error handling
- Accessibility enhancements throughout

### Backend Patterns
- Express.js with modular route organization (`backend/src/routes/`)
- Middleware-based auth and validation (`backend/src/middleware/`)
- Service layer for business logic (`backend/src/services/`)
- Joi for request validation
- Prisma for type-safe database operations
- Security logging and metrics collection

## Environment Configuration

Copy `.env.example` to `.env` and configure:

### Critical Variables
- `DATABASE_URL`: SQLite database path
- `JWT_SECRET` / `JWT_REFRESH_SECRET`: Token signing keys
- `VITE_API_BASE_URL`: Frontend API endpoint
- `NODE_ENV`: Environment (development/production)

### Feature Flags
The platform supports feature flags for gradual rollouts:
- `passwordResetV2`: Controls new OTP-based password reset flow
- Managed via backend scripts: `npm run feature-flags`

## Testing Strategy

### Backend Testing
- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: Full API endpoint testing with test database
- **Security Tests**: Auth flows, rate limiting, input validation
- Test files colocated with source code as `*.test.js`

### Frontend Testing
- **Component Tests**: React Testing Library with Vitest
- **Accessibility Tests**: a11y compliance verification
- Test files colocated as `Component.test.jsx`

## Security Considerations

- All routes under `/api/admin/*` require ADMIN role
- File uploads restricted by type and size (`MAX_FILE_SIZE`)
- CORS configured for specific origins only
- Rate limiting on auth endpoints
- SQL injection prevention via Prisma
- XSS protection through HttpOnly cookies and input sanitization

## Development Guidelines

### Code Style
- 2-space indentation, single quotes (Prettier configured)
- ESLint rules enforced for both frontend and backend
- Conventional Commits for version history
- camelCase for JS/TS, PascalCase for React components

### Pull Request Process
- Include scope in commit messages: `feat(backend):`, `fix(frontend):`
- Run lint/test commands before submitting
- Document Prisma schema changes and migration requirements
- Include UI screenshots for visual changes