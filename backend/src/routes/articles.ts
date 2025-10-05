import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { ArticleService } from '../services/articleService';
import { trackActivity } from '../services/activityTracker';

const router = Router();
const articleService = new ArticleService(prisma);

// Search articles
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchTerm = q.trim();
  
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { title: { contains: searchTerm } },
        { content: { contains: searchTerm } },
        { excerpt: { contains: searchTerm } },
        { author: { contains: searchTerm } },
      ],
    },
    select: {
      id: true,
      title: true,
      content: true,
      author: true,
      sourceUrl: true,
      category: true,
      publishedAt: true,
      imageUrl: true,
      excerpt: true,
      readTime: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          savedArticles: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  const articlesWithSavedStatus = articles.map(article => ({
    ...article,
    isSaved: article._count.savedArticles > 0,
    _count: undefined,
  }));
  
  res.json({
    articles: articlesWithSavedStatus,
    count: articlesWithSavedStatus.length,
    query: searchTerm,
  });
}));

// Get articles with pagination and filtering
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', category } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  
  const result = await articleService.getArticles(
    pageNum,
    limitNum,
    category as string | undefined
  );
  
  res.json(result);
}));

// Get single article
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const article = await articleService.getArticleById(id);
  
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  // Track that the user read/viewed this article
  await trackActivity({
    action: 'article_read',
    targetType: 'article',
    targetId: id,
  });

  res.json(article);
}));

// Create new article (for demo/testing)
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { title, content, category, author, sourceUrl, publishedAt, imageUrl, excerpt, readTime } = req.body;
  
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required' });
  }
  
  const article = await articleService.createArticle({
    title,
    content,
    category,
    author,
    sourceUrl,
    publishedAt,
    imageUrl,
    excerpt,
    readTime,
  });
  
  res.status(201).json(article);
}));

// Get article categories
router.get('/categories/list', asyncHandler(async (req: Request, res: Response) => {
  const categories = await articleService.getCategories();
  res.json(categories);
}));

// Seed dummy articles for demo
router.post('/seed', asyncHandler(async (req: Request, res: Response) => {
  const result = await articleService.seedDummyArticles();
  res.json({ message: 'Dummy articles created', count: result.count });
}));

// Seed many long articles (configurable)
router.post('/seed/bulk', asyncHandler(async (req: Request, res: Response) => {
  const count = Math.max(1, parseInt((req.query.count as string) || '300'));
  const result = await articleService.seedArticles(count);
  res.json({ message: 'Bulk articles created', count: result.count });
}));

export default router;
