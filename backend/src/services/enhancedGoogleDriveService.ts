import { GoogleDriveService } from './googleDriveService';
import { createAIClientFromAny, getDefaultModel, chatCompletion } from './aiClient';
import { preferenceAnalyzer } from './preferenceAnalyzer';
import { prisma } from '../db';
import { advancedAnalytics } from './advancedAnalytics';

interface DocumentInsight {
  id: string;
  name: string;
  type: string;
  size: number;
  modifiedDate: string;
  categories: string[];
  topics: string[];
  complexity: 'simple' | 'medium' | 'complex';
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  language: 'hebrew' | 'english' | 'mixed';
}

interface ContentMix {
  suggestedTopics: string[];
  contentStyle: string;
  targetAudience: string;
  expertise_level: string;
  recommended_categories: string[];
}

export class EnhancedGoogleDriveService extends GoogleDriveService {
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second
  private healthStatus: 'healthy' | 'degraded' | 'error' = 'healthy';
  private lastErrorTime: Date | null = null;
  private consecutiveErrors: number = 0;
  
  /**
   * ריטרי מנגנון חכם עם בקירת שגיאות
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = this.maxRetries
  ): Promise<T> {
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        
        // רישום הצלחה
        const duration = Date.now() - startTime;
        advancedAnalytics.trackPerformance('google-drive', operationName, duration, true, {
          attempt: attempt + 1,
          totalAttempts: retries + 1
        });
        
        // איפוס מצב בריאות
        this.consecutiveErrors = 0;
        this.updateHealthStatus();
        
        return result;
        
      } catch (error) {
        const duration = Date.now() - startTime;
        const isLastAttempt = attempt === retries;
        
        if (isLastAttempt) {
          // רישום כשלון סופי
          advancedAnalytics.trackPerformance('google-drive', operationName, duration, false, {
            error: (error as any).message,
            attempt: attempt + 1,
            totalAttempts: retries + 1
          });
          
          this.handleError(error as Error, operationName);
          throw error;
        }
        
        // המתנה לפני ניסיון נוסף
        console.warn(`⚠️ [Enhanced Drive] ${operationName} failed (attempt ${attempt + 1}/${retries + 1}), retrying...`);
        await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }
    
    throw new Error(`Operation ${operationName} failed after ${retries + 1} attempts`);
  }
  
  /**
   * טיפול בשגיאות ועידכון מצב בריאות
   */
  private handleError(error: Error, operationName: string): void {
    this.lastErrorTime = new Date();
    this.consecutiveErrors++;
    
    console.error(`❌ [Enhanced Drive] ${operationName} error:`, error.message);
    
    // עידכון מצב בריאות
    this.updateHealthStatus();
    
    // התראה קריטית אם יש הרבה שגיאות רצופות
    if (this.consecutiveErrors >= 5) {
      advancedAnalytics.trackPerformance('google-drive', 'health-check', 0, false, {
        level: 'critical',
        consecutiveErrors: this.consecutiveErrors,
        lastErrorTime: this.lastErrorTime,
        healthStatus: this.healthStatus
      });
    }
  }
  
  /**
   * עידכון מצב בריאות השירות
   */
  private updateHealthStatus(): void {
    if (this.consecutiveErrors === 0) {
      this.healthStatus = 'healthy';
    } else if (this.consecutiveErrors < 3) {
      this.healthStatus = 'degraded';
    } else {
      this.healthStatus = 'error';
    }
  }
  
  /**
   * המתנה
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * קבלת מצב בריאות השירות
   */
  getHealthStatus() {
    return {
      status: this.healthStatus,
      consecutiveErrors: this.consecutiveErrors,
      lastErrorTime: this.lastErrorTime,
      isHealthy: this.healthStatus === 'healthy'
    };
  }
  
  /**
   * ניתוח מתקדם של מסמכי Google Drive עם קטגוריזציה חכמה
   */
  async analyzeDocumentsWithAI(maxDocs: number = 20): Promise<DocumentInsight[]> {
    console.log('🔍 [Enhanced Drive] Starting comprehensive document analysis...');
    
    return this.retryOperation(async () => {
      // קבל מסמכים אחרונים
      const recentDocs = await this.getRecentDocuments();
      
      if (!recentDocs.files || recentDocs.files.length === 0) {
        console.log('📂 [Enhanced Drive] No documents found');
        return [];
      }

      const docsToAnalyze = recentDocs.files.slice(0, maxDocs);
      const insights: DocumentInsight[] = [];
      
      console.log(`📊 [Enhanced Drive] Analyzing ${docsToAnalyze.length} documents...`);
      
      for (const doc of docsToAnalyze) {
        try {
          const metadata = await this.getFileMetadata(doc.id!);
          let content = '';
          
          try {
            content = await this.getFileContent(doc.id!, metadata.mimeType!);
          } catch (contentError) {
            console.warn(`⚠️ [Enhanced Drive] Could not read content of ${doc.name}:`, contentError);
            continue;
          }
          
          // ניתוח AI של המסמך
          const insight = await this.analyzeDocumentContent(doc.id!, doc.name || '', content, metadata.mimeType || '');
          insights.push(insight);
          
        } catch (error) {
          console.error(`❌ [Enhanced Drive] Error analyzing ${doc.name}:`, error);
        }
      }
      
      console.log(`✅ [Enhanced Drive] Successfully analyzed ${insights.length} documents`);
      return insights;
      
    }, 'analyzeDocumentsWithAI');
  }

  /**
   * ניתוח מסמך בודד עם AI
   */
  private async analyzeDocumentContent(
    docId: string, 
    docName: string, 
    content: string, 
    mimeType: string
  ): Promise<DocumentInsight> {
    
    const ai = await createAIClientFromAny();
    if (!ai) {
      // ניתוח בסיסי ללא AI
      return this.createBasicInsight(docId, docName, content, mimeType);
    }

    const analysisPrompt = `נתח את המסמך הבא וספק תובנות מעמיקות:

כותרת: ${docName}
סוג: ${mimeType}
תוכן (500 תווים ראשונים):
${content.slice(0, 500)}

החזר JSON בפורמט הבא:
{
  "categories": ["קטגוריה1", "קטגוריה2"],
  "topics": ["נושא ספציפי 1", "נושא ספציפי 2", "נושא ספציפי 3"],
  "complexity": "simple/medium/complex",
  "summary": "תקציר קצר של המסמך (משפט אחד)",
  "keyPoints": ["נקודה מרכזית 1", "נקודה מרכזית 2", "נקודה מרכזית 3"],
  "sentiment": "positive/neutral/negative",
  "language": "hebrew/english/mixed"
}

התמקד ב:
- קטגוריות רלוונטיות (טכנולוגיה, עסקים, פסיכולוגיה, וכו')
- נושאים ספציפיים שהמסמך עוסק בהם
- רמת המורכבות והעומק המקצועי
- נקודות מפתח שהמשתמש עסק בהן`;

    try {
      const completion = await chatCompletion(ai, getDefaultModel(), [
        { 
          role: 'system', 
          content: 'אתה מנתח מסמכים מומחה. החזר תמיד JSON תקין בלבד עם כל השדות הנדרשים.' 
        },
        { role: 'user', content: analysisPrompt },
      ]);

      const responseText = completion.choices?.[0]?.message?.content || '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          id: docId,
          name: docName,
          type: this.normalizeDocumentType(mimeType),
          size: content.length,
          modifiedDate: new Date().toISOString(),
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          topics: Array.isArray(parsed.topics) ? parsed.topics : [],
          complexity: ['simple', 'medium', 'complex'].includes(parsed.complexity) ? parsed.complexity : 'medium',
          summary: parsed.summary || `מסמך: ${docName}`,
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
          language: ['hebrew', 'english', 'mixed'].includes(parsed.language) ? parsed.language : 'mixed',
        };
      }
    } catch (error) {
      console.error(`❌ [Enhanced Drive] AI analysis failed for ${docName}:`, error);
    }

    // חזור לניתוח בסיסי אם AI נכשל
    return this.createBasicInsight(docId, docName, content, mimeType);
  }

  /**
   * יצירת תובנה בסיסית ללא AI
   */
  private createBasicInsight(docId: string, docName: string, content: string, mimeType: string): DocumentInsight {
    const basicTopics = this.extractBasicTopics(docName, content);
    const basicCategories = this.guessCategories(docName, content);
    
    return {
      id: docId,
      name: docName,
      type: this.normalizeDocumentType(mimeType),
      size: content.length,
      modifiedDate: new Date().toISOString(),
      categories: basicCategories,
      topics: basicTopics,
      complexity: content.length > 2000 ? 'complex' : content.length > 500 ? 'medium' : 'simple',
      summary: `מסמך ${docName} (${content.length} תווים)`,
      keyPoints: basicTopics.slice(0, 3),
      sentiment: 'neutral',
      language: this.detectLanguage(content),
    };
  }

  /**
   * יצירת מיקס תוכן מותאם אישית בהתבסס על מסמכי המשתמש
   */
  async generatePersonalizedContentMix(insights: DocumentInsight[]): Promise<ContentMix> {
    console.log('🎯 [Enhanced Drive] Generating personalized content mix...');
    
    if (insights.length === 0) {
      return this.getDefaultContentMix();
    }

    const ai = await createAIClientFromAny();
    if (!ai) {
      return this.generateBasicContentMix(insights);
    }

    // נתח את הפרופיל הכללי של המשתמש במקביל
    const userProfile = await preferenceAnalyzer.analyzeUserProfile();
    
    const contentAnalysis = {
      totalDocuments: insights.length,
      categories: this.aggregateCategories(insights),
      topics: this.aggregateTopics(insights),
      complexity: this.calculateAverageComplexity(insights),
      languages: this.aggregateLanguages(insights),
      documentTypes: this.aggregateDocumentTypes(insights),
    };

    const mixPrompt = `בהתבסס על ניתוח המסמכים האישיים של המשתמש, צור מיקס תוכן מותאם אישית:

## ניתוח המסמכים:
- סה"כ מסמכים: ${contentAnalysis.totalDocuments}
- קטגוריות עיקריות: ${Object.entries(contentAnalysis.categories).slice(0, 5).map(([cat, count]) => `${cat} (${count})`).join(', ')}
- נושאים חוזרים: ${Object.entries(contentAnalysis.topics).slice(0, 8).map(([topic, count]) => `${topic} (${count})`).join(', ')}
- רמת מורכבות ממוצעת: ${contentAnalysis.complexity}
- שפות: ${Object.entries(contentAnalysis.languages).map(([lang, count]) => `${lang} (${count})`).join(', ')}

## פרופיל המשתמש מהמערכת:
- קטגוריות מועדפות: ${userProfile.topCategories.map(c => c.category).join(', ')}
- רמת קריאה: ${userProfile.readingLevel}
- סגנון תוכן: ${userProfile.contentStyle}

החזר JSON עם הפורמט הבא:
{
  "suggestedTopics": ["נושא מתאים 1", "נושא מתאים 2", "נושא מתאים 3", "נושא מתאים 4", "נושא מתאים 5"],
  "contentStyle": "practical/academic/creative/mixed - בהתאם לניתוח",
  "targetAudience": "תיאור של הקהל היעד המתאים",
  "expertise_level": "beginner/intermediate/advanced",
  "recommended_categories": ["קטגוריה מומלצת 1", "קטגוריה מומלצת 2", "קטגוריה מומלצת 3"]
}

כללים:
- התאם את ההמלצות לתחומי העניין שזוהו במסמכים
- שמור על עקביות עם הפרופיל הקיים של המשתמש
- צור נושאים ספציפיים ומעניינים, לא כלליים
- התחשב ברמת המומחיות שמשתקפת מהמסמכים`;

    try {
      const completion = await chatCompletion(ai, getDefaultModel(), [
        { 
          role: 'system', 
          content: 'אתה מומחה בהמלצות תוכן מותאמות אישית. החזר JSON תקין עם כל השדות הנדרשים.' 
        },
        { role: 'user', content: mixPrompt },
      ]);

      const responseText = completion.choices?.[0]?.message?.content || '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ [Enhanced Drive] Personalized content mix generated');
        
        return {
          suggestedTopics: Array.isArray(parsed.suggestedTopics) ? parsed.suggestedTopics : [],
          contentStyle: parsed.contentStyle || 'mixed',
          targetAudience: parsed.targetAudience || 'משתמש מתקדם',
          expertise_level: parsed.expertise_level || 'intermediate',
          recommended_categories: Array.isArray(parsed.recommended_categories) ? parsed.recommended_categories : [],
        };
      }
    } catch (error) {
      console.error('❌ [Enhanced Drive] Content mix generation failed:', error);
    }

    // חזור למיקס בסיסי
    return this.generateBasicContentMix(insights);
  }

  /**
   * שמירת תובנות המסמכים לדאטהבייס לשימוש עתידי
   */
  async saveDocumentInsights(insights: DocumentInsight[]): Promise<void> {
    console.log('💾 [Enhanced Drive] Saving document insights to database...');
    
    try {
      // נקה תובנות ישנות
      await prisma.insight.deleteMany({
        where: {
          type: 'drive_document',
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // ישן מ-7 ימים
          },
        },
      });

      // שמור תובנות חדשות
      const insightsToSave = insights.slice(0, 10).map(insight => ({
        type: 'drive_document',
        title: `מסמך: ${insight.name}`,
        content: insight.summary,
        metadata: JSON.stringify({
          categories: insight.categories,
          topics: insight.topics,
          complexity: insight.complexity,
          keyPoints: insight.keyPoints,
        }),
        sources: JSON.stringify([insight.id]),
      }));

      if (insightsToSave.length > 0) {
        await prisma.insight.createMany({ data: insightsToSave });
        console.log(`✅ [Enhanced Drive] Saved ${insightsToSave.length} document insights`);
      }

    } catch (error) {
      console.error('❌ [Enhanced Drive] Failed to save insights:', error);
    }
  }

  // פונקציות עזר פרטיות
  private normalizeDocumentType(mimeType: string): string {
    if (mimeType.includes('document')) return 'מסמך טקסט';
    if (mimeType.includes('spreadsheet')) return 'גיליון אלקטרוני';
    if (mimeType.includes('presentation')) return 'מצגת';
    if (mimeType.includes('pdf')) return 'PDF';
    return 'מסמך';
  }

  private extractBasicTopics(name: string, content: string): string[] {
    const text = (name + ' ' + content.slice(0, 500)).toLowerCase();
    const commonTopics = ['טכנולוגיה', 'עסקים', 'פסיכולוגיה', 'מדעים', 'פיננסים', 'בריאות'];
    
    return commonTopics.filter(topic => 
      text.includes(topic.toLowerCase()) || 
      text.includes(topic) ||
      name.toLowerCase().includes(topic.toLowerCase())
    );
  }

  private guessCategories(name: string, content: string): string[] {
    const text = (name + ' ' + content.slice(0, 300)).toLowerCase();
    const categories = [];
    
    if (text.includes('טכנולוגיה') || text.includes('תכנות') || text.includes('פיתוח')) {
      categories.push('טכנולוגיה');
    }
    if (text.includes('עסק') || text.includes('ניהול') || text.includes('שיווק')) {
      categories.push('עסקים');
    }
    if (text.includes('פסיכולוגיה') || text.includes('התנהגות') || text.includes('רגש')) {
      categories.push('פסיכולוגיה');
    }
    
    return categories.length > 0 ? categories : ['כללי'];
  }

  private detectLanguage(content: string): 'hebrew' | 'english' | 'mixed' {
    const hebrewChars = content.match(/[\u0590-\u05FF]/g);
    const englishChars = content.match(/[a-zA-Z]/g);
    
    const hebrewRatio = hebrewChars ? hebrewChars.length / content.length : 0;
    const englishRatio = englishChars ? englishChars.length / content.length : 0;
    
    if (hebrewRatio > 0.3 && englishRatio > 0.3) return 'mixed';
    if (hebrewRatio > englishRatio) return 'hebrew';
    return 'english';
  }

  private aggregateCategories(insights: DocumentInsight[]): Record<string, number> {
    const categoryCount: Record<string, number> = {};
    insights.forEach(insight => {
      insight.categories.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    return categoryCount;
  }

  private aggregateTopics(insights: DocumentInsight[]): Record<string, number> {
    const topicCount: Record<string, number> = {};
    insights.forEach(insight => {
      insight.topics.forEach(topic => {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      });
    });
    return topicCount;
  }

  private calculateAverageComplexity(insights: DocumentInsight[]): string {
    const complexityScores = insights.map(insight => {
      switch (insight.complexity) {
        case 'simple': return 1;
        case 'medium': return 2;
        case 'complex': return 3;
        default: return 2;
      }
    });
    
    const avgScore = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;
    
    if (avgScore >= 2.5) return 'complex';
    if (avgScore >= 1.5) return 'medium';
    return 'simple';
  }

  private aggregateLanguages(insights: DocumentInsight[]): Record<string, number> {
    const languageCount: Record<string, number> = {};
    insights.forEach(insight => {
      languageCount[insight.language] = (languageCount[insight.language] || 0) + 1;
    });
    return languageCount;
  }

  private aggregateDocumentTypes(insights: DocumentInsight[]): Record<string, number> {
    const typeCount: Record<string, number> = {};
    insights.forEach(insight => {
      typeCount[insight.type] = (typeCount[insight.type] || 0) + 1;
    });
    return typeCount;
  }

  private generateBasicContentMix(insights: DocumentInsight[]): ContentMix {
    const categories = this.aggregateCategories(insights);
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    const topics = this.aggregateTopics(insights);
    const topTopics = Object.entries(topics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    return {
      suggestedTopics: topTopics.length > 0 ? topTopics : ['פיתוח אישי', 'טכנולוגיה', 'פרודוקטיביות'],
      contentStyle: 'mixed',
      targetAudience: 'משתמש עם ידע בתחומים מגוונים',
      expertise_level: this.calculateAverageComplexity(insights) === 'complex' ? 'advanced' : 'intermediate',
      recommended_categories: topCategories.length > 0 ? topCategories : ['כללי', 'טכנולוגיה', 'עסקים'],
    };
  }

  private getDefaultContentMix(): ContentMix {
    return {
      suggestedTopics: ['פיתוח אישי', 'פרודוקטיביות', 'טכנולוגיה', 'עסקים', 'פסיכולוגיה'],
      contentStyle: 'mixed',
      targetAudience: 'משתמש כללי המעוניין בלמידה',
      expertise_level: 'intermediate',
      recommended_categories: ['self-improvement', 'productivity', 'technology'],
    };
  }
}

export const enhancedGoogleDriveService = new EnhancedGoogleDriveService();