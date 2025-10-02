# ניצוץ (Spark) - Personal Knowledge and Discovery App

A full-stack personal knowledge management and discovery application for a single user, featuring a personal library for book tracking and summaries, and a discovery engine for learning from articles with an AI assistant.

## Features

### 📚 Personal Library (/library)
- **Book Tracking**: Add, edit, and track your reading progress
- **Summary Management**: Rich text editor for creating and organizing book summaries
- **Chapter Organization**: Organize summaries by chapters with page ranges
- **Progress Tracking**: Visual progress bars for book completion
- **Google Drive Integration** (Coming in Stage 3): Import summaries from Google Drive

### 🔍 Discovery Engine (/)
- **Article Feed**: Browse articles one at a time with smooth navigation
- **Category Filtering**: Filter articles by categories
- **Save Functionality**: Save interesting articles to your personal collection
- **AI Assistant**: Ask questions about articles and get contextual answers
- **Pagination**: Navigate through articles with Previous/Next buttons

## Tech Stack

### Backend
- **Node.js** with Express and TypeScript
- **Prisma ORM** with SQLite database
- **RESTful API** architecture
- Environment-based configuration

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling (Dark mode only)
- **React Router** for navigation
- **Google Sans** font for typography
- **Axios** for API calls

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nitzutz-spark
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Seed dummy articles (optional):
```bash
# Start the backend server first, then make a POST request to:
# http://localhost:5000/api/articles/seed
```

5. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:5000

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:5173

3. Open your browser and navigate to http://localhost:5173

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
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
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component with routing
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
- `GET /api/articles` - Get articles with pagination
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Create new article
- `GET /api/articles/categories/list` - Get all categories
- `POST /api/articles/seed` - Seed dummy articles

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

## Development Roadmap

### Stage 1 (MVP) ✅
- Full Personal Library (without Google Drive import)
- Discovery Engine layout with dummy articles
- Functional routing between sections

### Stage 2 (In Progress)
- Dynamic article feed with pagination
- Save functionality for articles
- Category filtering

### Stage 3 (Planned)
- Google Drive integration for summary import
- Contextual AI Assistant with real API integration
- Advanced search and filtering options

## Design Principles

- **Dark Mode Only**: Pure black background (#000000) with white text (#FFFFFF)
- **Professional Blue Accent**: #3B82F6 for interactive elements
- **Google Sans Typography**: Clean, modern font throughout
- **Minimalist Design**: Clean, professional interface without emojis
- **Single User Focus**: Designed for personal use without multi-user complexity

## Contributing

This is a personal project, but suggestions and improvements are welcome. Please open an issue to discuss proposed changes.

## License

This project is for personal use. Please contact the author for any other use cases.

## Support

For questions or issues, please open an issue in the repository.