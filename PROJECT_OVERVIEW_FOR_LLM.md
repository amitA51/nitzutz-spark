# 🌟 ניצוץ (Spark) - סקירת פרוייקט מקיפה

## 📋 תקציר מנהלים

**ניצוץ (Spark)** היא מערכת AI אישית מתקדמת ללמידה, התפתחות וניהול ידע. הפרוייקט משלב טכנולוגיות מודרניות ליצירת חוויה אישית וחכמה שלומדת את המשתמש ומתאימה עצמה להעדפותיו.

**סטטוס:** פרוייקט אישי פעיל ב-development
**טכנולוגיות ליבה:** TypeScript, React, Node.js, PostgreSQL, AI APIs
**תחום:** Personal Knowledge Management + AI-Powered Learning

---

## 🎯 החזון והמטרה

### הבעיה שנפתרת
אנשים שרוצים ללמוד ולהתפתח נתקלים במכשולים:
- **עומס מידע** - קשה לארגן ולנהל מידע מספרים, מאמרים ומקורות שונים
- **חוסר התאמה אישית** - כלים כלליים שלא מכירים את המשתמש
- **למידה פאסיבית** - קשה לזכור ולהטמיע את מה שנלמד
- **חוסר תובנות** - קשה לראות קשרים בין רעיונות שונים

### הפתרון של ניצוץ
מערכת AI אישית שמשמשת כ**מנטור דיגיטלי**:
- 📚 **ניהול ספרייה חכם** - ניהול ספרים, מאמרים וסיכומים במקום אחד
- 🤖 **עוזר AI אינטליגנטי** - שאלות ותשובות על התכנים, חילוץ נקודות מפתח
- 🧠 **מנטור פרואקטיבי** - המערכת מייצרת תובנות שבועיות, מזהה קשרים, ונותנת המלצות
- 🔄 **למידה מרווחת** - תזכורות אוטומטיות לחזרה על תכנים חשובים
- 💡 **התאמה אישית מלאה** - המערכת לומדת את הפרופיל ומתאימה תכנים

**הייחודיות:** בניגוד לכלים פאסיביים, ניצוץ **עובד בשבילך** - מנתח, מחבר, ממליץ ומזכיר.

---

## 🏗️ ארכיטקטורה טכנית

### סקירה כללית
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Discovery │  │ Library  │  │  Mentor  │  │ Settings │   │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         ↓              ↓              ↓              ↓       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           React Router + State Management           │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ API Calls (Axios)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    REST API Routes                    │  │
│  │  /articles  /books  /ai  /insights  /google-drive   │  │
│  └──────────────────────────────────────────────────────┘  │
│         ↓                           ↓                        │
│  ┌─────────────┐           ┌──────────────────┐            │
│  │  Services   │           │  Background Jobs │            │
│  │  Layer      │           │  (Cron Scheduler)│            │
│  └─────────────┘           └──────────────────┘            │
│         ↓                           ↓                        │
│  ┌──────────────────────────────────────────────┐          │
│  │      Prisma ORM (Database Abstraction)       │          │
│  └──────────────────────────────────────────────┘          │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
                  ┌──────────────────┐
                  │   PostgreSQL DB  │
                  └──────────────────┘
                           
         External APIs:
    ┌─────────────────────────┐
    │ AI APIs (DeepSeek/GPT)  │
    │ Google Drive API        │
    └─────────────────────────┘
```

### Stack טכנולוגי מפורט

#### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite (מהיר ומודרני)
- **Routing:** React Router v7
- **State Management:** TanStack React Query (caching + server state)
- **Styling:** Tailwind CSS + Custom gradients (כחול-סגול)
- **Animations:** Framer Motion (אנימציות חלקות)
- **Typography:** Inter (UI) + IBM Plex Serif (תוכן)
- **Rich Text:** Rich Text Editor לסיכומים
- **HTTP Client:** Axios

**מבנה קבצים:**
```
frontend/src/
├── pages/          # דפים עיקריים
│   ├── DiscoveryPage.tsx
│   ├── LibraryPage.tsx
│   ├── MentorPage.tsx
│   └── SettingsPage.tsx
├── components/     # קומפוננטות לשימוש חוזר
│   ├── GooeyNav.tsx
│   ├── ArticleCard.tsx
│   ├── AIContentGenerator.tsx
│   └── ...
├── api/           # API clients
│   ├── articles.ts
│   ├── books.ts
│   ├── insights.ts
│   └── index.ts
├── hooks/         # Custom hooks
└── utils/         # Utility functions
```

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js + TypeScript
- **ORM:** Prisma (type-safe database access)
- **Database:** PostgreSQL
- **Authentication:** Google OAuth 2.0 (לGoogle Drive)
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Morgan
- **Background Jobs:** node-cron (משימות מתוזמנות)
- **AI Integration:** OpenAI SDK (תומך בproviders שונים)

**מבנה קבצים:**
```
backend/src/
├── routes/              # API endpoints
│   ├── articles.ts      # ניהול מאמרים
│   ├── books.ts         # ניהול ספרים
│   ├── ai.ts            # שאלות ותשובות AI
│   ├── insights.ts      # תובנות מנטור
│   ├── googleDrive.ts   # אינטגרציה עם Drive
│   └── ...
├── services/            # Business logic
│   ├── aiClient.ts      # חיבור ל-AI APIs
│   ├── mentorService.ts # מנוע התובנות
│   ├── activityTracker.ts # מעקב פעילות
│   ├── preferenceAnalyzer.ts # ניתוח העדפות
│   ├── contentCache.ts  # מטמון תוכן
│   └── ...
├── jobs/                # Background jobs
│   ├── mentorJob.ts     # תובנות שבועיות
│   └── smartScheduler.ts # תזמון חכם
├── prisma/              # Database
│   └── schema.prisma    # סכמת DB
└── server.ts            # Entry point
```

---

## 💾 מודל הנתונים (Database Schema)

### טבלאות עיקריות

#### 1. **Book** - ספרים
```prisma
model Book {
  id          String    @id @default(cuid())
  bookTitle   String
  currentPage Int       @default(0)
  totalPages  Int?
  author      String?
  isbn        String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  summaries   Summary[]
}
```
**מטרה:** ניהול ספרים עם מעקב אחר התקדמות (עמוד נוכחי מול סה"כ).

#### 2. **Summary** - סיכומי פרקים
```prisma
model Summary {
  id            String   @id @default(cuid())
  bookId        String
  content       String   // Rich text HTML
  chapterNumber Int?
  chapterTitle  String?
  pageRange     String?  // "20-45"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  book          Book     @relation(...)
}
```
**מטרה:** סיכומים מפורטים לפי פרקים + עורך Rich Text.

#### 3. **Article** - מאמרים
```prisma
model Article {
  id            String          @id @default(cuid())
  title         String
  content       String          // תוכן מלא
  author        String?
  sourceUrl     String?
  category      String          // technology, psychology, productivity...
  publishedAt   DateTime?
  imageUrl      String?
  excerpt       String?         // תקציר קצר
  readTime      Int?            // דקות קריאה משוערות
  createdAt     DateTime        @default(now())
  savedArticles SavedArticle[]
  aiQuestions   AiQuestion[]
}
```
**מטרה:** מאגר מאמרים לקריאה וחקירה.

#### 4. **SavedArticle** - מאמרים שמורים
```prisma
model SavedArticle {
  id                String              @id @default(cuid())
  articleId         String              @unique
  notes             String?             // הערות אישיות
  tags              String?             // תגיות מופרדות בפסיק
  savedAt           DateTime            @default(now())
  article           Article             @relation(...)
  spacedRepetitions SpacedRepetition[]
}
```
**מטרה:** שמירת מאמרים מעניינים עם הערות ותגיות.

#### 5. **SpacedRepetition** - חזרה מרווחת
```prisma
model SpacedRepetition {
  id              String        @id @default(cuid())
  savedArticleId  String
  scheduledFor    DateTime      // מתי להציג תזכורת
  completed       Boolean       @default(false)
  completedAt     DateTime?
  interval        Int           // 3, 7, 30 ימים...
  keyPoints       String        // JSON array
  createdAt       DateTime      @default(now())
  savedArticle    SavedArticle  @relation(...)
}
```
**מטרה:** תזכורות אוטומטיות לחזור על תכנים (אלגוריתם Spaced Repetition).

#### 6. **AiQuestion** - שאלות ותשובות AI
```prisma
model AiQuestion {
  id         String   @id @default(cuid())
  articleId  String
  question   String   // השאלה של המשתמש
  answer     String   // התשובה מה-AI
  context    String?  // קטע רלוונטי מהמאמר
  createdAt  DateTime @default(now())
  article    Article  @relation(...)
}
```
**מטרה:** היסטוריית שיחות עם ה-AI על מאמרים.

#### 7. **Insight** - תובנות מנטור
```prisma
model Insight {
  id        String   @id @default(cuid())
  type      String   // weekly_summary, connection, recommendation, question
  title     String
  content   String
  metadata  String?  // JSON - מידע נוסף
  sources   String   // JSON - IDs של מקורות
  createdAt DateTime @default(now())
  viewed    Boolean  @default(false)
  dismissed Boolean  @default(false)
}
```
**מטרה:** תובנות שנוצרות אוטומטית על ידי המנטור.

#### 8. **UserActivity** - פעילות משתמש
```prisma
model UserActivity {
  id         String   @id @default(cuid())
  action     String   // article_read, article_saved, book_started...
  targetType String   // article, book, summary
  targetId   String
  metadata   String?  // JSON
  createdAt  DateTime @default(now())
}
```
**מטרה:** מעקב אחר כל פעולה למטרות אנליטיקה ויצירת תובנות.

#### 9. **UserSettings** - הגדרות משתמש
```prisma
model UserSettings {
  id              String   @id @default(cuid())
  aiApiKey        String?  // מוצפן
  aiProvider      String   @default("openai")
  googleDriveAuth String?  // OAuth tokens מוצפנים
  theme           String   @default("dark")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```
**מטרה:** הגדרות אישיות (כרגע single-user app).

#### 10. **ConceptMention** - מעקב מושגים
```prisma
model ConceptMention {
  id         String   @id @default(cuid())
  concept    String   // "cognitive dissonance"
  articleId  String?
  bookId     String?
  context    String?  // טקסט מסביב
  createdAt  DateTime @default(now())
}
```
**מטרה:** בניית גרף ידע - מעקב אחר מושגים חשובים שחוזרים.

---

## 🔥 תכונות עיקריות (Features)

### 1. 📚 ספרייה אישית (Personal Library)
**מה זה:** מערכת מלאה לניהול ספרים וסיכומים.

**יכולות:**
- הוספת ספרים עם מטאדאטה (כותרת, מחבר, ISBN, מס' עמודים)
- מעקב אחר התקדמות (עמוד נוכחי)
- יצירת סיכומים מפורטים לפי פרקים
- עורך Rich Text לסיכומים (bold, italic, lists, headers)
- ארגון לפי פרקים עם טווח עמודים
- חיפוש ופילטור

**Flow משתמש:**
1. המשתמש מוסיף ספר חדש
2. בזמן הקריאה, יוצר סיכום לכל פרק
3. המערכת מעקבת אחר ההתקדמות
4. ניתן לחזור לסיכומים בכל עת

**UI:** 
- Grid של כרטיסי ספרים עם progress bars
- מודל לעריכת סיכומים עם RTE
- Animations חלקות (Framer Motion)

---

### 2. 🔍 מנוע גילויים (Discovery Engine)
**מה זה:** פיד של מאמרים לקריאה והעשרה.

**יכולות:**
- גלישה במאמרים אחד אחרי אחד (carousel)
- פילטור לפי קטגוריות
- שמירת מאמרים מעניינים
- חיפוש במאמרים
- תצוגת excerpt + זמן קריאה משוער
- טעינה lazy (pagination)

**קטגוריות נתמכות:**
- Technology
- Psychology
- Productivity
- Philosophy
- Health & Wellness
- Science
- Business & Economics

**Flow משתמש:**
1. המשתמש גולש במאמרים
2. קורא מאמר מעניין
3. שומר אותו לספרייה האישית
4. יכול להוסיף הערות ותגיות

**UI:**
- כרטיסים מונפשים
- כפתורי Previous/Next
- סרגל קטגוריות מסונן

---

### 3. 🤖 עוזר AI אינטראקטיבי
**מה זה:** שיחה עם AI על כל מאמר או ספר.

**יכולות:**
- **שאל שאלות** - שאל כל שאלה על מאמר
- **חילוץ נקודות מפתח** - AI מזהה את הנקודות החשובות
- **דוגמאות נוספות** - בקש דוגמאות להמחשה
- **עומק נוסף** - הרחב על נושא ספציפי
- **Devil's Advocate Mode** - ביקורת ושאלות מאתגרות

**טכנולוגיה:**
- תמיכה במספר AI providers:
  - OpenAI (GPT-4, GPT-4o-mini)
  - HuggingFace Router (DeepSeek, Llama)
  - כל API תואם OpenAI
- Context-aware: ה-AI מקבל את תוכן המאמר כקונטקסט
- שמירת היסטוריה של שאלות ותשובות

**Flow משתמש:**
1. המשתמש קורא מאמר
2. לוחץ על "שאל את ה-AI"
3. כותב שאלה
4. מקבל תשובה מותאמת
5. יכול לשאול המשך שאלות

**דוגמאות לשאלות:**
- "מה הנקודות המרכזיות במאמר?"
- "תן לי דוגמה מהחיים האמיתיים"
- "איך אני יכול ליישם את זה?"
- "מה הביקורת על הגישה הזו?"

---

### 4. 🧠 המנטור האישי (AI Mentor)
**מה זה:** מערכת פרואקטיבית שמייצרת תובנות אוטומטיות.

**איך זה עובד:**
1. **מעקב פעילות** - המערכת רושמת כל פעולה (קריאה, שמירה, שאלות)
2. **ניתוח שבועי** - כל שבוע, ה-AI מנתח את הפעילות
3. **יצירת תובנות** - המערכת מייצרת:
   - **תקציר שבועי** - "השבוע התמקדת בפסיכולוגיה קוגניטיבית..."
   - **קשרים מפתיעים** - "יש קשר מעניין בין המאמר על X למאמר על Y"
   - **המלצות** - "בהתבסס על מה שקראת, מומלץ לקרוא על Z"
   - **שאלות למחשבה** - "איך אתה יכול ליישם את העיקרון הזה בחיים שלך?"

**התאמה אישית:**
המנטור לומד את הפרופיל שלך:
- רמת קריאה (מתחיל/בינוני/מתקדם)
- סגנון תוכן (מעשי/תיאורטי/מעורב)
- תחומי עניין מובילים
- דפוסי אינטראקציה (זמן קריאה, תדירות שמירה)
- סוגי שאלות שאתה שואל

**דוגמה לתובנה:**
```
📊 תקציר השבוע:
"השבוע קראת 5 מאמרים על פסיכולוגיה קוגניטיבית וניהול זמן. 
יש דגש מעניין על הקשר בין תשומת לב לפרודוקטיביות."

🔗 חיבור מעניין:
"המאמר על 'זיכרון עבודה' מתחבר למה שקראת על 'Deep Work' - 
שניהם מדברים על מגבלת תשומת הלב והצורך במיקוד."

💡 המלצה:
"בהתבסס על העניין שלך במחקר + הסגנון המעשי, מומלץ לקרוא 
על יישומים פרקטיים של זיכרון עבודה בלמידה."

🤔 שאלה למחשבה:
"איך אתה יכול לשלב את העקרונות של Deep Work עם הבנת 
מגבלות זיכרון העבודה בעבודה היומיומית שלך?"
```

**Cron Job:**
- רץ אוטומטית כל יום ראשון ב-8:00 בבוקר
- ניתן להריץ ידנית דרך API
- מייצר תובנות רק אם יש פעילות

**UI:**
- עמוד מיוחד `/mentor`
- Badge על הניווט עם מספר תובנות חדשות
- כרטיסים מונפשים לכל תובנה
- אפשרות לסגור או לשמור תובנות

---

### 5. 🔄 חזרה מרווחת (Spaced Repetition)
**מה זה:** תזכורות אוטומטיות לחזור על תכנים חשובים.

**איך זה עובד:**
1. משתמש שומר מאמר חשוב
2. המערכת יוצרת לוח תזמון: 3 ימים → 7 ימים → 30 ימים
3. במועד, מופיעה תזכורת עם נקודות המפתח
4. משתמש סוקר ומסמן כהושלם
5. תזכורת הבאה נקבעת אוטומטית

**הבסיס המדעי:**
מבוסס על עקרון ה-Spaced Repetition - חזרה במרווחים גדלים משפרת זכירה לטווח ארוך.

**UI:**
- התראות פופאפ
- Badge על מאמרים שמחכים לחזרה
- עמוד ייעודי לניהול חזרות

---

### 6. ☁️ אינטגרציה עם Google Drive
**מה זה:** ניתוח חכם של המסמכים האישיים שלך.

**יכולות:**
- **התחברות OAuth** - חיבור בטוח ל-Google Drive
- **ניתוח מסמכים** - AI מנתח מסמכים ומזהה:
  - קטגוריות (פסיכולוגיה, טכנולוגיה...)
  - נושאים עיקריים
  - רמת מורכבות
  - סגנון כתיבה
- **תובנות אישיות** - "המסמכים שלך מראים מומחיות בפסיכולוגיה קוגניטיבית"
- **המלצות מותאמות** - יצירת תוכן מבוסס על המסמכים שלך

**שימוש:**
- המערכת משתמשת בניתוח Drive כדי לייצר תוכן מותאם יותר
- המנטור מתייחס לידע המקצועי שלך
- ניתן לייבא סיכומים מ-Docs ישירות

**אבטחה:**
- OAuth 2.0 tokens מוצפנים
- גישה לקריאה בלבד
- ניתן לנתק בכל עת

---

### 7. 🎨 ייצור תוכן חכם (Smart Content Generation)
**מה זה:** יצירת מאמרים מותאמים אישית באמצעות AI.

**איך זה עובד:**
1. **ניתוח פרופיל** - המערכת מנתחת את ההעדפות שלך
2. **תכנון תוכן** - יצירת תכנית מאמרים מותאמת
3. **כתיבה חכמה** - AI כותב מאמרים ברמה ובסגנון המתאימים
4. **ציון התאמה** - כל מאמר מקבל ציון 0-100 עד כמה הוא מתאים לך

**מצבי יצירה:**
- **מצב חכם** (Smart Mode) - התאמה אישית מלאה
- **מצב רגיל** - מאמרים כלליים
- **מצב מותאם Drive** - מבוסס על המסמכים שלך

**דוגמה:**
משתמש שרמתו "intermediate", סגנונו "practical", ותחום העניין "פסיכולוגיה":
→ AI יוצר מאמר: "יישומים מעשיים של פסיכולוגיה קוגניטיבית ברמה בינונית"
→ ציון התאמה: 92/100

**אוטומציה:**
- תוכן חדש נוצר אוטומטית כל יום ב-8:00
- בימי ב', ד', ו' - 4 מאמרים נוספים
- ניתן להפעיל ידנית דרך כפתור צף

---

### 8. 📊 מערכת אנליטיקה ותובנות
**מה זה:** מעקב ואנליזה של הרגלי הלמידה שלך.

**מדדים:**
- כמות ספרים/מאמרים שנקראו
- תדירות פעילות
- תחומי עניין מובילים
- זמן קריאה ממוצע
- שיעור שמירה (אילו מאמרים נשמרים)
- סוגי שאלות שנשאלו

**שימוש במידע:**
- המנטור משתמש באנליטיקה ליצירת תובנות
- המלצות מבוססות-data
- זיהוי דפוסים והרגלים

---

## 🎨 עיצוב וחוויית משתמש (UX/UI)

### עקרונות עיצוב
1. **מינימליזם** - ממשק נקי וממוקד
2. **Dark Mode** - נעים לעיניים, מתאים ללמידה
3. **Gradient Accents** - כחול-סגול למיתוג
4. **Animations** - מעברים חלקים עם Framer Motion
5. **Typography** - פונטים קריאים (Inter + IBM Plex Serif)

### Responsive Design
- **Desktop** - layout מרווח עם sidebar
- **Tablet** - התאמה לרוחב בינוני
- **Mobile** - תפריט דלת, כרטיסים מלאים

### אלמנטים ייחודיים
- **Gooey Navigation** - תפריט מונפש במעברים נוזליים
- **Glass Morphism** - אפקטים של זכוכית שקופה
- **Gradient Cards** - כרטיסים עם גרדיאנטים דינמיים
- **Loading States** - אנימציות טעינה מעוצבות

### נגישות
- כיווניות RTL מלאה (עברית)
- תמיכה בקיצורי מקלדת
- ARIA labels
- ניגודיות צבעים גבוהה

---

## 🔐 אבטחה ופרטיות

### אמצעי אבטחה
1. **Encryption** - API keys מוצפנים ב-DB
2. **CORS** - הגבלת origins מורשים
3. **Rate Limiting** - הגנה מפני abuse
4. **Helmet** - Security headers
5. **Input Validation** - בדיקת input מהמשתמש
6. **SQL Injection Protection** - Prisma מגן אוטומטית

### פרטיות
- **Single User App** - מיועד למשתמש יחיד
- **Local Storage** - כל הנתונים ב-DB פרטי
- **No Analytics** - אין מעקב צד שלישי
- **Google OAuth** - גישה לקריאה בלבד
- **AI Privacy** - ה-AI לא שומר היסטוריה

---

## 🚀 Deployment וסביבת הפקה

### סביבות
1. **Development** - `npm run dev` (local)
2. **Production** - Deployed on:
   - **Backend:** Railway
   - **Frontend:** Netlify
   - **Database:** Railway PostgreSQL

### משתני סביבה (Environment Variables)

**Backend (.env):**
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.netlify.app

# CORS
CORS_ALLOWED_ORIGINS=.netlify.app,.railway.app

# AI Configuration
AI_API_KEY=your_api_key
AI_BASE_URL=https://router.huggingface.co/v1
AI_MODEL=deepseek-ai/DeepSeek-V3.2-Exp:novita
AI_RATE_WINDOW_MS=60000
AI_RATE_MAX=30

# Google Drive OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://backend.railway.app/api/google-drive/auth/callback

# Security
SECRET_KEY=your-32-byte-encryption-key
SEED_TOKEN=your-seed-protection-token
```

**Frontend (.env):**
```env
VITE_API_URL=https://your-backend.railway.app/api
```

### תהליך Deployment

**Backend (Railway):**
1. Push to GitHub
2. Railway auto-deploys
3. Runs: `npm run build` → `npm run start`
4. Migrations: `prisma migrate deploy`

**Frontend (Netlify):**
1. Push to GitHub
2. Netlify auto-builds
3. Runs: `npm run build`
4. Serves from `dist/`

---

## 🔄 Background Jobs (משימות רקע)

### Smart Scheduler
מתזמן חכם שמריץ משימות אוטומטיות:

1. **יומי - 8:00**
   - יצירת תוכן חכם מותאם אישית
   - בדיקה אם יש פעילות → יצירת 2-3 מאמרים

2. **שבועי - ראשון 21:00**
   - יצירת תובנות מנטור
   - ניתוח הפעילות השבועית
   - שליחת תקציר

3. **יומי - 2:00**
   - ניקוי נתונים ישנים
   - ארכוב logs
   - אופטימיזציה של cache

4. **פרסבוסט - ב', ד', ו' 10:00**
   - יצירת 4 מאמרים חכמים נוספים
   - איזון תחומי עניין

### מנגנון הפעלה
```typescript
// התחלה אוטומטית בשרת
startMentorCron();
smartScheduler.start();

// הרצה ידנית דרך API
POST /api/insights/generate
POST /api/ai-content/generate-daily
```

---

## 📡 API Documentation (עיקרי)

### Articles
```http
GET    /api/articles              # רשימת מאמרים (pagination)
GET    /api/articles/:id          # מאמר בודד
POST   /api/articles              # יצירת מאמר
GET    /api/articles/categories/list  # רשימת קטגוריות
GET    /api/articles/search?q=... # חיפוש
POST   /api/articles/seed         # seed דמו מאמרים
```

### Books
```http
GET    /api/books           # רשימת ספרים
GET    /api/books/:id       # ספר בודד
POST   /api/books           # הוספת ספר
PUT    /api/books/:id       # עדכון ספר
DELETE /api/books/:id       # מחיקת ספר
```

### Summaries
```http
GET    /api/summaries/book/:bookId  # סיכומים לספר
POST   /api/summaries               # יצירת סיכום
PUT    /api/summaries/:id           # עדכון סיכום
DELETE /api/summaries/:id           # מחיקת סיכום
```

### AI Assistant
```http
POST   /api/ai/ask                      # שאל שאלה
GET    /api/ai/questions/:articleId     # היסטוריה
POST   /api/ai/extract-key-points       # נקודות מפתח
POST   /api/ai/test-connection          # בדיקת חיבור
```

### Insights (Mentor)
```http
GET    /api/insights              # קבל תובנות
PUT    /api/insights/:id/view     # סמן כנצפה
DELETE /api/insights/:id          # dismiss תובנה
POST   /api/insights/generate     # הרץ מנטור ידנית
```

### Smart Content Generation
```http
POST   /api/ai-content/generate-smart          # יצירת תוכן חכם
GET    /api/ai-content/user-profile            # פרופיל משתמש
POST   /api/ai-content/generate-mentor-insights # תובנות מנטור
POST   /api/ai-content/analyze-drive-advanced  # ניתוח Drive
POST   /api/ai-content/generate-daily          # יצירה יומית
```

### Google Drive
```http
GET    /api/google-drive/auth              # התחברות OAuth
GET    /api/google-drive/auth/callback     # OAuth callback
GET    /api/google-drive/status            # סטטוס חיבור
POST   /api/google-drive/analyze           # ניתוח מסמכים
GET    /api/google-drive/disconnect        # ניתוק
```

### Saved Articles
```http
GET    /api/saved-articles                # מאמרים שמורים
POST   /api/saved-articles                # שמור מאמר
PUT    /api/saved-articles/:articleId     # עדכן
DELETE /api/saved-articles/:articleId     # מחק
```

### Spaced Repetition
```http
GET    /api/spaced-repetition/due          # תזכורות ממתינות
POST   /api/spaced-repetition/complete/:id # סמן כהושלם
POST   /api/spaced-repetition/schedule     # קבע תזכורת חדשה
```

### Settings
```http
GET    /api/settings           # קבל הגדרות
PUT    /api/settings           # עדכן הגדרות
DELETE /api/settings/ai-key    # נקה AI key
```

### Health & Export
```http
GET    /api/health             # בדיקת תקינות
GET    /api/export/all         # ייצוא כל הנתונים (JSON)
```

---

## 🧪 תהליך הפיתוח

### Development Workflow
```bash
# 1. התקנת dependencies
npm install  # בשני התיקיות (backend + frontend)

# 2. הגדרת .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. הרצת DB migrations
cd backend
npx prisma migrate dev
npx prisma generate

# 4. הרצת servers
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# 5. גישה לאפליקציה
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

### פקודות שימושיות
```bash
# Backend
npm run dev              # dev mode עם hot reload
npm run build            # build TypeScript
npm start                # production mode
npm run prisma:studio    # GUI למסד נתונים
npm run prisma:migrate   # הרצת migrations
npm run smoke            # smoke tests

# Frontend
npm run dev              # dev mode
npm run build            # production build
npm run preview          # תצוגה מקדימה של build
npm run lint             # ESLint
```

### Database Management
```bash
# יצירת migration חדש
npx prisma migrate dev --name description

# Reset DB (מחיקה + migrations + seed)
npx prisma migrate reset

# עדכון Prisma Client
npx prisma generate

# פתיחת Prisma Studio (GUI)
npx prisma studio
```

---

## 🎯 Use Cases (תרחישי שימוש)

### תרחיש 1: קורא חדש
```
1. משתמש נכנס לאפליקציה
2. גולש במנוע הגילויים
3. קורא מאמר מעניין על פסיכולוגיה
4. שואל את ה-AI: "תן לי דוגמה מהחיים"
5. שומר את המאמר עם הערה אישית
6. מוסיף תג: "פסיכולוגיה-למידה"
```

### תרחיש 2: לומד סדרתי
```
1. משתמש מוסיף ספר חדש: "Atomic Habits"
2. בזמן הקריאה, מוסיף סיכום לכל פרק
3. משתמש ב-Rich Text Editor להדגשות
4. מעדכן את העמוד הנוכחי
5. רואה progress bar עולה
6. בסוף - ספר מושלם עם סיכומים מפורטים
```

### תרחיש 3: מקבל תובנות
```
1. משתמש פעיל במשך שבוע
2. קרא 5 מאמרים על פסיכולוגיה + פרודוקטיביות
3. יום ראשון בבוקר - המנטור רץ אוטומטית
4. משתמש רואה badge על "המנטור" (3 תובנות חדשות)
5. נכנס לעמוד המנטור
6. קורא:
   - תקציר שבועי
   - קשר מפתיע בין 2 מאמרים
   - המלצה למה לקרוא הבא
   - שאלה עמוקה למחשבה
7. מרגיש מוטיבציה להמשיך
```

### תרחיש 4: משתמש מתקדם
```
1. משתמש מחבר את Google Drive
2. המערכת מנתחת 15 מסמכים מהעבר
3. מזהה: "אתה מומחה בפסיכולוגיה קוגניטיבית"
4. מפעיל את מצב ייצור התוכן החכם
5. המערכת יוצרת 3 מאמרים מותאמים:
   - רמה: מתקדם
   - סגנון: מעורב (תיאוריה + פרקטיקה)
   - תחום: פסיכולוגיה קוגניטיבית ויישומיה
   - ציון התאמה: 95/100
6. משתמש קורא, שומר, שואל שאלות
7. למחרת - עוד תוכן מותאם מופיע אוטומטית
```

### תרחיש 5: חזרה מרווחת
```
1. משתמש שמר מאמר חשוב לפני 3 ימים
2. היום - תזכורת מופיעה: "זמן לחזור על המאמר!"
3. לוחץ על התזכורת
4. רואה את נקודות המפתח שה-AI חילץ
5. סוקר מהר (2 דקות)
6. לוחץ "השלמתי"
7. התזכורת הבאה מתוזמנת ל-7 ימים קדימה
```

---

## 💡 Innovation Points (נקודות חדשניות)

### מה עושה את ניצוץ שונה?

1. **פרואקטיבי, לא פאסיבי**
   - רוב האפליקציות מחכות שתפעיל אותן
   - ניצוץ עובד בשבילך ברקע - מנתח, מחבר, ממליץ

2. **מותאם אישית 100%**
   - לומד את הפרופיל שלך (רמה, סגנון, תחומי עניין)
   - כל תוכן שנוצר מותאם במיוחד עבורך
   - משתפר עם כל אינטראקציה

3. **חיבור בין מקורות**
   - לא רק אוסף של ספרים/מאמרים
   - המערכת מזהה קשרים בין רעיונות שונים
   - "מפת ידע" שגדלה עם הזמן

4. **AI כמנטור, לא כעורך**
   - לא רק "שאל שאלה וקבל תשובה"
   - המערכת יוזמת שיחה, שואלת שאלות, מעודדת

5. **למידה מבוססת-מדע**
   - Spaced Repetition למען זכירה לטווח ארוך
   - Active Recall דרך שאלות
   - Interleaving דרך ערבוב תחומים

6. **אינטגרציה מלאה**
   - מחבר בין Google Drive לתוכן שלך
   - משתמש בידע המקצועי שלך ליצירת תוכן
   - אקוסיסטם אחד

---

## 📊 מדדי הצלחה (Success Metrics)

### KPIs טכניים
- Uptime: 99.9%
- Response Time: <200ms (median)
- AI API Cost: <$10/month
- Database Size: סקיילבילי

### KPIs חוויית משתמש
- Time on App: ממוצע של 15-20 דקות ליום
- Retention: חזרה לפחות 3 פעמים בשבוע
- Engagement: לפחות שאלת AI אחת ליום
- Content Generated: 10-15 מאמרים מותאמים בשבוע

### איכות תוכן
- Personality Match Score: >80/100
- User Saves Rate: >30% מהמאמרים
- AI Answer Quality: high relevance

---

## 🛣️ Roadmap (תכנית עתידית)

### V2 (קצר טווח)
- [ ] מערכת יעדים (Goals System)
- [ ] יומן רפלקציה יומי
- [ ] מפת קשרים ויזואלית (Concept Network)
- [ ] צ'אט חופשי עם המנטור
- [ ] הישגים + Gamification
- [ ] תוכנית למידה שבועית אישית

### V3 (בינוני טווח)
- [ ] סנכרון בין מכשירים
- [ ] אפליקציית מובייל (React Native)
- [ ] שיתוף תובנות עם קהילה
- [ ] Podcast Summarization
- [ ] Video Summarization (YouTube)
- [ ] Export ל-Notion/Obsidian

### V4 (ארוך טווח)
- [ ] Multi-user support
- [ ] Collaborative learning
- [ ] קהילות לפי תחומי עניין
- [ ] Marketplace לתוכן
- [ ] AI Voice Assistant
- [ ] AR/VR integration

---

## 🐛 בעיות ידועות ופתרונות

### בעיה: AI API יקר
**פתרון:** 
- שימוש ב-DeepSeek (~$1/million tokens)
- Caching של תשובות נפוצות
- Adaptive Model Selection (מודל קל למשימות פשוטות)

### בעיה: התאמה אישית לוקחת זמן
**פתרון:**
- Cold start: שאלון ראשוני
- Gradual learning מפעילות
- אפשרות ל-manual tuning

### בעיה: תלות באינטרנט
**פתרון:**
- Service Worker לעבודה offline
- Cache local של תכנים
- Sync כשחוזר online

### בעיה: פרטיות מול AI
**פתרון:**
- שימוש ב-AI providers שלא שומרים data
- אופציה ל-self-hosted AI
- הצפנה של sensitive data

---

## 🧑‍💻 מי יכול להשתמש בזה?

### קהל יעד ראשי
1. **לומדים עצמאיים** - אנשים שקוראים הרבה ורוצים לארגן ידע
2. **תלמידי מחקר** - סטודנטים לתואר שני/שלישי
3. **אנשי מקצוע** - מי שרוצה להישאר מעודכן בתחום
4. **יזמים** - למידה מתמדת על עסקים וחדשנות
5. **סקרנים** - אנשים שאוהבים ללמוד נושאים חדשים

### פרופילים
- **"הקורא המסור"** - קורא 2-3 ספרים בחודש, רוצה לזכור
- **"צייד הידע"** - קורא המון מאמרים, צריך ארגון
- **"המחקרן"** - עושה מחקר, צריך לחבר רעיונות
- **"המשפר העצמי"** - מתמקד בצמיחה אישית
- **"הטכנולוג"** - מעודכן בטכנולוגיות חדשות

---

## 🔑 Key Takeaways למי שבונה משהו דומה

### שיעורים נלמדים

1. **התחל פשוט**
   - V1 היה רק Books + Summaries
   - V2 הוסיף Articles + AI
   - V3 הוסיף Mentor + Smart Generation
   - אל תנסה לבנות הכל ביום אחד

2. **AI הוא המפתח**
   - התאמה אישית הופכת את החוויה
   - פרואקטיביות (מנטור) > ריאקטיביות בלבד
   - איכות פרומפטים = איכות תוצאות

3. **UX חשוב כמו פונקציונליות**
   - אנימציות גורמות לחוויה להרגיש "חיה"
   - עיצוב נקי = פחות overwhelm
   - RTL support חשוב לעברית

4. **Automation חוסכת זמן**
   - Background jobs מייצרים ערך ללא מאמץ
   - Smart Scheduler שומר על התוכן רענן
   - המשתמש לא צריך לעשות כלום

5. **Database Design משנה**
   - פריזמה מאוד מקלה
   - צריך לחשוב על קשרים מראש
   - Indexes חשובים לperformance

6. **תיעוד הוא חיוני**
   - README טוב = onboarding מהיר
   - API docs = פחות confusion
   - Comments בקוד = maintenance קל יותר

---

## 📚 משאבים נוספים

### קישורים לתיעוד
- [Prisma Docs](https://www.prisma.io/docs)
- [React Query](https://tanstack.com/query)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com)
- [OpenAI API](https://platform.openai.com/docs)

### מקורות השראה
- Notion - לניהול ידע
- Obsidian - לגרף ידע
- Readwise - לspaced repetition
- Pocket - לשמירת מאמרים
- Roam Research - לbacklinks

### מאמרים רלוונטיים
- [Building a Second Brain](https://www.buildingasecondbrain.com/)
- [Spaced Repetition Research](https://www.gwern.net/Spaced-repetition)
- [Personal Knowledge Management](https://fortelabs.com/blog/para/)

---

## 🎓 סיכום: למה ניצוץ הוא מיוחד?

ניצוץ (Spark) הוא לא עוד אפליקציית ניהול משימות או note-taking.
הוא **מנטור דיגיטלי** שעובד בשבילך:

✅ **לומד אותך** - מנתח העדפות, רמה, סגנון
✅ **עובד ברקע** - מייצר תובנות, תוכן, המלצות
✅ **מחבר רעיונות** - מזהה קשרים שלא הבחנת בהם
✅ **מותאם 100%** - כל מאמר, כל תובנה, מותאמת לך
✅ **מבוסס מדע** - Spaced Repetition, Active Recall
✅ **משתפר עם הזמן** - ככל שתשתמש, ככה ייהיה טוב יותר

**בקיצור:** זה כמו מנטור אישי שזוכר הכל, מזהה דפוסים, ותמיד יודע מה להציע הלאה.

---

## 📞 צור קשר ותמיכה

### לשאלות טכניות
- GitHub Issues: [Repository Link]
- Email: [Your Email]

### לתרומות (Contributions)
- Fork the repo
- Create feature branch
- Submit PR with description

### רישיון
MIT License - Feel free to use and modify!

---

**נבנה עם ❤️ לשיפור אישי ולמידה מתמדת**

*Last Updated: 2025*
