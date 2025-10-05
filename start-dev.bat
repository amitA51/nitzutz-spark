@echo off
REM סקריפט להפעלת שרתי הפיתוח (Backend ו-Frontend)

echo "🚀 מפעיל את שרת ה-Backend..."
REM פותח חלון CMD חדש ומפעיל את השרת
start "Backend Server" cmd /k "cd backend && npm run dev"

echo "🎨 מפעיל את שרת ה-Frontend..."
REM הערה: תיקנתי את טעות הכתיב מ-forntend ל-frontend
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo "✅ שני השרתים הופעלו בחלונות חדשים."