# ניצוץ (Spark) - Personal Knowledge and Discovery App

A full-stack personal knowledge management and discovery application for a single user, featuring a personal library for book tracking and summaries, and a discovery engine for learning from articles with an AI assistant.

## Features

### 📚 Personal Library (/library)
- **Book Tracking**: Add, edit, and track your reading progress
- **Summary Management**: Rich text editor for creating and organizing book summaries
- **Chapter Organization**: Organize summaries by chapters with page ranges
- **Progress Tracking**: Visual progress bars for book completion
- **Google Drive Integration** (Stage 3): Import summaries from Google Drive

### 🔍 Discovery Engine (/)
- **Article Feed**: Browse articles one at a time with smooth navigation
- **Category Filtering**: Filter articles by categories
- **Save Functionality**: Save interesting articles to your personal collection
- **AI Assistant**: Ask questions about articles and get contextual answers
- **Pagination**: Navigate through articles with Previous/Next buttons

## Tech Stack

### Backend
- **Node.js** with Express and TypeScript
- **Prisma ORM** with **PostgreSQL** database
- **RESTful API** architecture
- Environment-based configuration

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom gradient accents
- **Framer Motion** for smooth animations
- **React Router** for navigation
- **Inter** (UI) + **IBM Plex Serif** (content) typography
- **Axios** for API calls

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- PostgreSQL (local via Docker or hosted via Railway)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nitzutz-spark
```

2. Backend setup:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and other settings
```

3. Database migration:
```bash
npx prisma migrate dev
```

4. (Optional) Seed dummy articles:
```bash
# Start the backend server first, then:
curl -X POST http://localhost:5000/api/articles/seed \
  -H "x-seed-token: your-seed-token"  # Only required in production
```

5. Frontend setup:
```bash
cd ../frontend
npm install
cp .env.example .env
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:5000

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:5173

3. Open your browser at http://localhost:5173

## Environment Variables

### Backend (.env)
```env
# Core
DATABASE_URL="postgresql://user:password@localhost:5432/nitzutz_spark"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,.netlify.app,.railway.app

# AI Configuration
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://router.huggingface.co/v1
AI_MODEL=deepseek-ai/DeepSeek-V3.2-Exp:novita

# AI Rate Limiting (optional)
AI_RATE_WINDOW_MS=60000
AI_RATE_MAX=30

# Google Drive OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Seed protection (production)
SEED_TOKEN=your_seed_token

# Encryption (optional, for Google Drive tokens)
SECRET_KEY=change-me # 32-byte hex or any string (hashed to 256-bit)
```

### Frontend (.env)
```env
# Local development
VITE_API_URL=http://localhost:5000/api

# Or point to production backend
# VITE_API_URL=https://your-backend.railway.app/api
```

## Project Structure

```
nitzutz-spark/
├── backend/
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   └── server.ts       # Express server setup
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app component with routing
│   └── package.json
└── README.md
```

## API Endpoints

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Summaries
- `GET /api/summaries/book/:bookId` - Get summaries for a book
- `POST /api/summaries` - Create new summary
- `PUT /api/summaries/:id` - Update summary
- `DELETE /api/summaries/:id` - Delete summary

### Articles
- `GET /api/articles` - Get articles with pagination (supports includeContent=0/1)
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Create new article
- `GET /api/articles/categories/list` - Get all categories
- `POST /api/articles/seed` - Seed dummy articles (protected in production)

### Saved Articles
- `GET /api/saved-articles` - Get all saved articles
- `POST /api/saved-articles` - Save an article
- `PUT /api/saved-articles/:articleId` - Update saved article
- `DELETE /api/saved-articles/:articleId` - Remove saved article

### AI Assistant
- `POST /api/ai/ask` - Ask a question about an article
- `GET /api/ai/questions/:articleId` - Get all questions for an article
- `POST /api/ai/test-connection` - Test AI API connectivity

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `DELETE /api/settings/ai-key` - Clear AI API key

## Deployment

### Current Setup
- **Backend**: Railway (https://railway.app)
- **Frontend**: Netlify (https://netlify.com)

### Seed Articles
After deployment, seed initial articles:
```bash
curl -X POST https://your-backend-url.railway.app/api/articles/seed \
  -H "x-seed-token: your-seed-token"
```

## Contributing

This is a personal project, but suggestions and improvements are welcome. Please open an issue to discuss proposed changes.

## License

This project is for personal use. Please contact the author for any other use cases.

## Support

For questions or issues, please open an issue in the repository.
