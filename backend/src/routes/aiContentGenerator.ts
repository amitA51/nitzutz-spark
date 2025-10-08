import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { GoogleDriveService } from '../services/googleDriveService';
import { createAIClientFromAny, chatCompletion } from '../services/aiClient';
import { smartContentGenerator } from '../services/smartContentGenerator';
import { preferenceAnalyzer } from '../services/preferenceAnalyzer';
import { enhancedGoogleDriveService } from '../services/enhancedGoogleDriveService';

const router = Router();
const SINGLE_USER_ID = 'default-user';

// Initialize services
const driveService = new GoogleDriveService();
// AI client will be initialized dynamically when needed

/**
 * Generate new article cards using enhanced AI with full personalization
 * This analyzes user's Drive documents, preferences, and creates highly personalized content
 */
router.post('/generate-smart', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('[Enhanced AI Content Generator] Starting smart content generation...');

    const { count = 3 } = req.body;

    // Use the new smart content generator
    const articles = await smartContentGenerator.generatePersonalizedContent(count);

    console.log(`[Enhanced AI Content Generator] Successfully generated ${articles.length} smart articles`);

    res.json({
      success: true,
      message: `נוצרו ${articles.length} מאמרים מותאמים אישית באינטליגנציה מתקדמת!`,
      articles: articles,
      personalized: true,
      analyzed: {
        userProfile: 'analyzed',
        driveContent: 'analyzed',
        smartGeneration: true,
      },
    });

  } catch (error: any) {
    console.error('[Enhanced AI Content Generator] Smart generation failed:', error);
    return res.status(500).json({
      error: 'Smart content generation failed',
      message: `שגיאה ביצירת תוכן חכם: ${error.message}`,
      details: error.toString(),
    });
  }
}));

/**
 * LEGACY: Generate new article cards based on Google Drive content (kept for compatibility)
 * This analyzes user's Drive documents and creates personalized article suggestions
 */
router.post('/generate-from-drive', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('[AI Content Generator] Starting content generation...');

    const { topics = ['פסיכולוגיה', 'סייבר', 'פיננסים'], count = 3 } = req.body;

    // Step 1: Get Google Drive connection
    const settings = await prisma.userSettings.findUnique({
      where: { id: SINGLE_USER_ID },
    });

    if (!settings?.googleDriveAuth) {
      return res.status(401).json({ 
        error: 'Google Drive not connected',
        message: 'יש להתחבר קודם ל-Google Drive כדי ליצור תוכן מותאם אישית'
      });
    }

    const tokens = JSON.parse(settings.googleDriveAuth);
    driveService.setAccessToken(tokens.accessToken, tokens.refreshToken);

    console.log('[AI Content Generator] Fetching recent documents from Drive...');

    // Step 2: Get recent documents from Drive
    const recentDocs = await driveService.getRecentDocuments();
    
    if (!recentDocs.files || recentDocs.files.length === 0) {
      return res.status(404).json({
        error: 'No documents found',
        message: 'לא נמצאו מסמכים ב-Google Drive שלך'
      });
    }

    console.log(`[AI Content Generator] Found ${recentDocs.files.length} documents`);

    // Step 3: Analyze up to 5 recent documents to understand user interests
    const docsToAnalyze = recentDocs.files.slice(0, 5);
    const documentSummaries = [];

    for (const doc of docsToAnalyze) {
      try {
        console.log(`[AI Content Generator] Analyzing: ${doc.name}`);
        
        const metadata = await driveService.getFileMetadata(doc.id!);
        const content = await driveService.getFileContent(doc.id!, metadata.mimeType!);
        
        // Get a quick summary
        documentSummaries.push({
          title: doc.name,
          preview: content.slice(0, 1000), // First 1000 chars
        });
      } catch (error) {
        console.error(`[AI Content Generator] Error analyzing ${doc.name}:`, error);
        // Continue with other documents
      }
    }

    console.log(`[AI Content Generator] Analyzed ${documentSummaries.length} documents successfully`);

    // Step 4: Get existing articles to avoid duplication
    const existingArticles = await prisma.article.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { title: true, content: true, category: true },
    });

    console.log(`[AI Content Generator] Found ${existingArticles.length} existing articles`);

    // Step 5: Use AI to generate new article ideas
    const systemMessage = `אתה עוזר AI מומחה ביצירת תוכן לימודי מותאם אישית.
המשימה שלך היא ליצור כרטיסיות מאמרים חדשות ומעניינות בנושאי ${topics.join(', ')}.

התבסס על המסמכים שהמשתמש קרא כדי להבין את רמת הידע ותחומי העניין שלו.

אל תשכפל כרטיסיות קיימות - צור תוכן חדש ורלוונטי.

החזר JSON במבנה הבא (מערך של ${count} כרטיסיות):
{
  "articles": [
    {
      "title": "כותרת מעניינת וקצרה (עד 80 תווים)",
      "content": "תוכן המאמר - 2-3 פסקאות עם מידע מעניין ושימושי. כתוב לפחות 300 מילים עם עובדות קונקרטיות.",
      "category": "פסיכולוגיה/סייבר/פיננסים",
      "readTime": "5"
    }
  ]
}

חשוב: readTime צריך להיות מספר בלבד (כמות דקות), לא טקסט!`

    const userDocs = documentSummaries.map((doc, i) => 
      `מסמך ${i + 1}: ${doc.title}\nתוכן: ${doc.preview}...`
    ).join('\n\n');

    const existingTitles = existingArticles.map(a => a.title).join(', ');

    const prompt = `צור ${count} כרטיסיות מאמרים חדשות ומעניינות בנושאים: ${topics.join(', ')}.

## המסמכים שהמשתמש קרא לאחרונה:
${userDocs}

## כרטיסיות קיימות (אל תשכפל):
${existingTitles}

## דרישות:
1. התוכן צריך להיות מעניין, מקורי ורלוונטי
2. כל כרטיסייה צריכה להיות בנושא שונה
3. התאם את הרמה לפי המסמכים שהמשתמש קרא
4. הוסף ערך אמיתי - עובדות מעניינות, טיפים, תובנות
5. השתמש בעברית תקנית וברורה

צור ${count} כרטיסיות חדשות:`;

    console.log('[AI Content Generator] Calling AI to generate content...');

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt },
    ] as const;

    const aiClient = await createAIClientFromAny();
    if (!aiClient) {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'שירות ה-AI לא זמין כרגע. אנא בדוק את ההגדרות.',
      });
    }

    const completion = await chatCompletion(
      aiClient, 
      process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3.2-Exp:novita', 
      messages as any
    );

    const responseText = completion.choices?.[0]?.message?.content || '';
    
    console.log('[AI Content Generator] AI response received, parsing...');
    console.log('[AI Content Generator] Response length:', responseText.length, 'characters');

    // Step 6: Parse AI response
    let generatedArticles;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[AI Content Generator] No JSON found in response');
        console.error('[AI Content Generator] First 500 chars:', responseText.slice(0, 500));
        throw new Error('No JSON found in AI response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      generatedArticles = parsed.articles || [];
      
      console.log(`[AI Content Generator] Parsed ${generatedArticles.length} articles from AI response`);
      
      // Validate each article
      generatedArticles = generatedArticles.filter((article: any, index: number) => {
        if (!article.title || !article.content) {
          console.warn(`[AI Content Generator] Article ${index + 1} missing title or content, skipping`);
          return false;
        }
        return true;
      });
      
      console.log(`[AI Content Generator] ${generatedArticles.length} valid articles after filtering`);
      
    } catch (parseError) {
      console.error('[AI Content Generator] Failed to parse AI response:', parseError);
      console.error('[AI Content Generator] Response preview:', responseText.slice(0, 500));
      return res.status(500).json({
        error: 'Failed to parse AI response',
        message: 'האיי החזיר תשובה שלא ניתן לעבד. נסה שוב.',
      });
    }

    if (!generatedArticles || generatedArticles.length === 0) {
      console.error('[AI Content Generator] No valid articles generated');
      return res.status(500).json({
        error: 'No articles generated',
        message: 'האיי לא יצר כרטיסיות תקינות. נסה שוב.',
      });
    }
    
    console.log(`[AI Content Generator] Starting to save ${generatedArticles.length} articles to database...`);
    
    if (generatedArticles.length < count) {
      console.warn(`[AI Content Generator] Warning: Asked for ${count} articles but only got ${generatedArticles.length}`);
    }

    console.log(`[AI Content Generator] Generated ${generatedArticles.length} articles, saving to DB...`);

    // Step 7: Save generated articles to database
    const savedArticles = [];
    for (const article of generatedArticles) {
      try {
        // Extract number from readTime (e.g., "5 דקות" -> 5)
        let readTimeNum = 5; // default
        if (article.readTime) {
          const match = article.readTime.match(/\d+/);
          if (match) {
            readTimeNum = parseInt(match[0]);
          }
        }

        const saved = await prisma.article.create({
          data: {
            title: article.title,
            content: article.content,
            category: article.category || topics[0],
            readTime: readTimeNum,
            excerpt: article.content.slice(0, 200), // First 200 chars as excerpt
          },
        });
        savedArticles.push(saved);
        console.log(`[AI Content Generator] Saved: ${article.title}`);
      } catch (dbError) {
        console.error(`[AI Content Generator] Failed to save article "${article.title}":`, dbError);
        console.error(`[AI Content Generator] Error details:`, dbError);
      }
    }

    console.log(`[AI Content Generator] Success! Saved ${savedArticles.length} articles`);

    res.json({
      success: true,
      message: `נוצרו ${savedArticles.length} כרטיסיות חדשות!`,
      articles: savedArticles,
      analyzed: {
        documentsCount: documentSummaries.length,
        existingArticlesCount: existingArticles.length,
      },
    });

  } catch (error: any) {
    console.error('[AI Content Generator] Error:', error);
    return res.status(500).json({
      error: 'Content generation failed',
      message: `שגיאה ביצירת תוכן: ${error.message}`,
      details: error.toString(),
    });
  }
}));

/**
 * Get user profile analysis for better content understanding
 */
router.get('/user-profile', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('[AI Content Generator] Analyzing user profile...');

    const userProfile = await preferenceAnalyzer.analyzeUserProfile();
    const recommendations = await preferenceAnalyzer.generateContentRecommendations(userProfile, 8);

    res.json({
      success: true,
      profile: {
        readingLevel: userProfile.readingLevel,
        contentStyle: userProfile.contentStyle,
        topCategories: userProfile.topCategories.slice(0, 5),
        interactionPatterns: userProfile.interactionPatterns,
        preferredTopics: userProfile.preferredTopics.slice(0, 10),
      },
      recommendations,
      message: 'פרופיל המשתמש נותח בהצלחה',
    });

  } catch (error: any) {
    console.error('[AI Content Generator] Profile analysis failed:', error);
    return res.status(500).json({
      error: 'Profile analysis failed',
      message: `שגיאה בניתוח הפרופיל: ${error.message}`,
    });
  }
}));

/**
 * LEGACY: Generate articles based on user preferences only (without Drive)
 * Useful if user doesn't want to connect Google Drive
 */
router.post('/generate-by-topics', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('[AI Content Generator] Generating by topics...');

    const { topics = ['פסיכולוגיה', 'סייבר', 'פיננסים'], count = 3, level = 'בינוני' } = req.body;

    // Get existing articles
    const existingArticles = await prisma.article.findMany({
      where: {
        category: { in: topics },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { title: true },
    });

    const existingTitles = existingArticles.map(a => a.title).join(', ');

    const systemMessage = `אתה עוזר AI מומחה ביצירת תוכן לימודי איכותי.
צור כרטיסיות מאמרים מעניינות ושימושיות בנושאים: ${topics.join(', ')}.

רמת הקושי: ${level}

החזר JSON במבנה הבא:
{
  "articles": [
    {
      "title": "כותרת מעניינת וקצרה",
      "content": "תוכן המאמר - 2-3 פסקאות עם מידע שימושי ומעניין",
      "category": "אחד מהנושאים",
      "readTime": "5"
    }
  ]
}

חשוב: readTime הוא מספר בלבד (דקות)!`

    const prompt = `צור ${count} כרטיסיות מאמרים חדשות.

נושאים: ${topics.join(', ')}
רמה: ${level}

כרטיסיות קיימות (אל תשכפל): ${existingTitles}

צור ${count} כרטיסיות עם תוכן מקורי ומעניין:`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt },
    ] as const;

    const aiClient = await createAIClientFromAny();
    if (!aiClient) {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'שירות ה-AI לא זמין',
      });
    }

    const completion = await chatCompletion(
      aiClient,
      process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3.2-Exp:novita',
      messages as any
    );

    const responseText = completion.choices?.[0]?.message?.content || '';
    
    let generatedArticles;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch![0]);
      generatedArticles = parsed.articles || [];
    } catch {
      return res.status(500).json({
        error: 'Failed to parse response',
        message: 'שגיאה בעיבוד התשובה מהאיי',
      });
    }

    // Save to database
    const savedArticles = [];
    for (const article of generatedArticles) {
      try {
        // Extract number from readTime
        let readTimeNum = 5;
        if (article.readTime) {
          const match = article.readTime.match(/\d+/);
          if (match) {
            readTimeNum = parseInt(match[0]);
          }
        }

        const saved = await prisma.article.create({
          data: {
            title: article.title,
            content: article.content,
            category: article.category || topics[0],
            readTime: readTimeNum,
            excerpt: article.content.slice(0, 200),
          },
        });
        savedArticles.push(saved);
        console.log(`[AI Content Generator] Saved: ${article.title}`);
      } catch (dbError) {
        console.error(`[AI Content Generator] Save error:`, dbError);
      }
    }

    console.log(`[AI Content Generator] Generated ${savedArticles.length} articles by topics`);

    res.json({
      success: true,
      message: `נוצרו ${savedArticles.length} כרטיסיות חדשות!`,
      articles: savedArticles,
    });

  } catch (error: any) {
    console.error('[AI Content Generator] Error:', error);
    return res.status(500).json({
      error: 'Generation failed',
      message: `שגיאה: ${error.message}`,
    });
  }
}));

/**
 * Trigger manual mentor insights generation
 */
router.post('/generate-mentor-insights', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('[Enhanced AI Content Generator] Generating mentor insights...');

    // Import the enhanced mentor service dynamically to avoid circular imports
    const { generateWeeklyInsights } = await import('../services/mentorService');
    await generateWeeklyInsights();

    // Get the latest insights
    const insights = await prisma.insight.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      message: 'תובנות המנטור נוצרו בהצלחה!',
      insights: insights,
      count: insights.length,
    });

  } catch (error: any) {
    console.error('[Enhanced AI Content Generator] Mentor insights generation failed:', error);
    return res.status(500).json({
      error: 'Mentor insights generation failed',
      message: `שגיאה ביצירת תובנות המנטור: ${error.message}`,
    });
  }
}));

/**
 * Get enhanced Google Drive analysis
 */
router.post('/analyze-drive-advanced', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('[Enhanced AI Content Generator] Starting advanced Drive analysis...');

    const { maxDocs = 15 } = req.body;

    // Get Google Drive connection
    const settings = await prisma.userSettings.findUnique({
      where: { id: SINGLE_USER_ID },
    });

    if (!settings?.googleDriveAuth) {
      return res.status(401).json({ 
        error: 'Google Drive not connected',
        message: 'יש להתחבר קודם ל-Google Drive'
      });
    }

    const tokens = JSON.parse(settings.googleDriveAuth);
    enhancedGoogleDriveService.setAccessToken(tokens.accessToken, tokens.refreshToken);

    // Enhanced analysis with AI
    const documentInsights = await enhancedGoogleDriveService.analyzeDocumentsWithAI(maxDocs);
    const contentMix = await enhancedGoogleDriveService.generatePersonalizedContentMix(documentInsights);
    
    // Save insights for future use
    await enhancedGoogleDriveService.saveDocumentInsights(documentInsights);

    res.json({
      success: true,
      message: `נותחו ${documentInsights.length} מסמכים באינטליגנציה מתקדמת`,
      documentInsights: documentInsights.slice(0, 10), // Limit response size
      contentMix: contentMix,
      analysis: {
        documentsAnalyzed: documentInsights.length,
        categoriesFound: [...new Set(documentInsights.flatMap(d => d.categories))],
        topicsFound: [...new Set(documentInsights.flatMap(d => d.topics))].slice(0, 10),
        averageComplexity: documentInsights.length > 0 
          ? documentInsights.reduce((sum, d) => sum + (d.complexity === 'complex' ? 3 : d.complexity === 'medium' ? 2 : 1), 0) / documentInsights.length
          : 0,
      },
    });

  } catch (error: any) {
    console.error('[Enhanced AI Content Generator] Advanced Drive analysis failed:', error);
    return res.status(500).json({
      error: 'Advanced Drive analysis failed',
      message: `שגיאה בניתוח מתקדם של Google Drive: ${error.message}`,
    });
  }
}));

/**
 * Generate daily automated content
 */
router.post('/generate-daily', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('[Enhanced AI Content Generator] Starting daily content generation...');

    await smartContentGenerator.generateDailyContent();

    // Get today's generated content
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaysArticles = await prisma.article.findMany({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      message: 'תוכן יומי נוצר בהצלחה!',
      articlesToday: todaysArticles,
      count: todaysArticles.length,
    });

  } catch (error: any) {
    console.error('[Enhanced AI Content Generator] Daily generation failed:', error);
    return res.status(500).json({
      error: 'Daily content generation failed',
      message: `שגיאה ביצירת תוכן יומי: ${error.message}`,
    });
  }
}));

/**
 * Get scheduler status and manage automation
 */
router.get('/scheduler-status', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Import scheduler dynamically to avoid circular imports
    const { smartScheduler } = await import('../jobs/smartScheduler');
    const status = smartScheduler.getStatus();

    res.json({
      success: true,
      scheduler: {
        status: status,
        available: true,
        environment: process.env.NODE_ENV,
      },
      message: 'סטטוס המתזמן החכם',
    });

  } catch (error: any) {
    console.error('[Enhanced AI Content Generator] Scheduler status failed:', error);
    return res.status(500).json({
      error: 'Failed to get scheduler status',
      message: `שגיאה בקבלת סטטוס המתזמן: ${error.message}`,
    });
  }
}));

/**
 * Manually run a specific scheduler job
 */
router.post('/run-job', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { jobName } = req.body;
    
    if (!jobName) {
      return res.status(400).json({
        error: 'Job name is required',
        message: 'יש לציין שם המשימה',
      });
    }

    console.log(`[Enhanced AI Content Generator] Manually running job: ${jobName}`);

    // Import scheduler dynamically
    const { smartScheduler } = await import('../jobs/smartScheduler');
    const success = await smartScheduler.runJob(jobName);

    if (success) {
      res.json({
        success: true,
        message: `משימה '${jobName}' הורצה בהצלחה!`,
        jobName,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Job execution failed',
        message: `משימה '${jobName}' נכשלה`,
      });
    }

  } catch (error: any) {
    console.error('[Enhanced AI Content Generator] Manual job execution failed:', error);
    return res.status(500).json({
      error: 'Job execution failed',
      message: `שגיאה בהרצת המשימה: ${error.message}`,
    });
  }
}));

export default router;
