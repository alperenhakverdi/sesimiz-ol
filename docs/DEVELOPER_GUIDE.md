# Developer Guide - Sesimiz Ol

## Architecture Overview
- **Frontend:** React 18 + Vite + Chakra UI
- **Backend:** Node.js + Express + PostgreSQL
- **Authentication:** JWT
- **File Storage:** Local filesystem
- **Caching:** Redis (optional)

## Development Setup

1. **Prerequisites**
   ```bash
   node >= 18.0.0
   npm >= 8.0.0
   postgresql >= 14
   ```

2. **Installation**
   ```bash
   git clone <repository>
   cd sesimiz-ol

   # Install dependencies
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

3. **Database Setup**
   ```bash
   createdb sesimiz_ol
   npm run db:migrate
   npm run db:seed
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## Project Structure
```
sesimiz-ol/
├── frontend/          # React frontend
├── backend/           # Node.js API
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── tests/            # Test suites
```

## Database Schema
- **users** - User accounts
- **stories** - User stories
- **comments** - Story comments
- **organizations** - STK organizations
- **user_follows** - User following relationships
- **story_bookmarks** - Bookmarked stories

## API Development
- Follow RESTful conventions
- Use middleware for authentication
- Implement proper error handling
- Add input validation
- Write comprehensive tests

## Frontend Development
- Use Chakra UI components
- Follow React best practices
- Implement responsive design
- Use React hooks for state management
- Optimize for performance

## Testing
```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Deployment
```bash
# Production build
npm run build

# Deploy with PM2
pm2 start ecosystem.config.js --env production
```

## Contributing Guidelines
1. Create feature branches
2. Write tests for new features
3. Follow code style guidelines
4. Submit pull requests
5. Ensure CI/CD passes