# 🔐 מדריך אבטחה בסיסי
## לפרויקט אישי - Nitzutz Spark

---

## ⚠️ הדברים החשובים באמת

### 1. **אל תעלה את קובץ ה-.env ל-GitHub!**

זה הכלל המספר 1. הקובץ `.env` מכיל:
- סיסמאות למסד הנתונים
- מפתחות API ל-AI
- מפתחות Google Drive

**פתרון:**
```bash
# ודא שיש לך .gitignore עם:
.env
.env.local
.env.*.local
*.env
```

---

### 2. **החלף סיסמאות default**

אם אתה משתמש ב-PostgreSQL מקומי:
```sql
-- אל תשתמש ב:
user: postgres
password: postgres

-- השתמש ב:
user: nitzutz_user
password: כאןשםסיסמהחזקהועםמספרים123!
```

---

### 3. **שמור על API Keys בסוד**

```bash
# ✅ טוב - משתמש במשתני סביבה
const apiKey = process.env.AI_API_KEY;

# ❌ רע - API key בקוד
const apiKey = "hf_***REDACTED***";
```

---

## 🛡️ אבטחה בסיסית לשימוש אישי

### כללי אצבע פשוטים:

#### ✅ כן - עשה את זה:
- שמור `.env` מחוץ ל-git
- השתמש ב-HTTPS (לא HTTP) אם אתה חושף את השרת
- עדכן packages מדי פעם: `npm update`
- גבה את מסד הנתונים
- השתמש בסיסמאות חזקות

#### ❌ לא - אל תעשה את זה:
- אל תעלה credentials ל-GitHub
- אל תשתף API keys בצ'אטים
- אל תריץ את השרת על port 80/443 ללא HTTPS
- אל תחשוף את הפורט לאינטרנט (אם לא צריך)

---

## 🔒 הגנה על ה-API שלך

### אם אתה רוצה לגשת מרחוק:

```typescript
// הוסף basic auth פשוט
const basicAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  
  if (!auth || auth !== `Bearer ${process.env.MY_SECRET_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// הוסף לכל הroutes:
app.use('/api', basicAuth);
```

ואז תוכל לגשת עם:
```bash
curl -H "Authorization: Bearer my-secret-token" http://localhost:5000/api/health
```

---

## 📦 בדיקת חולשות ידועות

```bash
# הרץ בדיקה פעם בחודש:
npm audit

# אם יש בעיות חמורות:
npm audit fix

# אם זה לא עוזר:
npm audit fix --force
```

---

## 🔄 גיבויים

### גבה את מסד הנתונים שלך:

```bash
# Windows
pg_dump -U postgres -d nitzutz_spark > backup.sql

# שחזור
psql -U postgres -d nitzutz_spark < backup.sql
```

**כדאי לעשות פעם בשבוע!**

---

## 🌐 אם אתה מפרסם את הפרויקט

### דברים שחשוב לעשות:

1. **הוסף HTTPS**
   ```bash
   # השתמש ב-Caddy או nginx עם Let's Encrypt
   # או פשוט deploy ל-Railway/Heroku שעושים את זה בשבילך
   ```

2. **הגבל גישה**
   ```typescript
   // רק למחשבים שלך:
   const allowedIPs = ['YOUR_IP_HERE'];
   
   app.use((req, res, next) => {
     if (!allowedIPs.includes(req.ip)) {
       return res.status(403).json({ error: 'Forbidden' });
     }
     next();
   });
   ```

3. **rate limiting**
   ```typescript
   // כבר מוגדר בפרויקט!
   // אבל ודא ש-AI endpoints מוגבלים ל-30 בקשות ל-15 דקות
   ```

---

## 🎯 טיפים מעשיים

### 1. סיסמת מסד נתונים חזקה
```
❌ רע: postgres, 123456, password
✅ טוב: k9$mP#xL2@vN8qR!wE5tY
```

### 2. API Keys
```bash
# Hugging Face
# לך ל-https://huggingface.co/settings/tokens
# צור token חדש עם הרשאות מינימליות

# אם הAPI key דלף - בטל אותו מיד!
```

### 3. Google OAuth
```bash
# הגדר Redirect URI רק ל:
http://localhost:5000/api/google-drive/auth/callback

# אל תוסיף wildcard redirects!
```

---

## 🚨 מה לעשות אם משהו דלף?

### אם API key נחשף:

1. **בטל אותו מיד** בממשק של הספק (Hugging Face/OpenAI)
2. **צור key חדש**
3. **עדכן את `.env`**
4. **אם עלה ל-GitHub:**
   ```bash
   # אל תמחק רק את הcommit - זה נשאר בhistory!
   # צור repository חדש
   # או השתמש ב-git-filter-repo
   ```

### אם סיסמת DB דלפה:
```sql
-- החלף סיסמה
ALTER USER nitzutz_user WITH PASSWORD 'סיסמה-חדשה-וחזקה-123!';
```

---

## ✅ Checklist מהיר

לפני שאתה מעלה לגיטהאב:

- [ ] קובץ `.env` ב-`.gitignore`
- [ ] אין API keys בקוד
- [ ] סיסמאות חזקות למסד הנתונים
- [ ] `npm audit` לא מראה critical issues
- [ ] יש לך גיבוי של ה-DB

לפני שאתה מפרסם:

- [ ] HTTPS מוגדר
- [ ] Rate limiting פעיל
- [ ] רק את מה שצריך חשוף לאינטרנט
- [ ] יש לך דרך לעקוב אחר שימוש

---

## 📚 קריאה נוספת (אופציונלי)

אם אתה רוצה להעמיק:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - 10 הסיכונים הגדולים
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)

---

## 💡 לסיכום

**לשימוש אישי, זה מספיק:**

1. ✅ `.env` לא עולה לgit
2. ✅ סיסמאות חזקות
3. ✅ גיבויים קבועים
4. ✅ `npm audit` מדי פעם
5. ✅ API keys בסוד

**זה לא צריך להיות מסובך! אתה לא ב-production של בנק 😊**

---

<div align="center">

**נבנה בשביל ללמוד, לא בשביל hackers 🔒**

![Security](https://img.shields.io/badge/Security-Basic_Protection-green?style=flat-square)

</div>