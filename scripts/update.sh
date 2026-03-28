#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  מטבח הכפר — עדכון האפליקציה
#  Local Food Marketplace — Update & Restart
# ═══════════════════════════════════════════════════════════

set -e

if [ ! -f "package.json" ]; then
  echo "❌ שגיאה: אתה לא בתיקיית הפרויקט."
  echo "   cd claudeidea"
  exit 1
fi

echo ""
echo "🔄  מעדכן את מטבח הכפר..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Pull latest code ──────────────────────────────────────────
echo ""
echo "1️⃣  מושך קוד חדש מ-GitHub..."
git pull origin claude/local-food-marketplace-4LaT9

# ── Install any new dependencies ──────────────────────────────
echo ""
echo "2️⃣  מוודא שכל החבילות מותקנות..."
npm install --silent

# ── Push DB schema changes ────────────────────────────────────
echo ""
echo "3️⃣  מעדכן מסד נתונים..."
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null | grep -v "^$" | grep -v "Prisma" | grep -v "Loading" || true

# ── Rebuild ───────────────────────────────────────────────────
echo ""
echo "4️⃣  בונה מחדש... (זה לוקח כ-2 דקות)"
npm run build

# ── Get local IP ──────────────────────────────────────────────
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo ""
echo "✅  עדכון הושלם!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   🛒  הזמנות לקוח:   http://$LOCAL_IP:3000"
echo "   👨‍🍳  מסך מטבח:      http://$LOCAL_IP:3000/kitchen"
echo "   ⚙️   ניהול:          http://$LOCAL_IP:3000/admin"
echo ""
echo "   לעצור: לחץ Ctrl+C"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Start ─────────────────────────────────────────────────────
npm start
