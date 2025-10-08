import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { GoogleDriveService } from '../services/googleDriveService';
import { createAIClientFromAny, chatCompletion, isAIEnabledAsync, getDefaultModel } from '../services/aiClient';
import { encryptObject, decryptToObject } from '../utils/secureStore';

const router = Router();
const SINGLE_USER_ID = 'default-user';

// Helper to get a fresh Drive service (ensures env already loaded)
const getDriveService = () => new GoogleDriveService();

async function getTokensOrThrow() {
  const settings = await prisma.userSettings.findUnique({ where: { id: SINGLE_USER_ID } });
  if (!settings?.googleDriveAuth) {
    throw Object.assign(new Error('Google Drive not connected'), { status: 401 });
  }
  const parsed = decryptToObject(settings.googleDriveAuth);
  if (!parsed || !parsed.accessToken) {
    throw Object.assign(new Error('Invalid Google Drive auth tokens'), { status: 401 });
  }
  return parsed as { accessToken: string; refreshToken?: string };
}

/**
 * Get Google OAuth URL
 */
router.get('/auth/url', asyncHandler(async (_req: Request, res: Response) => {
  const driveService = getDriveService();
  const authUrl = driveService.getAuthUrl();
  res.json({ authUrl });
}));

/**
 * AI Q&A: Ask a question about a Google Drive file BEFORE import
 */
router.post('/files/:fileId/ask', asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { question } = req.body as { question?: string };

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // Get tokens and file content
  const tokens = await getTokensOrThrow();
  const driveService = getDriveService();
  driveService.setAccessToken(tokens.accessToken, tokens.refreshToken);

  const metadata = await driveService.getFileMetadata(fileId);
  const content = await driveService.getFileContent(fileId, metadata.mimeType!);

  const aiEnabled = await isAIEnabledAsync();
  if (!aiEnabled) {
    return res.status(503).json({ error: 'AI not configured', message: 'Configure AI_API_KEY in settings' });
  }

  const messages = [
    { role: 'system', content: 'You are a helpful assistant. Answer questions based only on the provided document text (Hebrew allowed). Be concise and clear.' },
    { role: 'user', content: `Document: ${metadata.name}\n\nContent:\n${content.slice(0, 12000)}\n\nQuestion: ${question}` },
  ] as const;

  const ai = await createAIClientFromAny();
  const completion = await chatCompletion(ai, getDefaultModel(), messages as any);
  const answer = completion.choices?.[0]?.message?.content || '';
  res.json({ answer });
}));

/**
 * OAuth callback - exchange code for tokens
 */
router.get('/auth/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  const driveService = getDriveService();
  const tokens = await driveService.exchangeCodeForTokens(code);

  // Save tokens to database (encrypted when SECRET_KEY is set)
  await prisma.userSettings.upsert({
    where: { id: SINGLE_USER_ID },
    create: {
      id: SINGLE_USER_ID,
      googleDriveAuth: encryptObject(tokens),
    },
    update: {
      googleDriveAuth: encryptObject(tokens),
    },
  });

  // Redirect to frontend with success
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/drive?connected=true`);
}));

/**
 * Check connection status
 */
router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.userSettings.findUnique({
    where: { id: SINGLE_USER_ID },
  });

  const isConnected = !!(settings?.googleDriveAuth);

  res.json({
    connected: isConnected,
    hasTokens: isConnected,
  });
}));

/**
 * Disconnect Google Drive
 */
router.post('/disconnect', asyncHandler(async (_req: Request, res: Response) => {
  await prisma.userSettings.update({
    where: { id: SINGLE_USER_ID },
    data: {
      googleDriveAuth: null,
    },
  });

  res.json({ success: true, message: 'Google Drive disconnected' });
}));

/**
 * Get recent documents - MUST BE BEFORE /files/:fileId routes
 */
router.get('/files/recent', asyncHandler(async (_req: Request, res: Response) => {
  const tokens = await getTokensOrThrow();
  const driveService = getDriveService();
  driveService.setAccessToken(tokens.accessToken, tokens.refreshToken);

  const result = await driveService.getRecentDocuments();

  res.json(result);
}));

/**
 * List files from Google Drive
 */
router.get('/files', asyncHandler(async (req: Request, res: Response) => {
  const { pageToken, search } = req.query;

  // Get tokens from database
  const tokens = await getTokensOrThrow();
  const driveService = getDriveService();
  driveService.setAccessToken(tokens.accessToken, tokens.refreshToken);

  let result;
  if (search && typeof search === 'string') {
    // basic escaping for quotes in Drive query
    const safe = search.replace(/['\\]/g, '\\$&');
    result = await driveService.searchFiles(safe);
  } else {
    result = await driveService.listFiles({
      pageToken: pageToken as string | undefined,
    });
  }

  res.json(result);
}));

/**
 * Get file content
 */
router.get('/files/:fileId/content', asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;

  // Get tokens from database
  const tokens = await getTokensOrThrow();
  const driveService = getDriveService();
  driveService.setAccessToken(tokens.accessToken, tokens.refreshToken);

  // Get file metadata first
  const metadata = await driveService.getFileMetadata(fileId);

  // Get file content
  const content = await driveService.getFileContent(fileId, metadata.mimeType!);

  res.json({
    metadata,
    content: content.slice(0, 50000), // Limit to 50k chars
  });
}));

/**
 * AI Analysis: What should I learn from this file?
 */
router.post('/files/:fileId/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { analysisType = 'learning-plan' } = req.body;

  // Get tokens and file content
  const tokens = await getTokensOrThrow();
  const driveService = getDriveService();
  driveService.setAccessToken(tokens.accessToken, tokens.refreshToken);

  const metadata = await driveService.getFileMetadata(fileId);
  const content = await driveService.getFileContent(fileId, metadata.mimeType!);

  // Use AI to analyze and create learning plan
  const systemMessage = analysisType === 'learning-plan' 
    ? 'אתה עוזר AI מומחה בלמידה. המשימה שלך היא לנתח מסמכים וליצור תכנית למידה מותאמת אישית בעברית. התמקד בנקודות המפתח, מושגים חשובים, ורצף לימוד הגיוני.'
    : 'אתה עוזר AI שמסכם מסמכים בעברית. צור סיכום ברור ותמציתי של המסמך.';

  const prompt = analysisType === 'learning-plan'
    ? `נתח את המסמך הבא וצור תכנית למידה מפורטת בעברית בפורמט JSON:

שם המסמך: ${metadata.name}

תוכן:
${content.slice(0, 10000)}

החזר JSON במבנה הבא:
{
  "summary": "סיכום קצר של המסמך (2-3 משפטים)",
  "keyTopics": ["נושא 1", "נושא 2", "נושא 3"],
  "difficulty": "קל/בינוני/מתקדם",
  "estimatedTime": "זמן משוער בשעות",
  "learningPath": [
    {
      "step": 1,
      "title": "כותרת השלב",
      "description": "תיאור מה ללמוד בשלב זה",
      "duration": "זמן משוער"
    }
  ],
  "prerequisites": ["ידע מוקדם נדרש"],
  "relatedTopics": ["נושאים קשורים"]
}`
    : `סכם את המסמך הבא בעברית:

שם: ${metadata.name}
תוכן:
${content.slice(0, 10000)}`;

  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt },
  ] as const;

  const ai = await createAIClientFromAny();
  const completion = await chatCompletion(ai, getDefaultModel(), messages as any);
  const analysisText = completion.choices?.[0]?.message?.content || '';

  let analysis;
  if (analysisType === 'learning-plan') {
    try {
      // Try to parse JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: analysisText };
    } catch {
      analysis = { summary: analysisText };
    }
  } else {
    analysis = { summary: analysisText };
  }

  res.json({
    fileId,
    fileName: metadata.name,
    analysisType,
    analysis,
  });
}));

/**
 * Import summary from Google Drive
 */
router.post('/import-summary/:fileId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const { bookTitle, bookAuthor, tags } = req.body;

    console.log(`[Google Drive Import] Starting import for fileId: ${fileId}`);
    console.log(`[Google Drive Import] Metadata:`, { bookTitle, bookAuthor, tags });

    // Get tokens from database
    const tokens = await getTokensOrThrow();
    const driveService = getDriveService();
    driveService.setAccessToken(tokens.accessToken, tokens.refreshToken);

    console.log('[Google Drive Import] Fetching file metadata and content...');
    
    // Get file metadata and content
    const metadata = await driveService.getFileMetadata(fileId);
    const content = await driveService.getFileContent(fileId, metadata.mimeType!);

    console.log(`[Google Drive Import] File fetched: ${metadata.name} (${content.length} chars)`);

    // Extract book info from document title if not provided
    let finalBookTitle = bookTitle;
    let finalBookAuthor = bookAuthor;
    
    if (!bookTitle) {
      // Try to extract from document name
      const nameMatch = metadata.name?.match(/סיכום.*?["״](.+?)["״]/);
      finalBookTitle = nameMatch ? nameMatch[1] : metadata.name || 'ללא שם';
    }

    console.log(`[Google Drive Import] Book info: "${finalBookTitle}" by ${finalBookAuthor || 'לא ידוע'}`);

    // Create the book (or find existing by title)
    let book = await prisma.book.findFirst({
      where: {
        bookTitle: finalBookTitle,
        author: finalBookAuthor || 'לא ידוע',
      },
    });

    if (!book) {
      console.log('[Google Drive Import] Creating new book...');
      book = await prisma.book.create({
        data: {
          bookTitle: finalBookTitle,
          author: finalBookAuthor || 'לא ידוע',
          currentPage: 0,
        },
      });
      console.log(`[Google Drive Import] Book created with ID: ${book.id}`);
    } else {
      console.log(`[Google Drive Import] Using existing book ID: ${book.id}`);
    }

    console.log('[Google Drive Import] Starting AI analysis...');
    
    // AI Analysis for smart summary extraction (optional)
    const systemMessage = `אתה עוזר AI מומחה בעיבוד סיכומי ספרים. המשימה שלך היא לחלץ מידע מובנה מסיכום ספר בעברית ולהחזיר JSON מובנה.

החזר JSON בפורמט הבא:
{
  "title": "כותרת הסיכום",
  "keyPoints": ["נקודה 1", "נקודה 2", "נקודה 3"],
  "concepts": ["מושג 1", "מושג 2"],
  "quotes": [{"text": "ציטוט", "context": "הקשר"}],
  "personalNotes": "תובנות אישיות אם יש",
  "summary": "סיכום קצר של 2-3 משפטים",
  "chapters": [{"title": "שם פרק", "summary": "תקציר"}]
}`;

    const prompt = `נתח את הסיכום הבא וחלץ ממנו מידע מובנה:

כותרת: ${metadata.name}
תוכן:
${content.slice(0, 15000)}`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt },
    ] as const;

    let extractedData: any = {};
    try {
      const aiEnabled = await isAIEnabledAsync();
      if (aiEnabled) {
        const ai = await createAIClientFromAny();
        const completion = await chatCompletion(ai, process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3.2-Exp:novita', messages as any);
        const analysisText = completion.choices?.[0]?.message?.content || '';
        console.log('[Google Drive Import] AI analysis completed');
        try {
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch {
          extractedData = {};
        }
      } else {
        console.warn('[Google Drive Import] AI not configured, skipping analysis');
      }
    } catch (e) {
      console.warn('[Google Drive Import] AI analysis failed, continuing without it:', e);
    }

    console.log('[Google Drive Import] Creating summary in database...');
    
    // Create the summary (matching current schema)
    const summary = await prisma.summary.create({
      data: {
        bookId: book.id,
        content: content,
        chapterTitle: extractedData.title || metadata.name,
      },
    });

    console.log(`[Google Drive Import] Summary created with ID: ${summary.id}`);

    // Create concept mentions for tracking
    if (extractedData.concepts?.length > 0) {
      console.log(`[Google Drive Import] Creating ${extractedData.concepts.length} concept mentions...`);
      for (const concept of extractedData.concepts) {
        await prisma.conceptMention.create({
          data: {
            concept: concept,
            bookId: book.id,
            context: `מושג מרכזי מהספר "${finalBookTitle}"`,
          },
        });
      }
    }

    console.log(`[Google Drive Import] Success! Created summary for "${finalBookTitle}"`);

    res.json({
      success: true,
      book,
      summary,
      extractedData,
      message: `הסיכום של "${finalBookTitle}" יובא בהצלחה!`,
    });
  } catch (error: any) {
    console.error('[Google Drive Import] Error:', error);
    return res.status(500).json({ 
      error: 'Import failed', 
      message: `שגיאה בייבוא הסיכום: ${error.message}`,
      details: error.toString()
    });
  }
}));

export default router;
