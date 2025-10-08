# 🌍 הגדרת Netlify לפרונט-אנד

## 🚀 צעדים להעלאה:

### 1. **צור Site חדש ב-Netlify:**
1. לך ל-[netlify.com](https://netlify.com)
2. לחץ "New site from Git"
3. בחר GitHub ואת הrepo: `amitA51/nitzutz-spark`
4. הגדר:

### 2. **Build Settings:**
```
Base directory: frontend/
Build command: npm ci && npm run build
Publish directory: frontend/dist
```

### 3. **Environment Variables:**
ב-Netlify Dashboard → Site Settings → Environment variables:

```bash
VITE_API_URL=https://nitzutz-backend-production-423f.up.railway.app/api
```

### 4. **Deploy Settings:**
- **Branch to deploy**: `master`
- **Production branch**: `master`

## 🧪 בדיקה:

אחרי שה-deploy מסתיים:
1. לך ל-URL של Netlify
2. בדוק שהאתר נטען
3. בדוק Network tab שהוא מתחבר לRailway API
4. נסה לחפש מאמר או לשאול שאלה

## 🔧 פתרון בעיות:

### אם יש שגיאת CORS:
וודא שב-Railway משתנה הסביבה:
```bash
CORS_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
FRONTEND_URL=https://your-netlify-site.netlify.app
```

### אם ה-API לא עובד:
1. בדוק שRailway backend עלה בהצלחה
2. נסה: `https://nitzutz-backend-production-423f.up.railway.app/api/health`
3. בדוק שה-VITE_API_URL נכון בNetlify

---

## 📱 URLs צפויים:

**Frontend (Netlify):** `https://[site-name].netlify.app`
**Backend (Railway):** `https://nitzutz-backend-production-423f.up.railway.app`
**API Health Check:** `https://nitzutz-backend-production-423f.up.railway.app/api/health`