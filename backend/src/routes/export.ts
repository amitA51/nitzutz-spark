import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Export all data as JSON (personal backup)
router.get('/all', asyncHandler(async (_req: Request, res: Response) => {
  const [books, summaries, articles, savedArticles, insights, userSettings] = await Promise.all([
    prisma.book.findMany(),
    prisma.summary.findMany(),
    prisma.article.findMany(),
    prisma.savedArticle.findMany(),
    prisma.insight.findMany(),
    prisma.userSettings.findMany(),
  ]);

  res.json({
    exportedAt: new Date().toISOString(),
    books,
    summaries,
    articles,
    savedArticles,
    insights,
    userSettings,
  });
}));

export default router;