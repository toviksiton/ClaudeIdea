#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  מטבח הכפר — הפעלת האפליקציה
#  Local Food Marketplace — Start the App
# ═══════════════════════════════════════════════════════════

set -e

# ── Check we're in the right folder ──────────────────────────
if [ ! -f "package.json" ]; then
  echo "❌ שגיאה: אתה לא בתיקיית הפרויקט."
  echo "   cd claudeidea  (או השם של התיקיה)"
  exit 1
fi

# ── Check build exists ────────────────────────────────────────
if [ ! -d ".next" ]; then
  echo "❌ האפליקציה לא נבנתה עדיין."
  echo "   הרץ קודם: ./scripts/setup-mac.sh"
  exit 1
fi

# ── Get local IP ──────────────────────────────────────────────
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo ""
echo "🍽️  מטבח הכפר — מפעיל שרת..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   שתף את הקישורים האלה:"
echo ""
echo "   🛒  הזמנות לקוח (לשלוח לכולם):"
echo "       http://$LOCAL_IP:3000"
echo ""
echo "   👨‍🍳  מסך מטבח (פתח בטאבלט/מסך במטבח):"
echo "       http://$LOCAL_IP:3000/kitchen"
echo ""
echo "   ⚙️   ניהול (רק לך):"
echo "       http://$LOCAL_IP:3000/admin"
echo ""
echo "   ⚠️  כל המכשירים חייבים להיות באותה רשת WiFi"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   לעצור: לחץ Ctrl+C"
echo ""

# ── Run DB migrations (safe to run every time) ───────────────
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null | grep -v "^$" | grep -v "Prisma" | grep -v "Loading" || true

# ── Start ─────────────────────────────────────────────────────
npm start
