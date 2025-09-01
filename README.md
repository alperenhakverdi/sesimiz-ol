# Sesimiz Ol - Voice Communication Platform

**Sesimiz Ol** (Let Our Voice Be Heard) is a modern, secure voice communication platform that enables users to create channels, share voice messages, and engage in real-time conversations.

## 🚀 Live Demo

- **Frontend**: [https://sesimiz-ol.up.railway.app](https://sesimiz-ol.up.railway.app)
- **Backend API**: [https://sesimiz-ol-backend.up.railway.app](https://sesimiz-ol-backend.up.railway.app)

## ✨ Features

- **Voice Messaging**: Record and share voice messages in channels
- **Real-time Communication**: Join conversations with instant updates
- **User Management**: Secure authentication with JWT tokens
- **Profile Customization**: Upload avatars and manage personal settings
- **Channel Management**: Create and manage communication channels
- **Responsive Design**: Modern UI built with Chakra UI

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Chakra UI** - Component library and design system
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **React Audio Recorder** - Voice recording functionality

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Prisma** - Modern database toolkit
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **Multer & Sharp** - File upload and image processing
- **Helmet** - Security middleware

### Infrastructure
- **Railway** - Cloud deployment platform
- **Docker** - Containerization for local development

## 📦 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sesimiz-ol
   ```

2. **Environment setup**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   
   # Frontend environment  
   cp frontend/.env.example frontend/.env
   ```

3. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Setup database**
   ```bash
   # Run database migrations
   docker-compose exec backend npm run prisma:migrate
   
   # (Optional) Seed sample data
   docker-compose exec backend npm run prisma:seed
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Database Admin: http://localhost:5555 (Prisma Studio)

### Option 2: Manual Setup

1. **Prerequisites**
   - Node.js 18+ 
   - PostgreSQL 14+ (for local development)
   - npm or yarn

2. **Clone and install**
   ```bash
   git clone <repository-url>
   cd sesimiz-ol
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb sesimiz_ol
   
   # Configure backend/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/sesimiz_ol"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-refresh-secret-key"
   
   # Run migrations
   cd backend
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## 🔧 Environment Variables

### Backend (.env)
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/sesimiz_ol"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"

# Server Configuration
PORT=3001
NODE_ENV="development"

# File Upload
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
```

### Frontend (.env)
```env
# API Configuration
VITE_API_URL="http://localhost:3001/api"

# Development
VITE_PORT=5173
```

## 🐳 Docker Configuration

The project includes comprehensive Docker support:

- **docker-compose.yml** - Multi-service orchestration
- **backend/Dockerfile** - Node.js backend container
- **frontend/Dockerfile** - React frontend container with Nginx
- **Health checks** and **volume mounts** for development

### Docker Services

- **PostgreSQL** - Database server (port 5432)
- **Backend** - Express.js API (port 3001)
- **Frontend** - React app with Nginx (port 5173)
- **Prisma Studio** - Database management UI (port 5555)

## 🚢 Deployment

### Railway Deployment

This project is configured for Railway's full-stack deployment:

1. **Fork the repository**
2. **Connect to Railway**
   - Import your GitHub repository
   - Railway will auto-detect the monorepo structure
3. **Environment variables** are automatically set from railway.toml
4. **Database** is provisioned automatically
5. **File uploads** use Railway's persistent volumes

### Manual Railway Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link <your-project-id>
railway up
```

## 📁 Project Structure

```
sesimiz-ol/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   └── utils/           # Helper functions
│   ├── prisma/             # Database schema and migrations
│   ├── uploads/            # File upload directory
│   └── package.json
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── utils/          # Helper utilities
│   └── package.json
│
├── docker-compose.yml      # Docker orchestration
├── railway.toml           # Railway deployment config
└── README.md
```

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **Password hashing** with bcrypt
- **CORS protection** for API endpoints
- **Helmet security** headers
- **Input validation** and sanitization
- **File upload restrictions** and validation

## 🎨 UI Features

- **Modern Design** with Chakra UI components
- **Responsive Layout** for all device sizes
- **Progressive Loading** animations
- **Dark/Light Mode** theme support
- **Accessibility** compliant components
- **Custom Icons** and visual elements

## 🧪 Development Scripts

### Backend
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open database admin UI
```

### Frontend  
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload user avatar
- `PUT /api/users/password` - Change password

### Channel Endpoints
- `GET /api/channels` - Get all channels
- `POST /api/channels` - Create new channel
- `GET /api/channels/:id` - Get channel details
- `POST /api/channels/:id/messages` - Send voice message

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
- Ensure backend CORS is configured for your frontend URL
- Check that both servers are running on expected ports

**Database Connection**
- Verify PostgreSQL is running
- Check DATABASE_URL format in .env file
- Run `npm run prisma:generate` after schema changes

**File Upload Issues**
- Ensure uploads directory exists and has write permissions
- Check file size limits in environment variables
- Verify multer configuration matches frontend expectations

**Build Errors**
- Clear node_modules and package-lock.json, then reinstall
- Ensure all environment variables are set correctly
- Check for TypeScript or ESLint errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-time communication needs
- Designed for scalable, secure voice sharing

---

**Made with ❤️ for seamless voice communication**