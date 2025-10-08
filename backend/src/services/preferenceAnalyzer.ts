import { prisma } from '../db';
import { createAIClientFromAny, getDefaultModel, chatCompletion } from './aiClient';
import { contentCache } from './contentCache';

interface UserProfile {
  topCategories: { category: string; score: number }[];
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredTopics: string[];
  interactionPatterns: {
    readingTime: 'quick' | 'detailed' | 'mixed';
    questionTypes: string[];
    saveFrequency: number;
  };
  contentStyle: 'practical' | 'theoretical' | 'mixed';
  languagePreference: 'hebrew' | 'english' | 'mixed';
}

interface GoogleDriveInsights {
  expertiseAreas: string[];
  documentTypes: string[];
  writingStyle: string;
  knowledgeLevel: string;
  recentInterests: string[];
}

export class PreferenceAnalyzer {
  
  /**
   * בניית פרופיל מקיף של המשתמש מבוסס על פעילותו במערכת
   */
  async analyzeUserProfile(): Promise<UserProfile> {
    console.log('🔍 [Preference Analyzer] Building comprehensive user profile...');
    
    // בדיקת מטמון לפרופיל משתמש
    const profileCacheKey = 'user_profile_analysis';
    const cachedProfile = contentCache.get(profileCacheKey);
    if (cachedProfile) {
      console.log('📋 [Preference Analyzer] Using cached user profile');
      return cachedProfile;
    }
    
    // שלב 1: ניתוח מאמרים שמורים
    const savedArticles = await prisma.savedArticle.findMany({
      include: { article: true },
      orderBy: { savedAt: 'desc' },
      take: 100,
    });

    // שלב 2: ניתוח פעילות משתמש
    const recentActivity = await prisma.userActivity.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 ימים אחרונים
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // שלב 3: ניתוח שאלות AI
    const aiQuestions = await prisma.aiQuestion.findMany({
      include: { article: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // שלב 4: ניתוח ספרים וסיכומים
    const books = await prisma.book.findMany({
      include: { summaries: true },
      orderBy: { updatedAt: 'desc' },
    });

    // נתח קטגוריות מועדפות
    const categoryCount: Record<string, number> = {};
    savedArticles.forEach(sa => {
      const cat = sa.article.category;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        score: count / savedArticles.length,
      }));

    // נתח דפוסי אינטראקציה
    const avgReadTime = this.calculateAverageReadTime(recentActivity);
    const questionTypes = this.analyzeQuestionTypes(aiQuestions);
    
    // קבע רמת קריאה
    const readingLevel = this.determineReadingLevel(savedArticles, books, aiQuestions);
    
    // נתח סגנון תוכן מועדף
    const contentStyle = await this.analyzeContentStyle(savedArticles.slice(0, 20));

    console.log(`✅ [Preference Analyzer] Profile built with ${topCategories.length} top categories`);
    
    const profile: UserProfile = {
      topCategories,
      readingLevel,
      preferredTopics: this.extractTopics(savedArticles, aiQuestions),
      interactionPatterns: {
        readingTime: (avgReadTime > 10 ? 'detailed' : avgReadTime > 5 ? 'mixed' : 'quick') as 'quick' | 'detailed' | 'mixed',
        questionTypes,
        saveFrequency: savedArticles.length / Math.max(recentActivity.length, 1),
      },
      contentStyle,
      languagePreference: 'hebrew', // רוב התוכן בעברית
    };
    
    // שמירה במטמון ל15 דקות (כי פרופיל המשתמש לא משתנה מהר)
    contentCache.set(profileCacheKey, profile, 15 * 60 * 1000);
    console.log('💾 [Preference Analyzer] User profile cached for 15 minutes');
    
    return profile;
  }

  /**
   * ניתוח מסמכי Google Drive למציאת תחומי מומחיות וסגנון
   */
  async analyzeGoogleDriveContent(documents: Array<{ name: string; content: string; type: string }>): Promise<GoogleDriveInsights> {
    console.log('📄 [Preference Analyzer] Analyzing Google Drive content...');
    
    if (documents.length === 0) {
      return {
        expertiseAreas: [],
        documentTypes: [],
        writingStyle: 'balanced',
        knowledgeLevel: 'intermediate',
        recentInterests: [],
      };
    }

    const ai = await createAIClientFromAny();
    if (!ai) {
      throw new Error('AI client not available for Drive analysis');
    }

    // הכן טקסט לניתוח - קח דגימות מהמסמכים
    const documentSamples = documents.slice(0, 10).map(doc => ({
      name: doc.name,
      preview: doc.content.slice(0, 1000), // 1000 תווים ראשונים
      type: doc.type,
    }));

    const analysisPrompt = `נתח את המסמכים הבאים של המשתמש וזהה:

מסמכים:
${documentSamples.map((doc, i) => 
  `${i + 1}. "${doc.name}" (${doc.type})\n${doc.preview}...\n`
).join('\n')}

החזר JSON עם הפורמט הבא:
{
  "expertiseAreas": ["תחום1", "תחום2", "תחום3"],
  "documentTypes": ["סוגי מסמכים שיש"],
  "writingStyle": "practical/academic/creative/mixed",
  "knowledgeLevel": "beginner/intermediate/advanced",
  "recentInterests": ["נושאים עדכניים שעולים מהמסמכים"]
}

התמקד ב:
- תחומי מומחיות ועניין בולטים
- רמת המתח והעומק המקצועי
- נושאים שחוזרים על עצמם
- סגנון הכתיבה והחשיבה`;

    try {
      const completion = await chatCompletion(ai, getDefaultModel(), [
        { role: 'system', content: 'אתה מנתח תוכן מומחה. החזר תמיד JSON תקין בלבד.' },
        { role: 'user', content: analysisPrompt },
      ]);

      const responseText = completion.choices?.[0]?.message?.content || '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ [Preference Analyzer] Google Drive analysis completed');
        return parsed;
      }
    } catch (error) {
      console.error('❌ [Preference Analyzer] Drive analysis failed:', error);
    }

    // חזור ברירת מחדל אם הניתוח נכשל
    return {
      expertiseAreas: this.extractBasicTopics(documents),
      documentTypes: [...new Set(documents.map(d => d.type))],
      writingStyle: 'mixed',
      knowledgeLevel: 'intermediate',
      recentInterests: [],
    };
  }

  /**
   * יצירת הקשר מותאם אישית למודל AI בהתאם לפרופיל המשתמש
   */
  async generatePersonalizedContext(userProfile: UserProfile, driveInsights?: GoogleDriveInsights): Promise<string> {
    const context = `## פרופיל המשתמש האישי

### תחומי עניין מרכזיים:
${userProfile.topCategories.map(c => `- ${c.category} (רמת עניין: ${Math.round(c.score * 100)}%)`).join('\n')}

### רמת קריאה ולמידה: ${userProfile.readingLevel}
### סגנון תוכן מועדף: ${userProfile.contentStyle}

### דפוסי אינטראקציה:
- זמן קריאה: ${userProfile.interactionPatterns.readingTime}
- תדירות שמירה: ${Math.round(userProfile.interactionPatterns.saveFrequency * 100)}%
- סוגי שאלות: ${userProfile.interactionPatterns.questionTypes.join(', ')}

### נושאים מועדפים:
${userProfile.preferredTopics.slice(0, 8).join(', ')}`;

    if (driveInsights && driveInsights.expertiseAreas.length > 0) {
      return context + `

### ניתוח מסמכים אישיים (Google Drive):
- תחומי מומחיות: ${driveInsights.expertiseAreas.join(', ')}
- רמת ידע: ${driveInsights.knowledgeLevel}
- סגנון כתיבה: ${driveInsights.writingStyle}
- עניינים אחרונים: ${driveInsights.recentInterests.join(', ')}`;
    }

    return context;
  }

  /**
   * המלצה על תוכן מותאם אישית
   */
  async generateContentRecommendations(userProfile: UserProfile, count: number = 5): Promise<string[]> {
    const ai = await createAIClientFromAny();
    if (!ai) return [];

    const personalContext = await this.generatePersonalizedContext(userProfile);
    
    const prompt = `בהתבסס על הפרופיל האישי, המלץ על ${count} נושאים מעניינים לכתיבת מאמרים.

${personalContext}

החזר JSON array של נושאים מדויקים ומעניינים:
["נושא מקצועי ומעניין 1", "נושא 2", ...]

כללים:
- התאם לרמת הידע והעניין של המשתמש
- צור נושאים ספציפיים, לא כלליים
- שלב בין תחומי העניין השונים
- הקפד על רלוונטיות ואקטואליות`;

    try {
      const completion = await chatCompletion(ai, getDefaultModel(), [
        { role: 'system', content: 'אתה מומחה בהמלצות תוכן מותאמות אישית. החזר JSON array בלבד.' },
        { role: 'user', content: prompt },
      ]);

      const responseText = completion.choices?.[0]?.message?.content || '[]';
      const jsonMatch = responseText.match(/\[[^\]]*\]/);
      
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations.slice(0, count);
      }
    } catch (error) {
      console.error('❌ [Preference Analyzer] Recommendations failed:', error);
    }

    // ברירת מחדל
    return userProfile.topCategories.slice(0, count).map(c => `${c.category} מתקדם`);
  }

  // פונקציות עזר פרטיות
  private calculateAverageReadTime(activities: any[]): number {
    const readActivities = activities.filter(a => a.action === 'article_read');
    if (readActivities.length === 0) return 5;
    
    // הערכה גסה בהתבסס על פעילות
    return Math.min(readActivities.length / 2, 15);
  }

  private analyzeQuestionTypes(questions: any[]): string[] {
    const types = new Set<string>();
    
    questions.forEach(q => {
      const question = q.question.toLowerCase();
      if (question.includes('איך') || question.includes('כיצד')) {
        types.add('הוראות');
      } else if (question.includes('למה') || question.includes('מדוע')) {
        types.add('הסברים');
      } else if (question.includes('מה') || question.includes('מהו')) {
        types.add('הגדרות');
      } else if (question.includes('דוגמה') || question.includes('לדוגמה')) {
        types.add('דוגמאות');
      } else {
        types.add('כלליות');
      }
    });
    
    return Array.from(types);
  }

  private determineReadingLevel(savedArticles: any[], books: any[], questions: any[]): 'beginner' | 'intermediate' | 'advanced' {
    let score = 0;
    
    // נתח לפי מספר ספרים וסיכומים
    score += Math.min(books.length / 5, 2);
    
    // נתח לפי מורכבות השאלות
    const complexQuestions = questions.filter(q => 
      q.question.length > 50 || 
      q.question.includes('השווה') || 
      q.question.includes('נתח') ||
      q.question.includes('הסבר את הקשר')
    );
    score += complexQuestions.length / Math.max(questions.length, 1) * 2;
    
    // נתח לפי מגוון קטגוריות
    const categories = new Set(savedArticles.map(sa => sa.article.category));
    score += Math.min(categories.size / 3, 1);
    
    if (score >= 3) return 'advanced';
    if (score >= 1.5) return 'intermediate';
    return 'beginner';
  }

  private async analyzeContentStyle(savedArticles: any[]): Promise<'practical' | 'theoretical' | 'mixed'> {
    if (savedArticles.length === 0) return 'mixed';
    
    let practicalCount = 0;
    let theoreticalCount = 0;
    
    savedArticles.forEach(sa => {
      const content = sa.article.content.toLowerCase();
      const title = sa.article.title.toLowerCase();
      
      // מילות מפתח מעשיות
      if (content.includes('מדריך') || content.includes('איך') || 
          content.includes('שלבים') || content.includes('טיפים') ||
          title.includes('מדריך') || title.includes('איך')) {
        practicalCount++;
      }
      
      // מילות מפתח תיאורטיות
      if (content.includes('תיאוריה') || content.includes('מחקר') ||
          content.includes('עיקרון') || content.includes('מושג') ||
          title.includes('מהו') || title.includes('הבנת')) {
        theoreticalCount++;
      }
    });
    
    const total = practicalCount + theoreticalCount;
    if (total === 0) return 'mixed';
    
    const practicalRatio = practicalCount / total;
    if (practicalRatio >= 0.7) return 'practical';
    if (practicalRatio <= 0.3) return 'theoretical';
    return 'mixed';
  }

  private extractTopics(savedArticles: any[], questions: any[]): string[] {
    const topics = new Set<string>();
    
    // חלץ נושאים מכותרות מאמרים
    savedArticles.forEach(sa => {
      const words = sa.article.title.split(' ').filter((w: string) => w.length > 3);
      words.forEach((word: string) => topics.add(word));
    });
    
    // חלץ נושאים משאלות
    questions.forEach(q => {
      const words = q.question.split(' ').filter((w: string) => w.length > 3);
      words.slice(0, 3).forEach((word: string) => topics.add(word));
    });
    
    return Array.from(topics).slice(0, 15);
  }

  private extractBasicTopics(documents: any[]): string[] {
    const topics = new Set<string>();
    
    documents.forEach(doc => {
      const words = doc.name.split(' ').concat(doc.content.slice(0, 200).split(' '));
      words.filter((w: string) => w.length > 4).slice(0, 5).forEach((word: string) => topics.add(word));
    });
    
    return Array.from(topics).slice(0, 8);
  }
}

export const preferenceAnalyzer = new PreferenceAnalyzer();