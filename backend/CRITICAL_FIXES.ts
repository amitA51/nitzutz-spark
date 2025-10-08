/**
 * 🔥 CRITICAL FIXES - IMPLEMENT IMMEDIATELY
 * These fixes address the most serious security and reliability issues
 */

// ============================================
// 1. SECURE ENVIRONMENT CONFIGURATION
// ============================================

// src/config/environment.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  SECRET_KEY: z.string().min(32, 'SECRET_KEY must be at least 32 characters'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
});

export type Environment = z.infer<typeof envSchema>;

export const validateEnvironment = (): Environment => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
};

// ============================================
// 2. INPUT VALIDATION MIDDLEWARE
// ============================================

// src/middleware/validation.ts
import { body, param, query, validationResult, ValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Custom sanitization functions
export const sanitizeString = (value: string): string => {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .slice(0, 10000); // Limit length
};

export const sanitizeId = (value: string): string => {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
};

// Validation chains
export const validateAIRequest = [
  body('articleId')
    .isString()
    .customSanitizer(sanitizeId)
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid article ID'),
  body('question')
    .isString()
    .customSanitizer(sanitizeString)
    .isLength({ min: 1, max: 2000 })
    .withMessage('Question must be between 1-2000 characters'),
  body('model')
    .optional()
    .isString()
    .customSanitizer(sanitizeString)
    .isLength({ max: 100 })
    .withMessage('Invalid model name'),
  body('mode')
    .optional()
    .isIn(['normal', 'devils-advocate'])
    .withMessage('Invalid mode'),
  handleValidationErrors
];

export const validateArticleId = [
  param('articleId')
    .isString()
    .customSanitizer(sanitizeId)
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid article ID'),
  handleValidationErrors
];

export const validateBookId = [
  param('bookId')
    .isString()
    .customSanitizer(sanitizeId)
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid book ID'),
  handleValidationErrors
];

// Error handler
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err: ValidationError) => ({
        field: 'param' in err ? err.param : err.type,
        message: err.msg
      }))
    });
  }
  next();
}

// ============================================
// 3. SECURE DATABASE CONNECTION
// ============================================

// src/db.ts - REPLACEMENT
import { PrismaClient } from '@prisma/client';

interface PrismaConfig {
  datasources: {
    db: {
      url: string;
    };
  };
  log: Array<'query' | 'error' | 'info' | 'warn'>;
}

const createPrismaClient = (): PrismaClient => {
  const config: PrismaConfig = {
    datasources: {
      db: {
        url: process.env.DATABASE_URL!,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  };

  const prisma = new PrismaClient(config);

  // Connection error handling
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected successfully');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    });

  return prisma;
};

export const prisma = createPrismaClient();

// Graceful shutdown handler
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected gracefully');
  } catch (error) {
    console.error('❌ Database disconnection error:', error);
  }
};

// ============================================
// 4. SECURE ERROR HANDLING SYSTEM
// ============================================

// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  details?: any;
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;
  
  constructor(message: string = 'Security violation detected') {
    super(message);
    this.name = 'SecurityError';
  }
}

export const globalErrorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log all errors
  console.error(`[${new Date().toISOString()}] ${error.name}: ${error.message}`, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.statusCode || 500).json({
    error: error.isOperational 
      ? error.message 
      : 'Internal server error',
    ...(isDevelopment && error.details && { details: error.details }),
    ...(isDevelopment && { stack: error.stack }),
  });
};

// Process-level error handlers
export const setupProcessErrorHandlers = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit immediately, give time for graceful shutdown
    setTimeout(() => {
      console.error('💥 Forcing shutdown due to unhandled rejection');
      process.exit(1);
    }, 1000);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('💥 Uncaught Exception:', error);
    // Perform cleanup and exit
    cleanup().finally(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown
  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
      console.log(`📤 Received ${signal}, shutting down gracefully...`);
      cleanup().finally(() => {
        process.exit(0);
      });
    });
  });
};

const cleanup = async (): Promise<void> => {
  try {
    // Cleanup database connections
    await prisma.$disconnect();
    
    // Close any other connections (Redis, queues, etc.)
    // Add your cleanup code here
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// ============================================
// 5. SECURITY MIDDLEWARE STACK
// ============================================

// src/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Rate limiting
export const createRateLimiters = () => {
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Store in memory for now, use Redis for production
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    }
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Stricter limit for AI endpoints
    message: {
      error: 'Too many AI requests, please try again later',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Very strict for auth endpoints
    message: {
      error: 'Too many authentication attempts',
      retryAfter: '15 minutes'
    },
  });

  return { generalLimiter, aiLimiter, authLimiter };
};

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
});

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Basic request sanitization
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
};

const sanitizeObject = (obj: any): void => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove null bytes and control characters
      obj[key] = obj[key].replace(/[\x00-\x1F\x7F]/g, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

// ============================================
// 6. IMPROVED CORS CONFIGURATION
// ============================================

// src/middleware/cors.ts
import cors from 'cors';

export const createCorsMiddleware = () => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://nitzutz-spark.netlify.app',
  ];

  // Parse additional origins from environment
  if (process.env.CORS_ALLOWED_ORIGINS) {
    const envOrigins = process.env.CORS_ALLOWED_ORIGINS
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
    allowedOrigins.push(...envOrigins);
  }

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, be more permissive but log warnings
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ CORS: Allowing unregistered origin in development: ${origin}`);
        return callback(null, true);
      }

      // Production: strict CORS
      console.error(`❌ CORS: Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
  });
};

// ============================================
// 7. PROMPT INJECTION PREVENTION
// ============================================

// src/utils/promptSecurity.ts
import { SecurityError } from '../middleware/errorHandler';

const DANGEROUS_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /forget\s+everything/i,
  /system:\s*you\s+are/i,
  /assistant:\s*i\s+am/i,
  /\[system\]/i,
  /\[\/system\]/i,
  /<system>/i,
  /<\/system>/i,
  /human:\s*ignore/i,
  /user:\s*ignore/i,
  /\]\s*ignore/i,
  /prompt\s*injection/i,
  /jailbreak/i,
  /roleplay\s+as/i,
  /pretend\s+to\s+be/i,
  /act\s+as\s+if/i,
];

const MAX_PROMPT_LENGTH = 5000;
const MAX_REPETITIVE_CHARS = 50;

export const validatePromptSecurity = (input: string): string => {
  if (!input || typeof input !== 'string') {
    throw new SecurityError('Invalid input type');
  }

  // Length check
  if (input.length > MAX_PROMPT_LENGTH) {
    throw new SecurityError('Input too long');
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      console.warn(`🚨 Potential prompt injection detected: ${pattern.toString()}`);
      throw new SecurityError('Potentially unsafe input detected');
    }
  }

  // Check for excessive repetition (could be attempt to break token limits)
  const charCounts = new Map<string, number>();
  for (const char of input) {
    charCounts.set(char, (charCounts.get(char) || 0) + 1);
    if (charCounts.get(char)! > MAX_REPETITIVE_CHARS) {
      throw new SecurityError('Excessive character repetition detected');
    }
  }

  // Basic cleanup
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
};

// Secure prompt builder
export const buildSecurePrompt = (
  systemMessage: string,
  userContent: string,
  articleTitle?: string,
  articleContent?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => {
  // Validate all inputs
  const safeSystemMessage = validatePromptSecurity(systemMessage);
  const safeUserContent = validatePromptSecurity(userContent);
  
  let safeArticleTitle = '';
  let safeArticleContent = '';
  
  if (articleTitle) {
    safeArticleTitle = validatePromptSecurity(articleTitle);
  }
  
  if (articleContent) {
    // Truncate article content to prevent token overflow
    safeArticleContent = validatePromptSecurity(
      articleContent.slice(0, 3000)
    );
  }

  const messages = [
    { role: 'system' as const, content: safeSystemMessage }
  ];

  if (safeArticleTitle || safeArticleContent) {
    const contextParts = [];
    if (safeArticleTitle) contextParts.push(`Title: ${safeArticleTitle}`);
    if (safeArticleContent) contextParts.push(`Content: ${safeArticleContent}`);
    
    messages.push({
      role: 'user' as const,
      content: `Context:\n${contextParts.join('\n\n')}\n\nUser Question: ${safeUserContent}`
    });
  } else {
    messages.push({
      role: 'user' as const,
      content: safeUserContent
    });
  }

  return messages;
};

// ============================================
// 8. UPDATED SERVER.TS EXAMPLE
// ============================================

/*
// src/server.ts - Key changes to implement

import { validateEnvironment } from './config/environment';
import { setupProcessErrorHandlers, globalErrorHandler } from './middleware/errorHandler';
import { createRateLimiters, securityHeaders, sanitizeRequest } from './middleware/security';
import { createCorsMiddleware } from './middleware/cors';
import { disconnectDatabase } from './db';

// Validate environment first
const env = validateEnvironment();

// Setup error handlers
setupProcessErrorHandlers();

const app: Express = express();

// Security middleware stack
app.use(securityHeaders);
app.use(createCorsMiddleware());
app.use(sanitizeRequest);

// Rate limiting
const { generalLimiter, aiLimiter, authLimiter } = createRateLimiters();
app.use('/api/', generalLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/auth', authLimiter);

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes with validation
app.use('/api/ai', validateAIRoutes, aiRouter);
app.use('/api/articles', validateArticleRoutes, articlesRouter);

// Global error handler (MUST be last)
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});
*/

export {
  validateEnvironment,
  ValidationError,
  SecurityError,
  validatePromptSecurity,
  buildSecurePrompt,
  sanitizeString,
  sanitizeId,
};