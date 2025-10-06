import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { trackActivity } from '../services/activityTracker';

const router = Router();

// Get all summaries for a book
router.get('/book/:bookId', asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const summaries = await prisma.summary.findMany({
    where: { bookId },
    orderBy: {
      chapterNumber: 'asc',
    },
  });
  res.json(summaries);
}));

// Get single summary
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const summary = await prisma.summary.findUnique({
    where: { id },
    include: {
      book: true,
    },
  });

  if (!summary) {
    return res.status(404).json({ error: 'Summary not found' });
  }

  res.json(summary);
}));

// Create new summary
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { bookId, content, chapterNumber, chapterTitle, pageRange } = req.body;

  if (!bookId || !content) {
    return res.status(400).json({ error: 'Book ID and content are required' });
  }

  const summary = await prisma.summary.create({
    data: {
      bookId,
      content,
      chapterNumber,
      chapterTitle,
      pageRange,
    },
  });
  // Track summary creation
  await trackActivity({
    action: 'summary_created',
    targetType: 'summary',
    targetId: summary.id,
    metadata: { bookId },
  });

  res.status(201).json(summary);
}));

// Update summary
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, chapterNumber, chapterTitle, pageRange } = req.body;

  const summary = await prisma.summary.update({
    where: { id },
    data: {
      content,
      chapterNumber,
      chapterTitle,
      pageRange,
    },
  });

  res.json(summary);
}));

// Delete summary
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.summary.delete({
    where: { id },
  });

  res.status(204).send();
}));

// Import from Google Drive (placeholder)
router.post('/import-google-drive', asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Google Drive import not yet implemented',
    message: 'This feature will be available in Stage 3'
  });
}));

export default router;