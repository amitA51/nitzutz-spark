import { PrismaClient } from '@prisma/client';

export class ArticleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get articles with pagination, filtering, and saved status
   */
  async getArticles(
    page: number = 1,
    limit: number = 10,
    category?: string,
    includeContent: boolean = false,
  ) {
    const skip = (page - 1) * limit;
    const where = category ? { category } : {};

    const select: any = {
      id: true,
      title: true,
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
    };
    if (includeContent) {
      select.content = true;
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select,
      }),
      this.prisma.article.count({ where }),
    ]);

    // Map to clean DTOs with isSaved flag
    const articlesWithStatus = articles.map((article: any) => ({
      ...article,
      isSaved: article._count.savedArticles > 0,
      _count: undefined, // Remove _count from response
    }));

    return {
      articles: articlesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single article by ID with full details
   */
  async getArticleById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
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
        savedArticles: {
          select: {
            id: true,
            notes: true,
            tags: true,
            savedAt: true,
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
      return null;
    }

    // Return clean DTO
    return {
      ...article,
      isSaved: article.savedArticles.length > 0,
      savedInfo: article.savedArticles[0] || null,
      savedArticles: undefined, // Remove from response
    };
  }

  /**
   * Create a new article
   */
  async createArticle(data: {
    title: string;
    content: string;
    category: string;
    author?: string;
    sourceUrl?: string;
    publishedAt?: Date;
    imageUrl?: string;
    excerpt?: string;
    readTime?: number;
  }) {
    const computedReadTime =
      typeof data.readTime === 'number'
        ? data.readTime
        : Math.max(1, Math.round((data.content?.split(/\s+/).filter(Boolean).length || 0) / 200)); // ~200 wpm

    return await this.prisma.article.create({
      data: {
        ...data,
        readTime: computedReadTime,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      },
    });
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    const categories = await this.prisma.article.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories.map(c => c.category);
  }

  /**
   * Seed dummy articles for demo purposes
   */
  async seedDummyArticles() {
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

    const created = await this.prisma.article.createMany({
      data: dummyArticles,
    });

    return { count: created.count };
  }

  /**
   * Seed a large number of longer articles for demos/tests
   */
  async seedArticles(count: number = 300) {
    const categories = ['Technology', 'Science', 'Philosophy', 'Environment', 'Mathematics', 'History', 'Psychology', 'Business', 'Education'];
    const authors = ['A. Cohen', 'D. Levi', 'S. Johnson', 'M. Chen', 'E. Williams', 'R. Green', 'L. Anderson', 'T. Nguyen'];

    const longParagraph =
      'זהו טקסט ארוך לדוגמה הממחיש מאמר מעמיק עם רעיונות מרכזיים, דוגמאות והקשרים פרקטיים. ' +
      'הטקסט בנוי מפסקאות ברורות וקריאות, ומלווה בהסברים המרחיבים על המושגים החשובים. ' +
      'המטרה היא להעניק לקורא הבנה רחבה ומעשית שתסייע לו ליישם את הידע בחיי היום-יום. ';

    const makeContent = (i: number) => {
      const paragraphs = Array.from({ length: 12 }, (_, p) => `${longParagraph} פסקה ${p + 1} במאמר מספר ${i + 1}.`).join('\n\n');
      return paragraphs + '\n\nסיכום: נקודות יישומיות, טעויות נפוצות, וטיפים להעמקה נוספת.';
    };

    const items = Array.from({ length: count }, (_, i) => ({
      title: `מאמר מעמיק ${i + 1}`,
      content: makeContent(i),
      author: authors[i % authors.length],
      category: categories[i % categories.length],
      excerpt: 'תקציר קצר של המאמר המדגיש את הרעיונות המרכזיים והתרומה המעשית לקורא.',
      readTime: 8 + (i % 12),
      publishedAt: new Date(),
    }));

    // Batch insert to avoid parameter limits
    const chunkSize = 100;
    let total = 0;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const created = await this.prisma.article.createMany({ data: chunk });
      total += created.count;
    }
    return { count: total };
  }
}
