// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
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
import healthRouter from './routes/health';
import exportRouter from './routes/export';
import { startMentorCron } from './jobs/mentorJob';
import { smartScheduler } from './jobs/smartScheduler';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Basic security headers
app.use(helmet());

// Logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS configuration
const parseList = (val?: string) =>
  (val || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const baseAllowedOrigins = [
  'http://localhost:5173', // Local development
  'https://nitzutz-spark.netlify.app', // Production frontend (Netlify)
];

const envAllowed = parseList(process.env.CORS_ALLOWED_ORIGINS);
const allowedOrigins = [
  ...baseAllowedOrigins,
  process.env.FRONTEND_URL || '',
  ...envAllowed,
].filter(Boolean) as string[];

// Allow suffix-based matching (e.g. ".netlify.app", ".railway.app")
const isOriginAllowed = (origin?: string | null) => {
  // In development mode, allow all origins
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  if (!origin) return true; // Postman / same-origin
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    // Any entry starting with "." is treated as a suffix match
    for (const entry of allowedOrigins) {
      if (entry.startsWith('.')) {
        if (hostname.endsWith(entry)) return true;
      }
    }
  } catch {
    // If origin is not a valid URL, deny
    return false;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_WINDOW_MS || '60000', 10), // 1 minute
  max: parseInt(process.env.AI_RATE_MAX || '30', 10), // 30 req/min
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/ai', aiLimiter);

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
app.use('/api/health', healthRouter);
app.use('/api/export', exportRouter);

// Serve static test page (dev only unless explicitly allowed)
if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_ROUTES === 'true') {
  app.get('/test-google-auth', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../test-google-auth.html'));
  });
}

// Legacy health check endpoint (redirect to new)
app.get('/health', (req: Request, res: Response) => {
  res.redirect('/api/health');
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Check AI configuration
  if (process.env.AI_API_KEY || process.env.HF_TOKEN) {
    console.log(`✅ [AI] Configured with ${process.env.AI_BASE_URL || 'Hugging Face Router'}`);
    console.log(`✅ [AI] Model: ${process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3.2-Exp:novita'}`);
  } else {
    console.warn('⚠️  [AI] No API key found. AI features will be disabled.');
  }
  
  // Ensure default user settings record exists
  try {
    await prisma.userSettings.upsert({
      where: { id: 'default-user' },
      create: { id: 'default-user' },
      update: {},
    });
  } catch (e) {
    console.warn('Failed to ensure default user settings:', e);
  }
  // Start background cron and smart scheduler after server is up
  try {
    startMentorCron();
    console.log('🚀 [Smart Scheduler] Smart scheduler initialized');
    
    // In development, you can manually start the scheduler
    if (process.env.NODE_ENV === 'development' && process.env.AUTO_START_SCHEDULER === 'true') {
      smartScheduler.start();
      console.log('🔧 [Smart Scheduler] Auto-started for development');
    }
  } catch (e) {
    console.error('Failed to start background services:', e);
  }
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
