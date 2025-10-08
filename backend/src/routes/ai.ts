import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { chatCompletion, createAIClientFromAny, isAIEnabledAsync, getDefaultModel } from '../services/aiClient';

const router = Router();

// Middleware to check if AI is enabled
async function requireAI(req: Request, res: Response, next: any) {
  const enabled = await isAIEnabledAsync();
  if (!enabled) {
    return res.status(503).json({ 
      error: 'AI features are not available', 
      message: 'AI_API_KEY is not configured. Please contact administrator.' 
    });
  }
  next();
}

// Ask a question about an article
router.post('/ask', requireAI, async (req: Request, res: Response) => {
  try {
    const { articleId, question, model, mode, categoryHint } = req.body;
    
    if (!articleId || !question) {
      return res.status(400).json({ error: 'Article ID and question are required' });
    }
    
    // Get article content for context
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const selectedModel = model || getDefaultModel();

    // Adjust system message based on mode
    let systemMessage = 'You are an expert polymath assistant. Your goal is to provide insightful, clear, and well-structured answers based *only* on the provided article text. Use Markdown for formatting (e.g., **bold**, *italics*, bullet points). Be concise yet comprehensive. If the question is in Hebrew, answer in Hebrew.';
    if (categoryHint) {
      systemMessage += ` Focus your reasoning on the domain/category: ${categoryHint}. Prefer domain-specific terminology and context.`;
    }
    if (mode === 'devils-advocate') {
      systemMessage = 'You are a brilliant and sharp critical thinking assistant. Your role is to rigorously challenge arguments, present sophisticated counter-arguments, identify logical fallacies, and highlight alternative perspectives. Be constructive but unflinching in your analysis. Use Markdown for structure.';
    }

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Article title: ${article.title}\n\nContent:\n${article.content}\n\nQuestion: ${question}` },
    ] as const;

    const ai = await createAIClientFromAny();
    const completion = await chatCompletion(ai, selectedModel, messages as any);
    const answer = completion.choices?.[0]?.message?.content || '';
    
    // Save the Q&A to database
    const aiQuestion = await prisma.aiQuestion.create({
      data: {
        articleId,
        question,
        answer,
        context: article.excerpt || article.content.substring(0, 500),
      },
    });
    
    res.json(aiQuestion);
  } catch (error: any) {
    console.error('Error processing AI question:', error);
    res.status(500).json({ error: 'Failed to process question', details: error.message });
  }
});

// Get all questions for an article
router.get('/questions/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    
    const questions = await prisma.aiQuestion.findMany({
      where: { articleId },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Delete a question
router.delete('/questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.aiQuestion.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Extract key takeaways from an article
router.post('/extract-key-points', requireAI, async (req: Request, res: Response) => {
  try {
    const { articleId } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    // Get article content
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const selectedModel = getDefaultModel();

    const messages = [
      { 
        role: 'system', 
        content: 'You are a professional summarizer. Your task is to extract the 3-5 most critical key takeaways from the provided text. Return ONLY a valid JSON array of strings: ["Point 1", "Point 2", ...]. The points should be concise, insightful, and capture the essence of the article. Respond in Hebrew.' 
      },
      { 
        role: 'user', 
        content: `חלץ את הנקודות המרכזיות מהמאמר הזה:\n\nכותרת: ${article.title}\n\nתוכן:\n${article.content}\n\nהחזר JSON array של 3-5 נקודות מפתח בעברית.` 
      },
    ] as const;

    const ai = await createAIClientFromAny();
    const completion = await chatCompletion(ai, selectedModel, messages as any);
    const responseText = completion.choices?.[0]?.message?.content || '[]';
    
    // Try to parse the JSON response
    let keyPoints: string[] = [];
    try {
      keyPoints = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, try to extract bullet points manually
      const lines = responseText.split('\n').filter(line => line.trim().length > 0);
      keyPoints = lines.slice(0, 5);
    }
    
    res.json({ keyPoints, articleId });
  } catch (error: any) {
    console.error('Error extracting key points:', error);
    res.status(500).json({ error: 'Failed to extract key points', details: error.message });
  }
});

// Find connections between current article and user's knowledge base
router.post('/find-connections', requireAI, async (req: Request, res: Response) => {
  try {
    const { articleId } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    // Get current article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Get user's books and saved articles to find connections
    const books = await prisma.book.findMany({
      include: { summaries: true },
    });
    
    const savedArticles = await prisma.savedArticle.findMany({
      include: { article: true },
    });

    // Build context for AI
    const booksContext = books.map(b => `Book: "${b.bookTitle}" by ${b.author || 'Unknown'}`).join('\n');
    const articlesContext = savedArticles.map(sa => `Saved Article: "${sa.article.title}" (Category: ${sa.article.category})`).join('\n');

    const selectedModel = getDefaultModel();

    const messages = [
      { 
        role: 'system', 
        content: 'You are a brilliant research assistant, skilled at synthesizing information and finding non-obvious connections. Analyze the current article and find meaningful connections (conceptual links, shared themes, contradictions, or influences) to the user\'s existing knowledge base (books and saved articles). Return a JSON array of up to 5 connections with the format: [{"type": "book" | "article" | "contradiction", "title": "...", "relation": "A short, insightful description of the connection", "id": "item_id"}]. Focus on depth and quality over quantity.' 
      },
      { 
        role: 'user', 
        content: `Current Article:\nTitle: ${article.title}\nCategory: ${article.category}\nContent: ${article.content.substring(0, 1000)}\n\nUser\'s Library:\n${booksContext}\n\nUser\'s Saved Articles:\n${articlesContext}\n\nFind meaningful connections.` 
      },
    ] as const;

    const ai = await createAIClientFromAny();
    const completion = await chatCompletion(ai, selectedModel, messages as any);
    const responseText = completion.choices?.[0]?.message?.content || '[]';
    
    let connections = [];
    try {
      connections = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, return empty array
      connections = [];
    }
    
    res.json({ connections, articleId });
  } catch (error: any) {
    console.error('Error finding connections:', error);
    res.status(500).json({ error: 'Failed to find connections', details: error.message });
  }
});

// Get concept cloud - AI-powered concept extraction
router.get('/concept-cloud', async (_req: Request, res: Response) => {
  try {
    // Try to get from database first (if conceptMention table exists)
    try {
      const concepts = await prisma.conceptMention.groupBy({
        by: ['concept'],
        _count: {
          concept: true,
        },
        orderBy: {
          _count: {
            concept: 'desc',
          },
        },
        take: 20,
      });

      const formattedConcepts = concepts.map(c => ({
        concept: c.concept,
        count: c._count.concept,
      }));

      if (formattedConcepts.length > 0) {
        return res.json({ concepts: formattedConcepts });
      }
    } catch (dbError) {
      console.log('ConceptMention table not found, using AI extraction');
    }

    // Fallback: Use AI to extract concepts from saved articles and books
    const savedArticles = await prisma.savedArticle.findMany({
      include: { article: true },
      take: 50,
    });

    const books = await prisma.book.findMany({
      include: { summaries: true },
      take: 20,
    });

    if (savedArticles.length === 0 && books.length === 0) {
      return res.json({ concepts: [] });
    }

    // Build combined text for AI analysis
    const articlesText = savedArticles
      .map(sa => `${sa.article.title}: ${sa.article.content.substring(0, 300)}`)
      .join('\n');
    
    const booksText = books
      .map(b => {
        const summariesText = b.summaries.map(s => s.content.substring(0, 200)).join(' ');
        return `${b.bookTitle}: ${summariesText}`;
      })
      .join('\n');

    const combinedText = `${articlesText}\n\n${booksText}`.substring(0, 3000);

    // Use AI to extract key concepts
    const aiEnabled = await isAIEnabledAsync();
    if (aiEnabled) {
      const ai = await createAIClientFromAny();
      const model = getDefaultModel();
      
      const messages = [
        {
          role: 'system',
          content: 'You are a data scientist specializing in NLP and knowledge management. Extract the 15-20 most significant and recurring concepts from the provided texts. Group related concepts. Return ONLY a valid JSON array of objects with the format: [{"concept": "Concept Name", "count": estimated_frequency, "category": "tech/philosophy/science/security/other", "relatedTo": ["Related Concept 1", ...]}]. Use both English and Hebrew. Prioritize technical terms, theories, and key ideas.'
        },
        {
          role: 'user',
          content: `Analyze these texts and extract key recurring concepts:\n\n${combinedText}`
        }
      ] as const;

      try {
        const completion = await chatCompletion(ai, model, messages as any);
        const responseText = completion.choices?.[0]?.message?.content || '[]';
        
        // Try to parse JSON
        let concepts = JSON.parse(responseText.replace(/```json|```/g, '').trim());
        
        return res.json({ concepts });
      } catch (aiError) {
        console.error('AI concept extraction failed:', aiError);
      }
    }

    // Final fallback: Extract simple keywords
    const simpleKeywords = extractSimpleKeywords(combinedText);
    res.json({ concepts: simpleKeywords });

  } catch (error: any) {
    console.error('Error fetching concept cloud:', error);
    res.status(500).json({ error: 'Failed to fetch concept cloud', details: error.message });
  }
});

// Helper function to extract simple keywords
function extractSimpleKeywords(text: string): Array<{concept: string, count: number, category: string}> {
  const keywords = [
    { pattern: /\b(AI|בינה מלאכותית|machine learning|deep learning)/gi, category: 'tech' },
    { pattern: /\b(security|אבטחה|cyber|סייבר)/gi, category: 'security' },
    { pattern: /\b(philosophy|פילוסופיה|ethics|אתיקה)/gi, category: 'philosophy' },
    { pattern: /\b(psychology|פסיכולוגיה|cognitive|קוגניטיבי)/gi, category: 'science' },
  ];

  const conceptMap = new Map<string, {count: number, category: string}>();

  keywords.forEach(({ pattern, category }) => {
    const matches = text.match(pattern);
    if (matches) {
      const normalized = matches[0].toLowerCase();
      const existing = conceptMap.get(normalized);
      conceptMap.set(normalized, {
        count: (existing?.count || 0) + matches.length,
        category
      });
    }
  });

  return Array.from(conceptMap.entries())
    .map(([concept, data]) => ({ concept, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

// Ask AI about a specific summary
router.post('/summary/ask', requireAI, async (req: Request, res: Response) => {
  try {
    const { summaryId, question } = req.body;
    if (!summaryId || !question) {
      return res.status(400).json({ error: 'summaryId and question are required' });
    }

    const summary = await prisma.summary.findUnique({ where: { id: summaryId }, include: { book: true } });
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    const model = getDefaultModel();
    const messages = [
      { role: 'system', content: 'You are a subject matter expert. Answer questions based *only* on the provided book summary text. Provide answers in clear, well-structured Markdown format. If the question is in Hebrew, respond in Hebrew.' },
      { role: 'user', content: `Book: ${summary.book?.bookTitle || ''}\nSummary Title: ${summary.chapterTitle || ''}\nSummary Content:\n${summary.content}\n\nQuestion: ${question}` }
    ] as const;

    const ai = await createAIClientFromAny();
    const completion = await chatCompletion(ai, model, messages as any);
    const answer = completion.choices?.[0]?.message?.content || '';
    res.json({ answer });
  } catch (error: any) {
    console.error('Error in /summary/ask:', error);
    res.status(500).json({ error: 'Failed to process summary question', details: error.message });
  }
});

// Shorten a specific summary
router.post('/summary/shorten', requireAI, async (req: Request, res: Response) => {
  try {
    const { summaryId, length = 'short' } = req.body as { summaryId: string; length?: 'short'|'medium'|'bullet' };
    if (!summaryId) {
      return res.status(400).json({ error: 'summaryId is required' });
    }
    const summary = await prisma.summary.findUnique({ where: { id: summaryId }, include: { book: true } });
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    const model = getDefaultModel();
    const style = length === 'bullet'
      ? 'Return 3-5 concise, impactful bullet points in Markdown.'
      : length === 'medium'
        ? 'Return a rich, well-structured paragraph of 5-7 sentences.'
        : 'Return a single, highly condensed sentence (a thesis statement).'
    const messages = [
      { role: 'system', content: 'You are a professional editor and summarizer. Your task is to distill the provided text according to the user\'s requested style. The output must be in high-quality Hebrew and use Markdown for formatting.' },
      { role: 'user', content: `סכם את הסיכום הבא בהתאם להנחיות: ${style}\n\nכותרת: ${summary.chapterTitle || ''}\nספר: ${summary.book?.bookTitle || ''}\nתוכן:\n${summary.content}` }
    ] as const;
    const ai = await createAIClientFromAny();
    const completion = await chatCompletion(ai, model, messages as any);
    const out = completion.choices?.[0]?.message?.content || '';
    res.json({ summary: out });
  } catch (error: any) {
    console.error('Error in /summary/shorten:', error);
    res.status(500).json({ error: 'Failed to shorten summary', details: error.message });
  }
});

// Get AI status (does not require AI to be enabled)
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const enabled = await isAIEnabledAsync();
    const model = getDefaultModel();
    const provider = process.env.AI_BASE_URL || 'https://router.huggingface.co/v1';
    
    res.json({
      enabled,
      model,
      provider,
      configured: enabled,
    });
  } catch (error: any) {
    console.error('Error checking AI status:', error);
    res.status(500).json({ error: 'Failed to check AI status', details: error.message });
  }
});

// Test AI connectivity using server-side configuration
router.post('/test-connection', requireAI, async (_req: Request, res: Response) => {
  try {
    const ai = await createAIClientFromAny();
    const completion = await chatCompletion(ai, getDefaultModel(), [
      { role: 'user', content: 'ping' },
    ] as any);

    res.json({ success: true, provider: process.env.AI_BASE_URL || 'https://router.huggingface.co/v1', sample: completion.choices?.[0]?.message?.content || 'ok' });
  } catch (error: any) {
    console.error('Error testing AI connection:', error);
    res.status(500).json({ error: 'Failed to test connection', details: error.message });
  }
});

export default router;
