import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Schedule spaced repetitions for a saved article
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { articleId, intervals } = req.body;
    
    if (!articleId || !Array.isArray(intervals)) {
      return res.status(400).json({ error: 'Article ID and intervals array are required' });
    }
    
    // Find the saved article
    const savedArticle = await prisma.savedArticle.findUnique({
      where: { articleId },
      include: { article: true },
    });
    
    if (!savedArticle) {
      return res.status(404).json({ error: 'Saved article not found' });
    }

    // Get key points from the article (we'll use AI to extract them if not cached)
    // For now, use a simplified approach
    const keyPoints = JSON.stringify([
      `Remember to review: ${savedArticle.article.title}`,
      'Key concepts from this article',
    ]);

    // Create repetition schedules
    const repetitions = [];
    for (const interval of intervals) {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + interval);
      
      const repetition = await prisma.spacedRepetition.create({
        data: {
          savedArticleId: savedArticle.id,
          scheduledFor,
          interval,
          keyPoints,
        },
      });
      
      repetitions.push(repetition);
    }
    
    res.json({ success: true, repetitions });
  } catch (error) {
    console.error('Error scheduling repetitions:', error);
    res.status(500).json({ error: 'Failed to schedule repetitions' });
  }
});

// Get pending repetitions (due today or overdue)
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const pending = await prisma.spacedRepetition.findMany({
      where: {
        completed: false,
        scheduledFor: {
          lte: today,
        },
      },
      include: {
        savedArticle: {
          include: {
            article: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });
    
    res.json(pending);
  } catch (error) {
    console.error('Error fetching pending repetitions:', error);
    res.status(500).json({ error: 'Failed to fetch pending repetitions' });
  }
});

// Mark a repetition as completed
router.put('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const repetition = await prisma.spacedRepetition.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });
    
    res.json(repetition);
  } catch (error) {
    console.error('Error completing repetition:', error);
    res.status(500).json({ error: 'Failed to complete repetition' });
  }
});

export default router;
