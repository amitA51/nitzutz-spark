import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import { prisma } from '../db';

interface CacheEntry {
  content: string;
  metadata: {
    personalityMatch: number;
    difficulty: string;
    category: string;
    topics: string[];
    generatedAt: Date;
  };
}

interface ContentRequest {
  userProfile: any;
  topics: string[];
  category: string;
  contentStyle: string;
  readingLevel: string;
}

export class ContentCacheService {
  private cache: LRUCache<string, CacheEntry>;
  private profileCache: LRUCache<string, any>;

  constructor() {
    // Cache for generated content (50 entries, 1 hour TTL)
    this.cache = new LRUCache<string, CacheEntry>({
      max: 50,
      ttl: 1000 * 60 * 60, // 1 hour
    });

    // Cache for user profiles (smaller cache, longer TTL)
    this.profileCache = new LRUCache<string, any>({
      max: 10,
      ttl: 1000 * 60 * 30, // 30 minutes
    });

    console.log('🗄️ [Content Cache] Initialized with smart caching');
  }

  /**
   * יצירת מפתח hash ייחודי לבקשת תוכן
   */
  private createContentKey(request: ContentRequest): string {
    const keyData = {
      topics: request.topics.sort(),
      category: request.category,
      contentStyle: request.contentStyle,
      readingLevel: request.readingLevel,
      topCategories: request.userProfile?.topCategories?.slice(0, 3) || [],
    };

    const keyString = JSON.stringify(keyData);
    return crypto.createHash('md5').update(keyString).digest('hex');
  }

  /**
   * בדיקה אם יש תוכן דומה בcache
   */
  getCachedContent(request: ContentRequest): CacheEntry | null {
    const key = this.createContentKey(request);
    const cached = this.cache.get(key);

    if (cached) {
      console.log(`⚡ [Content Cache] Cache hit for key: ${key.substring(0, 8)}...`);
      return cached;
    }

    console.log(`🔍 [Content Cache] Cache miss for key: ${key.substring(0, 8)}...`);
    return null;
  }

  /**
   * שמירת תוכן שנוצר לcache
   */
  setCachedContent(request: ContentRequest, article: any): void {
    const key = this.createContentKey(request);
    
    const cacheEntry: CacheEntry = {
      content: article.content,
      metadata: {
        personalityMatch: article.personalityMatch || 75,
        difficulty: article.difficulty || request.readingLevel,
        category: article.category || request.category,
        topics: request.topics,
        generatedAt: new Date(),
      },
    };

    this.cache.set(key, cacheEntry);
    console.log(`💾 [Content Cache] Cached content for key: ${key.substring(0, 8)}...`);
  }

  /**
   * שליפה כללית מהמטמון
   */
  get<T = any>(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (cached) {
      return cached as T;
    }
    
    // נסה גם במטמון פרופילים
    const profileCached = this.profileCache.get(key);
    return profileCached as T | undefined;
  }

  /**
   * שמירה כללית במטמון
   */
  set<T = any>(key: string, value: T, ttlMs?: number): void {
    if (key.includes('user_profile')) {
      // שמור במטמון פרופילים
      this.profileCache.set(key, value, ttlMs ? { ttl: ttlMs } : undefined);
    } else {
      // שמור במטמון התוכן הרגיל
      this.cache.set(key, value as any, ttlMs ? { ttl: ttlMs } : undefined);
    }
  }

  /**
   * בדיקה אם ערך קיים במטמון
   */
  has(key: string): boolean {
    if (key.includes('user_profile')) {
      return this.profileCache.has(key);
    } else {
      return this.cache.has(key);
    }
  }

  /**
   * Cache פרופיל המשתמש
   */
  getCachedUserProfile(userId: string = 'default-user'): any | null {
    const cached = this.profileCache.get(userId);
    if (cached) {
      console.log('⚡ [Content Cache] User profile cache hit');
      return cached;
    }
    return null;
  }

  setCachedUserProfile(profile: any, userId: string = 'default-user'): void {
    this.profileCache.set(userId, profile);
    console.log('💾 [Content Cache] Cached user profile');
  }

  /**
   * חיפוש תוכן דומה קיים במסד הנתונים
   */
  async findSimilarContent(request: ContentRequest): Promise<any | null> {
    try {
      // חפש מאמרים דומים שנוצרו לאחרונה
      const similarArticles = await prisma.article.findMany({
        where: {
          category: request.category,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // שבוע אחרון
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (similarArticles.length === 0) {
        return null;
      }

      // בדוק אם יש מאמר עם נושאים דומים
      for (const article of similarArticles) {
        const titleWords = article.title.toLowerCase().split(' ');
        const topicMatch = request.topics.some(topic => 
          titleWords.some(word => word.includes(topic.toLowerCase()) || topic.toLowerCase().includes(word))
        );

        if (topicMatch) {
          console.log(`🔄 [Content Cache] Found similar content: "${article.title.substring(0, 50)}..."`);
          return {
            ...article,
            personalityMatch: 85, // ציון מעט נמוך כי זה תוכן מחדש
            isReused: true,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ [Content Cache] Error searching for similar content:', error);
      return null;
    }
  }

  /**
   * נקה cache ישן
   */
  async cleanup(): Promise<void> {
    const beforeSize = this.cache.size;
    this.cache.clear();
    this.profileCache.clear();
    
    console.log(`🧹 [Content Cache] Cleaned cache (was ${beforeSize} entries)`);
  }

  /**
   * סטטיסטיקות cache
   */
  getStats(): any {
    return {
      contentCache: {
        size: this.cache.size,
        maxSize: this.cache.max,
      },
      profileCache: {
        size: this.profileCache.size,
        maxSize: this.profileCache.max,
      },
    };
  }

  /**
   * יצירת warmed cache - טען תוכן פופולרי מראש
   */
  async warmCache(): Promise<void> {
    console.log('🔥 [Content Cache] Starting cache warm-up...');
    
    try {
      // קבל קטגוריות פופולריות
      const popularCategories = await prisma.article.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
        take: 5,
      });

      // קבל פרופיל משתמש ושמור בcache
      const userProfile = await prisma.userActivity.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      });

      if (userProfile.length > 0) {
        // שמור נתונים בסיסיים בcache
        this.setCachedUserProfile({
          lastActive: new Date(),
          topCategories: popularCategories.map(c => ({ category: c.category, score: c._count.category / 100 })),
        });
      }

      console.log(`✅ [Content Cache] Warmed cache with ${popularCategories.length} popular categories`);
    } catch (error) {
      console.error('❌ [Content Cache] Cache warm-up failed:', error);
    }
  }
}

// Export singleton instance
export const contentCache = new ContentCacheService();

// Auto warm-up cache on startup (development only)
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    contentCache.warmCache();
  }, 5000); // 5 seconds after startup
}