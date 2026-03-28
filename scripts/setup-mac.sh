#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  מטבח הכפר — הגדרה ראשונה (הרץ פעם אחת בלבד)
#  Local Food Marketplace — First-Time Setup
# ═══════════════════════════════════════════════════════════

set -e  # Stop on any error

echo ""
echo "🍽️  מטבח הכפר — הגדרה ראשונה"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Check Node.js ────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "❌ Node.js לא מותקן!"
  echo ""
  echo "   1. פתח את הדפדפן ועבור לכתובת:"
  echo "      https://nodejs.org"
  echo "   2. הורד את הגרסה LTS (הכפתור הירוק הגדול)"
  echo "   3. התקן ← הרץ שוב את הסקריפט הזה"
  echo ""
  exit 1
fi

NODE_VER=$(node --version)
echo "✅ Node.js מותקן: $NODE_VER"

# ── Check we're in the right folder ──────────────────────────
if [ ! -f "package.json" ]; then
  echo "❌ שגיאה: אתה לא בתיקיית הפרויקט."
  echo "   נווט לתיקיית הפרויקט ונסה שוב:"
  echo "   cd claudeidea  (או השם של התיקיה)"
  exit 1
fi

# ── Create .env if missing ────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "📝 יוצר קובץ הגדרות (.env)..."
  cp .env.example .env
  # Generate a random secret
  RAND_SECRET=$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 40 2>/dev/null || echo "change-this-secret-$(date +%s)")
  sed -i '' "s/your-secret-here-change-in-production/$RAND_SECRET/" .env 2>/dev/null || \
  sed -i "s/your-secret-here-change-in-production/$RAND_SECRET/" .env
  echo "✅ קובץ .env נוצר"
fi

# ── Install dependencies ──────────────────────────────────────
echo ""
echo "📦 מתקין חבילות (יכול לקחת כמה דקות בפעם הראשונה)..."
npm install --silent
echo "✅ חבילות הותקנו"

# ── Setup database ────────────────────────────────────────────
echo ""
echo "🗄️  מגדיר מסד נתונים..."
npx prisma generate --silent 2>/dev/null || npx prisma generate
npx prisma db push --skip-generate 2>/dev/null | grep -E "(sync|Done|error)" || true
echo "✅ מסד נתונים מוכן"

# ── Seed initial data ─────────────────────────────────────────
echo ""
echo "🌱 טוען נתונים לדוגמה (המבורגר, שניצל, פלאפל)..."
npx tsx prisma/seed.ts
echo "✅ נתוני דוגמה נטענו"

# ── Build the app ─────────────────────────────────────────────
echo ""
echo "🔨 בונה את האפליקציה (יכול לקחת דקה-שתיים)..."
npm run build 2>&1 | tail -5
echo "✅ האפליקציה נבנתה"

# ── Get local IP ──────────────────────────────────────────────
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ההגדרה הושלמה בהצלחה!"
echo ""
echo "   להפעיל את האפליקציה הרץ:"
echo "   ./scripts/start.sh"
echo ""
echo "   כתובות לאחר ההפעלה:"
echo "   🛒 הזמנות לקוח:  http://$LOCAL_IP:3000"
echo "   👨‍🍳 מסך מטבח:    http://$LOCAL_IP:3000/kitchen"
echo "   ⚙️  ניהול:        http://$LOCAL_IP:3000/admin"
echo "   🔑 סיסמת מנהל:   admin123  (שנה בהגדרות!)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
