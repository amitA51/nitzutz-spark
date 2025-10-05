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
    let systemMessage = 'You are a helpful assistant that answers questions about the provided article.';
    if (categoryHint) {
      systemMessage += ` Focus your reasoning on the domain/category: ${categoryHint}. Prefer domain-specific terminology and context.`;
    }
    if (mode === 'devils-advocate') {
      systemMessage = 'You are a critical thinking assistant. Your role is to challenge arguments, present counter-arguments, identify logical fallacies, and highlight alternative perspectives. Be constructive but rigorous in your analysis.';
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
        content: 'You are a helpful assistant that extracts key takeaways from articles. Provide 3-5 concise bullet points that capture the most important insights. Each point should be one sentence, clear and actionable. Return the response as a JSON array of strings.' 
      },
      { 
        role: 'user', 
        content: `Extract the key takeaways from this article:\n\nTitle: ${article.title}\n\nContent:\n${article.content}\n\nRespond with a JSON array of 3-5 key takeaway strings.` 
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
        content: 'You are a knowledge connection assistant. Analyze the current article and find meaningful connections to the user\'s existing knowledge (books and saved articles). Return a JSON array of connections with format: [{"type": "book" | "article" | "contradiction", "title": "...", "relation": "short description of connection", "id": "item_id"}]. Maximum 5 connections. Focus on conceptual links, shared themes, or contradictions.' 
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

// Get concept cloud - most frequently mentioned concepts
router.get('/concept-cloud', async (_req: Request, res: Response) => {
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

    res.json({ concepts: formattedConcepts });
  } catch (error: any) {
    console.error('Error fetching concept cloud:', error);
    res.status(500).json({ error: 'Failed to fetch concept cloud', details: error.message });
  }
});

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
      { role: 'system', content: 'You are a helpful assistant. Answer questions based only on the provided book summary text (Hebrew allowed). Be concise and clear.' },
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
      ? 'החזר 3-5 נקודות תמציתיות בבולטים.'
      : length === 'medium'
        ? 'החזר תקציר תמציתי של 5-7 משפטים.'
        : 'החזר תקציר קצר של 2-3 משפטים בלבד.';
    const messages = [
      { role: 'system', content: 'אתה מסכם טקסטים בעברית בצורה מקצועית, ברורה וקריאה.' },
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
