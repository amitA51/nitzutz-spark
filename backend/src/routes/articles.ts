import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Search articles
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchTerm = q.trim();
    
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { content: { contains: searchTerm } },
          { excerpt: { contains: searchTerm } },
          { author: { contains: searchTerm } },
        ],
      },
      include: {
        savedArticles: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    const articlesWithSavedStatus = articles.map(article => ({
      ...article,
      isSaved: article.savedArticles.length > 0,
      savedArticles: undefined,
    }));
    
    res.json({
      articles: articlesWithSavedStatus,
      count: articlesWithSavedStatus.length,
      query: searchTerm,
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

// Get articles with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', category } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const where = category ? { category: category as string } : {};
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          savedArticles: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);
    
    const articlesWithSavedStatus = articles.map(article => ({
      ...article,
      isSaved: article.savedArticles.length > 0,
      savedArticles: undefined, // Remove from response
    }));
    
    res.json({
      articles: articlesWithSavedStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get single article
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        savedArticles: {
          select: {
            id: true,
            notes: true,
            tags: true,
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
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const response = {
      ...article,
      isSaved: article.savedArticles.length > 0,
      savedInfo: article.savedArticles[0] || null,
      savedArticles: undefined, // Remove from response
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Create new article (for demo/testing)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      content, 
      author, 
      sourceUrl, 
      category, 
      publishedAt, 
      imageUrl, 
      excerpt,
      readTime 
    } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }
    
    const article = await prisma.article.create({
      data: {
        title,
        content,
        author,
        sourceUrl,
        category,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        imageUrl,
        excerpt,
        readTime,
      },
    });
    
    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Get article categories
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.article.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });
    
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Seed dummy articles for demo
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const dummyArticles = [
      {
        title: 'אפקט דאנינג-קרוגר: למה אנשים לא מודעים לחוסר הידע שלהם?',
        content: 'אפקט דאנינג-קרוגר הוא הטיה קוגניטיבית מרתקת שבה אנשים בעלי יכולת נמוכה במשימה מסוימת נוטים להעריך את יכולתם כגבוהה מהממוצע. התופעה נקראה על שם שני הפסיכולוגים דיוויד דאנינג וג\'סטין קרוגר שגילו אותה במחקר מ-1999.\n\nהמחקר המקורי בדק סטודנטים במגוון מבחנים - הגיון, דקדוק ובדיחות. התוצאות היו עקביות: אלו שציינו בציון הנמוך ביותר (ברבע התחתון) העריכו את ביצועיהם כממוצעים או אפילו מעל הממוצע. הם פשוט לא היו מודעים לכך שהם לא יודעים.\n\nהסיבה המרכזית לתופעה זו היא שהמיומנויות הדרושות כדי להיות טוב במשהו הן אותן מיומנויות הדרושות כדי להעריך עד כמה אתה טוב בזה. כלומר, אם אתה לא מבין נושא, אתה גם לא מבין שאתה לא מבין אותו.\n\nבצד השני של הספקטרום, מומחים אמיתיים נוטים לסבול מ"תסמונת המתחזה" - הם מודעים למורכבות של התחום שלהם ולכן נוטים לחשוב שהם יודעים פחות ממה שהם באמת יודעים.\n\nאז מה אפשר לעשות? ההמלצה העיקרית היא להיות צנוע ותמיד לחפש משוב מאחרים. תמיד לשאול את עצמך "מה אני לא יודע?" ולהיות פתוח ללמידה מתמדת. ברגע שאתה חושב שאתה יודע הכל - זה בדיוק הרגע להתחיל לדאוג.',
        author: 'ד"ר שרה לוי',
        category: 'פסיכולוגיה',
        excerpt: 'למה אנשים שלא יודעים - לא יודעים שהם לא יודעים? הסבר מקיף על אחת ההטיות הקוגניטיביות המפורסמות ביותר.',
        readTime: 7,
      },
      {
        title: 'הנדסה חברתית: הנשק המסוכן ביותר של האקרים',
        content: 'כשחושבים על האקרים, רוב האנשים מדמיינים מישהו יושב מול מחשב ומקליד קוד מסובך. אבל האמת היא שההתקפות המוצלחות ביותר מתבססות על משהו הרבה יותר פשוט - מניפולציה של בני אדם.\n\nהנדסה חברתית היא אמנות השכנוע והמניפולציה הפסיכולוגית של אנשים כדי לגרום להם לחשוף מידע רגיש או לבצע פעולות מסוימות. במקום לפרוץ למערכת באמצעות קוד, האקר "פורץ" לאנשים.\n\nטכניקות נפוצות:\n\n1. **Phishing (פישינג)**: שליחת מיילים מזויפים שנראים לגיטימיים. למשל, מייל שנראה כאילו הגיע מהבנק שלך ומבקש ממך "לאמת" את הפרטים שלך.\n\n2. **Pretexting**: יצירת תסריט מהימן. האקר מתקשר ומתחזה לאיש IT מהחברה שלך, טוען שיש בעיה טכנית ומבקש את הסיסמה שלך "כדי לתקן".\n\n3. **Baiting**: הנחת פיתיון. למשל, השארת דיסק-און-קי עם תווית "משכורות 2024" בחניון של חברה, מתוך ידיעה שמישהו יחבר אותו למחשב מתוך סקרנות.\n\n4. **Tailgating**: מעבר פיזי למקום מוגן על ידי הליכה מאחורי מישהו שיש לו הרשאה.\n\nאז איך מתגוננים?\n- תמיד אמת זהות לפני שמשתפים מידע\n- היה חשדן מבקשות דחופות או מאיימות\n- אל תלחץ על קישורים במיילים חשודים\n- השתמש באימות דו-שלבי בכל מקום שאפשר\n- הכשר את עצמך והאנשים סביבך להכיר בניסיונות מניפולציה\n\nזכור: האיום הגדול ביותר לאבטחת מידע הוא האדם, לא הטכנולוגיה.',
        author: 'עידו כהן',
        category: 'סייבר',
        excerpt: 'התקפות סייבר רבות מתחילות לא במחשב, אלא באדם. הכירו את השיטות והגנו על עצמכם.',
        readTime: 9,
      },
      {
        title: 'ריבית דריבית: הכוח הסמוי שישנה את העתיד הפיננסי שלך',
        content: 'אלברט איינשטיין כינה את ריבית הדריבית "הפלא השמיני בתבל". למרות שהציטוט הזה כנראה אפוקריפי, יש בו הרבה אמת - ריבית דריבית היא אחד הכוחות החזקים ביותר בפיננסים.\n\nאז מה זה בעצם?\n\nריבית דריבית היא ריבית המחושבת הן על הקרן המקורית והן על הריבית שהצטברה בעבר. במילים פשוטות: אתה מרוויח ריבית על הריבית שלך.\n\nדוגמה פשוטה:\nנניח שהשקעת 10,000 ₪ בריבית שנתית של 10%.\n- שנה 1: 10,000 + 1,000 = 11,000 ₪\n- שנה 2: 11,000 + 1,100 = 12,100 ₪ (שים לב: הרווחת 1,100 ₪ ולא 1,000!)\n- שנה 3: 12,100 + 1,210 = 13,310 ₪\n\nאחרי 10 שנים, תקבל כ-25,937 ₪ - יותר מפי 2.5!\nאחרי 30 שנים? כ-174,494 ₪ - פי 17!\n\nכלל 72:\nכדי לחשב כמה זמן ייקח לכסף שלך להכפיל את עצמו, חלק 72 בריבית השנתית.\nלמשל, בריבית של 8% - הכסף יוכפל תוך 9 שנים (72÷8=9).\n\nהצד האפל:\nריבית דריבית עובדת גם נגדך! אם יש לך חוב (כרטיס אשראי, הלוואה), הוא גדל באותה הדרך.\n\nמסקנה:\n1. התחל להשקיע מוקדם ככל האפשר - הזמן הוא הנכס החשוב ביותר\n2. השקע באופן קבוע (גם סכומים קטנים!)\n3. היזהר מחובות עם ריבית גבוהה\n4. תן לזמן לעשות את העבודה - סבלנות משתלמת\n\nהמפתח הוא להתחיל עכשיו. כל שנה שאתה מחכה עולה לך אלפי שקלים בעתיד.',
        author: 'רונית גולן',
        category: 'פיננסים',
        excerpt: 'איך השקעה קטנה היום יכולה להפוך להון עתק בעתיד? המדריך המלא לכוח ריבית הדריבית.',
        readTime: 8,
      },
      {
        title: 'כוחם של הרגלים: איך המוח שלנו יוצר אוטומציות',
        content: 'למה כל בוקר אתה מצחצח שיניים בדיוק באותה דרך? למה אתה נוסע לעבודה באותו מסלול? התשובה: הרגלים.\n\nהרגלים הם הדרך של המוח לחסוך באנרגיה. במקום לחשוב על כל פעולה, המוח יוצר "תסריטים" אוטומטיים שרצים מאליהם. זה נהדר כשמדובר בהרגלים טובים, אבל פחות טוב כשמדובר בהרגלים שליליים.\n\n**לולאת ההרגל:**\n\n1. **רמז (Cue)**: טריגר שמתחיל את ההרגל. למשל, הצלצול של הטלפון.\n\n2. **שגרה (Routine)**: הפעולה עצמה. בדיקת הטלפון.\n\n3. **תגמול (Reward)**: התוצאה החיובית. עדכון חברתי, סיפוק.\n\nהמוח שלנו לומד לקשר בין הרמז לתגמול, והשגרה הופכת אוטומטית.\n\n**איך בונים הרגל טוב:**\n\n1. התחל קטן - רוצה לקרוא יותר? התחל מעמוד אחד ביום\n2. קבע רמז ברור - "אחרי הקפה הבוקר, אני קורא"\n3. הפוך את זה לקל - שים את הספר ליד מכונת הקפה\n4. חגוג זכיות קטנות - כל יום שקראת הוא הצלחה\n5. היה סבלני - לוקח בממוצע 66 יום כדי הרגל יהפוך אוטומטי\n\n**איך שוברים הרגל רע:**\n\nלא אפשר באמת "למחוק" הרגל - המוח שומר את הלולאה. אבל אפשר להחליף את השגרה!\n\nלמשל, אם הרמז הוא "לחץ בעבודה" והשגרה הרעה היא "אכילת חטיפים", אפשר להחליף את השגרה ב"הליכה קצרה" - זה עדיין ייתן תגמול (הפוגה מהלחץ) אבל בצורה בריאה יותר.\n\n**הסוד:** המוח שלנו לא מבחין בין הרגלים טובים לרעים - הוא פשוט מריץ את מה שחזר על עצמו. אז כדאי להשתמש בכוח הזה לטובתנו!',
        author: 'ד"ר יונתן שפירא',
        category: 'פסיכולוגיה',
        excerpt: 'למה כל כך קשה לשנות הרגלים? המדע מאחורי האוטומציות של המוח ומדריך מעשי לשינוי.',
        readTime: 10,
      },
      {
        title: 'Zero Trust: המהפכה באבטחת רשתות ארגוניות',
        content: 'במשך עשרות שנים, אבטחת מידע בארגונים התבססה על מודל "טירה וחפיר": חומה חזקה מבחוץ, ובפנים כולם מהימנים. אבל העולם השתנה.\n\nהעבודה מהבית, המעבר לענן, התקפות מתוחכמות - הכל גרם לתפיסה הישנה להתמוטט. היום, "בפנים" ו"בחוץ" כבר לא קיימים באמת.\n\n**מהו Zero Trust?**\n\nזהו מודל אבטחה שמתבסס על עיקרון פשוט: **לעולם אל תסמוך, תמיד תאמת**.\n\nבמקום להניח שמי שנמצא "בפנים" הרשת הוא מהימן, Zero Trust מתייחס לכל בקשת גישה כמשהו שצריך להוכיח את עצמו - לא משנה מאיפה היא מגיעה.\n\n**עקרונות ליבה:**\n\n1. **Verify Explicitly (אמת מפורשות)**\nאמת כל משתמש, כל התקן, כל הזמן. השתמש בכל המידע הזמין - מיקום, מכשיר, התנהגות, וכו\'.\n\n2. **Least Privilege Access (גישה מינימלית)**\nתן למשתמשים רק את ההרשאות שהם באמת צריכים, רק לזמן שהם צריכים. לא יותר.\n\n3. **Assume Breach (הנח שיש פריצה)**\nתכנן את המערכת כאילו התוקף כבר בפנים. חלק את הרשת לאזורים קטנים, הגבל תנועה, נטר הכל.\n\n**איך זה עובד בפועל?**\n\nנניח שעובד רוצה לגשת לקובץ:\n1. המערכת בודקת את זהותו (אימות רב-שלבי)\n2. בודקת את המכשיר שלו (מעודכן? מוגן?)\n3. מנתחת את ההקשר (זמן? מיקום? התנהגות חריגה?)\n4. נותנת גישה מוגבלת בזמן לקובץ הספציפי הזה בלבד\n5. ממשיכה לנטר את הפעילות\n\n**למה זה חשוב?**\n\nב-2020, 80% מהפריצות היו דרך פשרת אישורים (גניבת סיסמאות). Zero Trust מקטין משמעותית את הנזק שתוקף יכול לעשות גם אם הוא משיג אישורים.\n\n**האתגר:**\nהמעבר ל-Zero Trust הוא תהליך, לא פרויקט חד-פעמי. זה דורש שינוי בתרבות הארגונית, בטכנולוגיה, ובדרך החשיבה על אבטחה.\n\nאבל במציאות המאיימת של היום - אין ממש ברירה אחרת.',
        author: 'אלון בר-דוד',
        category: 'סייבר',
        excerpt: 'מדוע מודל האבטחה המסורתי כבר לא עובד? הכירו את המהפכה שמשנה את דרך החשיבה על הגנת מידע.',
        readTime: 11,
      },
    ];
    
    const created = await prisma.article.createMany({
      data: dummyArticles,
    });
    
    res.json({ message: 'Dummy articles created', count: created.count });
  } catch (error) {
    console.error('Error seeding articles:', error);
    res.status(500).json({ error: 'Failed to seed articles' });
  }
});

export default router;