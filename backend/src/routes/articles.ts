import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get articles with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', category } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const where = category ? { category: category as string } : {};
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          savedArticles: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);
    
    const articlesWithSavedStatus = articles.map(article => ({
      ...article,
      isSaved: article.savedArticles.length > 0,
      savedArticles: undefined, // Remove from response
    }));
    
    res.json({
      articles: articlesWithSavedStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get single article
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        savedArticles: {
          select: {
            id: true,
            notes: true,
            tags: true,
          },
        },
        aiQuestions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const response = {
      ...article,
      isSaved: article.savedArticles.length > 0,
      savedInfo: article.savedArticles[0] || null,
      savedArticles: undefined, // Remove from response
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Create new article (for demo/testing)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      content, 
      author, 
      sourceUrl, 
      category, 
      publishedAt, 
      imageUrl, 
      excerpt,
      readTime 
    } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }
    
    const article = await prisma.article.create({
      data: {
        title,
        content,
        author,
        sourceUrl,
        category,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        imageUrl,
        excerpt,
        readTime,
      },
    });
    
    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Get article categories
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.article.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });
    
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Seed dummy articles for demo
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const dummyArticles = [
      {
        title: 'The Future of Artificial Intelligence',
        content: 'Artificial intelligence continues to evolve at a rapid pace...',
        author: 'Dr. Sarah Johnson',
        category: 'Technology',
        excerpt: 'Exploring the latest developments in AI and their implications.',
        readTime: 8,
      },
      {
        title: 'Understanding Quantum Computing',
        content: 'Quantum computing represents a fundamental shift in how we process information...',
        author: 'Prof. Michael Chen',
        category: 'Science',
        excerpt: 'A beginner-friendly introduction to quantum computing concepts.',
        readTime: 12,
      },
      {
        title: 'The Philosophy of Consciousness',
        content: 'What is consciousness and how does it emerge from physical processes?...',
        author: 'Dr. Emma Williams',
        category: 'Philosophy',
        excerpt: 'Examining different theories about the nature of consciousness.',
        readTime: 15,
      },
      {
        title: 'Climate Change: Latest Research',
        content: 'Recent studies reveal new insights into climate patterns...',
        author: 'Dr. Robert Green',
        category: 'Environment',
        excerpt: 'Summary of the latest climate science research findings.',
        readTime: 10,
      },
      {
        title: 'The History of Mathematics',
        content: 'From ancient civilizations to modern breakthroughs...',
        author: 'Prof. Lisa Anderson',
        category: 'Mathematics',
        excerpt: 'A journey through the evolution of mathematical thinking.',
        readTime: 20,
      },
    ];
    
    const created = await prisma.article.createMany({
      data: dummyArticles,
    });
    
    res.json({ message: 'Dummy articles created', count: created.count });
  } catch (error) {
    console.error('Error seeding articles:', error);
    res.status(500).json({ error: 'Failed to seed articles' });
  }
});

export default router;