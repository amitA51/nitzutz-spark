# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Nitzutz Spark (ניצוץ) is a full-stack personal knowledge management application for a single user. It features two main modules:
- **Personal Library** (`/library`): Book tracking, reading progress, and rich-text summaries
- **Discovery Engine** (`/`): Article discovery with AI-powered Q&A capabilities

## Development Commands

### Backend (Express + TypeScript + Prisma)
```bash
# Install dependencies
cd backend && npm install

# Database operations
npx prisma migrate dev           # Run migrations
npx prisma generate              # Generate Prisma client
npx prisma studio                # Open database GUI

# Development
npm run dev                      # Start with hot reload (tsx watch)

# Build & Production
npm run build                    # Compile TypeScript
npm run start                    # Run compiled JS

# Seed dummy articles (backend must be running)
curl -X POST http://localhost:5000/api/articles/seed
```

### Frontend (React + TypeScript + Vite)
```bash
# Install dependencies
cd frontend && npm install

# Development
npm run dev                      # Start dev server (http://localhost:5173)

# Build & Production
npm run build                    # Build for production
npm run preview                  # Preview production build

# Code quality
npm run lint                     # Run ESLint
```

## Architecture

### Backend Structure
The backend uses a modular Express architecture with TypeScript and Prisma ORM:

- **Entry Point**: `backend/src/server.ts` - Configures Express middleware, mounts routes, handles database connection
- **Route Modules**: Located in `backend/src/routes/`:
  - `books.ts` - CRUD operations for books
  - `summaries.ts` - Chapter summaries management
  - `articles.ts` - Article discovery feed with pagination
  - `savedArticles.ts` - Save/unsave article functionality
  - `ai.ts` - AI Q&A about articles
  - `settings.ts` - User preferences and API keys

- **Database**: SQLite with Prisma ORM (`backend/prisma/schema.prisma`)
  - Models: Book, Summary, Article, SavedArticle, AiQuestion, UserSettings
  - Supports cascading deletes and unique constraints
  - Single-user focused (no auth/multi-tenancy)

### Frontend Structure
React SPA with TypeScript, Vite, and Tailwind CSS:

- **Routing**: React Router with two main routes:
  - `/` - Discovery Engine (article feed)
  - `/library` - Personal Library (books & summaries)

- **Design System**:
  - Dark mode only with pure black background (#000000)
  - Professional blue accent (#3B82F6)
  - Google Sans typography
  - Minimalist, professional interface

- **State Management**: Component-level state with React hooks
- **API Communication**: Axios for HTTP requests to backend

### API Design
RESTful API with standard CRUD operations:
- Base URL: `http://localhost:5000/api`
- Endpoints grouped by resource (books, summaries, articles, etc.)
- Pagination support for article feeds
- Error handling middleware with development/production modes

## Environment Configuration

### Backend (.env)
```bash
DATABASE_URL="file:./dev.db"
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

### Frontend
The frontend expects the API at `http://localhost:5000/api` (hardcoded in API calls).
To change this, update the axios base URL configuration.

## Database Management

### Running Migrations
```bash
cd backend
npx prisma migrate dev --name describe_your_migration
```

### Resetting Database
```bash
cd backend
npx prisma migrate reset  # Warning: This will delete all data
```

### Viewing Database
```bash
cd backend
npx prisma studio  # Opens browser-based database GUI
```

## Development Workflow

### Adding a New Feature
1. **Database Schema**: Update `backend/prisma/schema.prisma` if needed
2. **Run Migration**: `npx prisma migrate dev`
3. **Backend Route**: Create/update route in `backend/src/routes/`
4. **Frontend Component**: Add UI in `frontend/src/components/` or `frontend/src/pages/`
5. **API Integration**: Use axios to connect frontend to backend

### Code Style
- **TypeScript**: Strict mode enabled in both frontend and backend
- **Backend**: CommonJS modules, Express middleware pattern
- **Frontend**: ES modules, functional React components with hooks
- **Formatting**: No prettier config found - use default VS Code formatting

## Project Status & Roadmap

Current implementation includes:
- ✅ Personal Library with book tracking and summaries
- ✅ Discovery Engine with article feed and pagination
- ✅ Save/unsave articles functionality
- ✅ Category filtering

Planned features (per README):
- Google Drive integration for summary import
- Real AI API integration (currently user provides key)
- Advanced search and filtering

## Common Tasks

### Testing API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Get all books
curl http://localhost:5000/api/books

# Get articles with pagination
curl "http://localhost:5000/api/articles?page=1&limit=10"
```

### Troubleshooting

If the backend won't start:
- Ensure port 5000 is not in use
- Check database file exists: `backend/dev.db`
- Verify environment variables in `.env`

If the frontend won't connect:
- Verify backend is running on port 5000
- Check CORS configuration in `backend/src/server.ts`
- Ensure frontend is on port 5173

## Security Notes

- AI API keys are handled client-side and stored in UserSettings
- Google OAuth tokens are stored encrypted in the database
- No authentication system - designed for single-user local use
- CORS configured for localhost only