echo "🚀 Setting up E-Auction Invoice System..."
echo ""

echo "Step 1: Running database fixes..."
node run-db-fix.js

echo ""
echo "Step 2: Testing invoice system..."
node test-invoice-system.js

echo ""
echo "Step 3: Starting development server..."
echo "Run this command next: npm run dev"
echo ""
echo "Then test the system by:"
echo "1. Login as a user"
echo "2. Go to auction detail page of ended auction"
echo "3. Check if invoice section appears for winners"
echo "4. Test download and preview buttons"
