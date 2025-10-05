import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { trackActivity } from '../services/activityTracker';

const router = Router();

// Get all saved articles
router.get('/', async (req: Request, res: Response) => {
  try {
    const savedArticles = await prisma.savedArticle.findMany({
      include: {
        article: true,
      },
      orderBy: {
        savedAt: 'desc',
      },
    });
    
    res.json(savedArticles);
  } catch (error) {
    console.error('Error fetching saved articles:', error);
    res.status(500).json({ error: 'Failed to fetch saved articles' });
  }
});

// Save an article
router.post('/', async (req: Request, res: Response) => {
  try {
    const { articleId, notes, tags } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Check if already saved
    const existing = await prisma.savedArticle.findUnique({
      where: { articleId },
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Article already saved' });
    }
    
    const savedArticle = await prisma.savedArticle.create({
      data: {
        articleId,
        notes,
        tags,
      },
      include: {
        article: true,
      },
    });
    // Track save action
    await trackActivity({
      action: 'article_saved',
      targetType: 'article',
      targetId: articleId,
    });
    
    res.status(201).json(savedArticle);
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

// Update saved article notes/tags
router.put('/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const { notes, tags } = req.body;
    
    const savedArticle = await prisma.savedArticle.update({
      where: { articleId },
      data: {
        notes,
        tags,
      },
      include: {
        article: true,
      },
    });
    
    res.json(savedArticle);
  } catch (error) {
    console.error('Error updating saved article:', error);
    res.status(500).json({ error: 'Failed to update saved article' });
  }
});

// Remove saved article
router.delete('/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    
    await prisma.savedArticle.delete({
      where: { articleId },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error removing saved article:', error);
    res.status(500).json({ error: 'Failed to remove saved article' });
  }
});

// Get saved article by article ID
router.get('/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    
    const savedArticle = await prisma.savedArticle.findUnique({
      where: { articleId },
      include: {
        article: true,
      },
    });
    
    if (!savedArticle) {
      return res.status(404).json({ error: 'Saved article not found' });
    }
    
    res.json(savedArticle);
  } catch (error) {
    console.error('Error fetching saved article:', error);
    res.status(500).json({ error: 'Failed to fetch saved article' });
  }
});

export default router;