import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { prisma } from './db';

// Import routes
import booksRouter from './routes/books';
import summariesRouter from './routes/summaries';
import articlesRouter from './routes/articles';
import savedArticlesRouter from './routes/savedArticles';
import aiRouter from './routes/ai';
import settingsRouter from './routes/settings';
import spacedRepetitionRouter from './routes/spacedRepetition';
import googleDriveRouter from './routes/googleDrive';
import aiContentGeneratorRouter from './routes/aiContentGenerator';
import insightsRouter from './routes/insights';
import { startMentorCron } from './jobs/mentorJob';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'https://nitzutz-spark.netlify.app', // Production frontend (Netlify)
  process.env.FRONTEND_URL, // Optional custom URL from Railway
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman or same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/books', booksRouter);
app.use('/api/summaries', summariesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/saved-articles', savedArticlesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/spaced-repetition', spacedRepetitionRouter);
app.use('/api/google-drive', googleDriveRouter);
app.use('/api/ai-content', aiContentGeneratorRouter);
app.use('/api/insights', insightsRouter);

// Serve static test page
app.get('/test-google-auth', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../test-google-auth.html'));
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Nitzutz Spark Backend is running' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  // Start background cron after server is up
  try {
    startMentorCron();
  } catch (e) {
    console.error('Failed to start mentor cron:', e);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
