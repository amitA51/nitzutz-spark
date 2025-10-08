<div align="center">

# ✨ Nitzutz Spark
### מערכת AI אישית ללמידה והתפתחות

![Status](https://img.shields.io/badge/Status-Personal_Project-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)

**פרויקט אישי** ללמידה מתקדמת עם בינה מלאכותית 🚀

</div>

---

## 📖 מה זה?

**Nitzutz Spark** היא מערכת AI אישית שעוזרת לי:
- 📚 לנהל את הספרייה האישית שלי (ספרים ומאמרים)
- 🤖 לשאול שאלות על תכנים שקראתי
- 🧠 לזכור מושגים חשובים עם חזרות מרווחות
- 💡 לקבל תובנות אישיות והמלצות למידה
- ☁️ לנתח מסמכים מה-Google Drive שלי

---

## 🚀 התקנה מהירה

### דרישות מקדימות
- Node.js 18+ ([הורדה](https://nodejs.org/))
- PostgreSQL ([הורדה](https://www.postgresql.org/download/))

### התקנה

```bash
# שכפול הפרויקט
git clone https://github.com/yourusername/nitzutz-spark.git
cd nitzutz-spark/backend

# התקנת חבילות
npm install

# הגדרת משתני סביבה
cp .env.example .env
# ערוך את .env עם הפרטים שלך

# הכנת מסד הנתונים
npx prisma migrate dev
npx prisma generate

# הפעלת השרת
npm run dev
```

השרת ירוץ על: http://localhost:5000

---

## ⚙️ הגדרות (קובץ .env)

```bash
# מסד נתונים - תחליף בפרטים שלך
DATABASE_URL="postgresql://user:password@localhost:5432/nitzutz_spark"

# בחר ספק AI אחד:
# אופציה 1: Hugging Face (חינם עד 1000 בקשות/חודש)
AI_BASE_URL=https://router.huggingface.co/v1
AI_API_KEY=your_hf_token_here
AI_MODEL=deepseek-ai/DeepSeek-V3.2-Exp

# אופציה 2: OpenAI (בתשלום)
# AI_BASE_URL=https://api.openai.com/v1
# AI_API_KEY=sk-your-openai-key
# AI_MODEL=gpt-4o-mini

# Google Drive (אופציונלי)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google-drive/auth/callback
```

---

## 🎯 תכונות עיקריות

### 📚 ניהול ספרייה אישית
```typescript
// הוסף ספר
POST /api/books
{
  "bookTitle": "Atomic Habits",
  "author": "James Clear",
  "totalPages": 320
}

// הוסף סיכום
POST /api/summaries
{
  "bookId": "book-id",
  "chapterTitle": "פרק 1",
  "content": "סיכום הפרק..."
}
```

### 🤖 שאל את ה-AI
```typescript
// שאל שאלה על מאמר
POST /api/ai/ask
{
  "articleId": "article-id",
  "question": "מה הנקודות המרכזיות?"
}

// חלץ נקודות מפתח
POST /api/ai/extract-key-points
{
  "articleId": "article-id"
}
```

### 🔄 חזרה מרווחת
המערכת תזכיר לך לחזור על תכנים:
- אחרי 3 ימים
- אחרי שבוע
- אחרי חודש

### ☁️ אינטגרציה עם Google Drive
```typescript
// התחבר ל-Google Drive
GET /api/google-drive/auth

// נתח מסמכים
POST /api/google-drive/analyze
```

---

## 📊 API נוחים לשימוש

### בדיקת בריאות
```bash
curl http://localhost:5000/api/health
```

### ניהול מאמרים
```bash
# קבל כל המאמרים
GET /api/articles

# הוסף מאמר חדש
POST /api/articles
{
  "title": "כותרת",
  "content": "תוכן...",
  "category": "technology"
}
```

### תובנות אישיות
```bash
# קבל תובנות שבועיות
GET /api/insights
```

---

## 🛠️ פקודות שימושיות

```bash
# פיתוח
npm run dev              # הרץ עם hot reload
npm run build            # הידור TypeScript
npm start                # הרץ בייצור

# מסד נתונים
npm run prisma:studio    # פתח Prisma Studio (GUI)
npm run prisma:migrate   # הרץ migrations

# איכות קוד
npm run lint             # בדוק שגיאות
npm run format           # פורמט קוד
```

---

## 🎨 מבנה הפרויקט

```
backend/
├── src/
│   ├── routes/           # נקודות קצה API
│   │   ├── ai.ts         # AI endpoints
│   │   ├── articles.ts   # ניהול מאמרים
│   │   ├── books.ts      # ניהול ספרים
│   │   └── ...
│   ├── services/         # לוגיקה עסקית
│   │   ├── aiClient.ts   # חיבור ל-AI
│   │   ├── contentCache.ts  # מטמון
│   │   ├── adaptiveModelSelector.ts  # בחירת מודל חכם
│   │   └── ...
│   ├── jobs/            # משימות רקע
│   │   ├── mentorJob.ts      # תובנות שבועיות
│   │   └── smartScheduler.ts # תזמון חכם
│   └── server.ts        # נקודת כניסה
├── prisma/
│   └── schema.prisma    # סכמת DB
└── package.json
```

---

## 💡 טיפים לשימוש

### 🎯 כדי להפיק את המקסימום:

1. **הוסף תוכן באופן קבוע**
   - ספרים שאתה קורא
   - מאמרים מעניינים
   - סיכומים משלך

2. **שאל שאלות מעניינות**
   - "מה הקשר בין X ל-Y?"
   - "תן לי דוגמאות נוספות"
   - השתמש ב-devils-advocate mode לחשיבה ביקורתית

3. **השתמש בחזרות מרווחות**
   - סמן מאמרים חשובים
   - בצע את החזרות כשהמערכת מזכירה

4. **חבר את Google Drive**
   - נתח מסמכים אוטומטית
   - קבל המלצות מבוססות תוכן

---

## 🔧 פתרון בעיות נפוצות

### השרת לא עולה
```bash
# בדוק שהפורט פנוי
netstat -ano | findstr :5000

# הרוג תהליך שתופס את הפורט (Windows)
taskkill /PID <PID> /F
```

### בעיות עם מסד נתונים
```bash
# אתחל מחדש את ה-DB
npx prisma migrate reset
npx prisma generate
```

### AI לא עובד
- ודא שיש לך API key תקין
- בדוק quota ב-Hugging Face
- נסה מודל אחר

---

## 📈 תכונות מתקדמות

### בחירת מודל אדפטיבי
המערכת בוחרת אוטומטית את המודל הטוב ביותר:
- משימות פשוטות → מודל קל (זול ומהיר)
- משימות מורכבות → מודל מתקדם (איטי אבל טוב)

### מטמון חכם
- שומר תוכן שכבר נוצר
- חוסך כסף ב-AI API
- מהיר יותר

### אנליטיקה אישית
- מעקב אחר הרגלי למידה
- המלצות מותאמות אישית
- תובנות שבועיות

---

## 🔐 אבטחה בסיסית

### ⚠️ חשוב לשימוש אישי:

```bash
# אל תשתף את קובץ ה-.env
# הוסף ל-.gitignore:
.env
.env.local
*.env

# שמור על API keys בסוד
# אל תעלה ל-GitHub
# אל תשתף בצ'אטים
```

---

## 🎓 למידה נוספת

### משאבים מומלצים:
- [תיעוד Prisma](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Hugging Face Models](https://huggingface.co/models)

### קהילות:
- [TypeScript Discord](https://discord.gg/typescript)
- [Node.js Reddit](https://reddit.com/r/node)

---

## 🐛 מצאת באג?

פשוט פתח issue ב-GitHub או תקן אותו בעצמך! זה פרויקט אישי אז אין לחץ 😊

---

## 📝 רישיון

MIT License - עשה עם זה מה שאתה רוצה!

---

## 🙏 תודות

- **OpenAI / Hugging Face** - מודלי AI
- **Prisma** - ORM מעולה
- **Express.js** - Framework פשוט
- **TypeScript** - Type safety

---

<div align="center">

**נבנה עם ❤️ לשימוש אישי**

![Made with TypeScript](https://img.shields.io/badge/Made_with-TypeScript-blue?style=flat-square&logo=typescript)
![Powered by AI](https://img.shields.io/badge/Powered_by-AI-purple?style=flat-square)

**הצלחה בלמידה! 🚀📚**

</div>