import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { trackActivity } from '../services/activityTracker';

const router = Router();

// Get all books
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const books = await prisma.book.findMany({
    include: {
      summaries: {
        select: {
          id: true,
          chapterTitle: true,
          chapterNumber: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  res.json(books);
}));

// Create new book
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { bookTitle, currentPage, totalPages, author, isbn } = req.body;
  
  if (!bookTitle) {
    return res.status(400).json({ error: 'Book title is required' });
  }
  
  const book = await prisma.book.create({
    data: {
      bookTitle,
      currentPage: currentPage || 0,
      totalPages,
      author,
      isbn,
    },
  });
  
  // Track book started
  await trackActivity({
    action: 'book_started',
    targetType: 'book',
    targetId: book.id,
  });
  
  res.status(201).json(book);
}));

// Get single book
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      summaries: true,
    },
  });
  
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  res.json(book);
}));

// Update book
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { bookTitle, currentPage, totalPages, author, isbn } = req.body;
  
  const book = await prisma.book.update({
    where: { id },
    data: {
      bookTitle,
      currentPage,
      totalPages,
      author,
      isbn,
    },
  });
  
  res.json(book);
}));

// Delete book
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await prisma.book.delete({
    where: { id },
  });
  
  res.status(204).send();
}));

export default router;