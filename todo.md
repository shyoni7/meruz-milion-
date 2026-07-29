# HaMerutz L-70 — TODO

## Backend & Database
- [x] הגדרת סכמת DB — טבלאות teams, stations, clues, tasks, submissions
- [x] Migration ויצירת טבלאות ב-DB
- [x] API: רישום קבוצה (שם + טלפון)
- [x] API: קבלת תחנות ותוכן מה-DB
- [x] API: שמירת תמונות שמשתמשים מעלים (S3)
- [x] API: עדכון סטטוס משימה (הושלמה / נכשלה)
- [x] API: ניהול תחנות לאדמין (CRUD)
- [x] API: רשימת קבוצות + סטטוס לאדמין
- [x] API: אישור/דחיית תמונות שהועלו

## Admin Panel (צוות הפקה)
- [x] מסך כניסה לאדמין (שם משתמש + סיסמה)
- [x] לוח בקרה ראשי — סטטיסטיקות
- [x] ניהול תחנות — הוספה/עריכה/מחיקה
- [x] עריכת רמזים ומשימות לכל תחנה
- [x] רשימת קבוצות רשומות + מעקב התקדמות
- [x] אישור תמונות שהועלו על ידי קבוצות

## Frontend — חיבור ל-DB
- [x] מסך רישום קבוצה (שם + טלפון) לפני מסך הפתיחה
- [x] טעינת תוכן תחנות מה-DB (במקום קובץ סטטי)
- [x] העלאת תמונה במסך "חדר בקרה"
- [x] שמירת התקדמות קבוצה ב-DB

## שלמו
- [x] לוח מובילים (Leaderboard) בזמן אמת ב-Admin Panel — מציג תחנה נוכחית לכל קבוצה עם polling אוטומטי
- [x] מחיקת תמונות (submissions) ב-Admin Panel
- [x] מחיקת קבוצות (teams) ב-Admin Panel
- [ ] Backend: tRPC endpoint ליצירת הערות שנונות עם LLM לכל תחנה
- [ ] Backend: endpoint לאיסוף כל תמונות הקבוצה ממוינות לפי תחנה
- [ ] Frontend: עמוד /slideshow/:teamId עם Canvas slideshow אנימטי
- [ ] Frontend: כפתור "צפה במצגת" ב-FinishScreen
- [ ] Admin: כפתור "מצגת קבוצה" ליד כל קבוצה ב-AdminTeams

- [x] מסך פתיחה קולנועי
- [x] כרטיס גירוד כסף עם צלילים
- [x] 6 תבניות מסכים (Clue, Task, HintCenter, ControlRoom, Complete, TryAgain)
- [x] אנימציות Framer Motion
- [x] קונפטי זהב במסך הצלחה
