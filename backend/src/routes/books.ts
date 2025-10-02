import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all books
router.get('/', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get single book
router.get('/:id', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Create new book
router.post('/', async (req: Request, res: Response) => {
  try {
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
    
    res.status(201).json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// Update book
router.put('/:id', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Delete book
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.book.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;