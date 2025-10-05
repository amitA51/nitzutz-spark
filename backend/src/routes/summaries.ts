import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { trackActivity } from '../services/activityTracker';

const router = Router();

// Get all summaries for a book
router.get('/book/:bookId', async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const summaries = await prisma.summary.findMany({
      where: { bookId },
      orderBy: {
        chapterNumber: 'asc',
      },
    });
    res.json(summaries);
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

// Get single summary
router.get('/:id', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Create new summary
router.post('/', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error creating summary:', error);
    res.status(500).json({ error: 'Failed to create summary' });
  }
});

// Update summary
router.put('/:id', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error updating summary:', error);
    res.status(500).json({ error: 'Failed to update summary' });
  }
});

// Delete summary
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.summary.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting summary:', error);
    res.status(500).json({ error: 'Failed to delete summary' });
  }
});

// Import from Google Drive (placeholder)
router.post('/import-google-drive', async (req: Request, res: Response) => {
  // TODO: Implement Google Drive import functionality
  res.status(501).json({ 
    error: 'Google Drive import not yet implemented',
    message: 'This feature will be available in Stage 3' 
  });
});

export default router;