# GEMINI.md - Your AI Assistant's Guide to this Workspace

This document provides a comprehensive overview of the projects and tools within this workspace, enabling your Gemini assistant to provide effective and context-aware support.

## Workspace Overview

This workspace appears to be a multi-project environment, primarily focused on web development. It contains a mix of project directories, configuration files, and tool-specific folders. The most prominent project is **"Sesimiz Ol"**, a voice communication platform.

### Key Directories

*   **`sesimiz-ol/`**: The main project in this workspace. A full-stack application with a React frontend and a Node.js backend.
*   **`ECommerce.Solution/`**: Likely a .NET-based e-commerce project.
*   **`kivilcim-mentor-platformu/`**: Another project, potentially related to a mentoring platform.
*   **`SuperClaude_Framework/`**: A directory related to the "SuperClaude" framework.
*   **`.dotnet/`, `.nuget/`**: Configuration and cache directories for the .NET ecosystem.
*   **`.npm/`, `node_modules/`**: Directories related to Node.js package management.
*   **`.claude/`, `.codex/`, `.gemini/`, `.serena/`**: Directories for various AI assistant tools.

## Project: "Sesimiz Ol"

"Sesimiz Ol" (Let Our Voice Be Heard) is a modern, secure voice communication platform that enables users to create channels, share voice messages, and engage in real-time conversations.

### Tech Stack

*   **Frontend**: React 18, Chakra UI, React Router, Axios, React Audio Recorder
*   **Backend**: Node.js, Express.js, Prisma, PostgreSQL, JWT, Multer, Sharp, Helmet
*   **Infrastructure**: Railway, Docker

### Building and Running

The project can be run using Docker (recommended) or manually.

**Using Docker:**

1.  **Environment Setup**:
    ```bash
    # Backend environment
    cp sesimiz-ol/backend/.env.example sesimiz-ol/backend/.env

    # Frontend environment
    cp sesimiz-ol/frontend/.env.example sesimiz-ol/frontend/.env
    ```

2.  **Start with Docker**:
    ```bash
    docker-compose up -d
    ```

3.  **Setup Database**:
    ```bash
    # Run database migrations
    docker-compose exec backend npm run prisma:migrate

    # (Optional) Seed sample data
    docker-compose exec backend npm run prisma:seed
    ```

4.  **Access the Application**:
    *   **Frontend**: http://localhost:5173
    *   **Backend API**: http://localhost:5000
    *   **Database Admin**: http://localhost:5555 (Prisma Studio)

**Manual Setup:**

1.  **Prerequisites**: Node.js 18+, PostgreSQL 14+
2.  **Installation**:
    ```bash
    # Install backend dependencies
    cd sesimiz-ol/backend
    npm install

    # Install frontend dependencies
    cd ../frontend
    npm install
    ```
3.  **Database Setup**:
    ```bash
    # Create PostgreSQL database
    createdb sesimiz_ol

    # Configure backend/.env
    # See sesimiz-ol/README.md for details

    # Run migrations
    cd sesimiz-ol/backend
    npm run prisma:migrate
    npm run prisma:generate
    ```
4.  **Start Development Servers**:
    ```bash
    # Terminal 1 - Backend
    cd sesimiz-ol/backend
    npm run dev

    # Terminal 2 - Frontend
    cd sesimiz-ol/frontend
    npm run dev
    ```

### Development Conventions

*   **Code Style**: The project uses Prettier for code formatting.
*   **Linting**: ESLint is used for linting JavaScript and React code.
*   **Commits**: The project follows conventional commit standards.
*   **Project Structure**: The `sesimiz-ol` directory is a monorepo with `frontend`, `backend`, and `shared` directories.

### API Endpoints

The backend provides a RESTful API for managing users, channels, and messages.

*   **Authentication**: `POST /api/auth/register`, `POST /api/auth/login`, etc.
*   **Users**: `GET /api/users/profile`, `PUT /api/users/profile`, etc.
*   **Channels**: `GET /api/channels`, `POST /api/channels`, etc.

For a full list of endpoints, please refer to the `sesimiz-ol/README.md` file.

### Firebase Integration

The project is integrated with Firebase for hosting and cloud functions.

*   **Hosting**: The `frontend/dist` directory is deployed to Firebase Hosting.
*   **Functions**: The `functions` directory contains the source code for Firebase Functions.
