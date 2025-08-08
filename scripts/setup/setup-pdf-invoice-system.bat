echo "🚀 Setting up PDF Invoice System for E-Auction..."
echo ""

echo "Step 1: Installing Puppeteer for PDF generation..."
npm install puppeteer
if ($LASTEXITCODE -ne 0) {
    echo "❌ Failed to install puppeteer. Trying with --no-optional..."
    npm install puppeteer --no-optional
}

echo ""
echo "Step 2: Running database fixes..."
node run-db-fix.js

echo ""
echo "Step 3: Testing PDF invoice system..."
node test-pdf-invoice-system.js

echo ""
echo "Step 4: System is ready!"
echo "Run this command next: npm run dev"
echo ""
echo "Then test the PDF system by:"
echo "1. Login as a user"
echo "2. Go to auction detail page of ended auction"
echo "3. Check if PDF invoice section appears for winners"
echo "4. Test PDF preview and download buttons"
echo "5. Verify downloaded file is a proper PDF"
