echo "🔧 Fixing E-Auction system issues..."
echo ""

echo "1. Running database initialization and fixes..."
node run-db-fix.js

echo ""
echo "2. Starting development server..."
npm run dev
