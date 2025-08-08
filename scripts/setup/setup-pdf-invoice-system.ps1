Write-Host "🚀 Setting up PDF Invoice System for E-Auction..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Installing Puppeteer for PDF generation..." -ForegroundColor Yellow
npm install puppeteer
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install puppeteer. Trying with --no-optional..." -ForegroundColor Red
    npm install puppeteer --no-optional
}

Write-Host ""
Write-Host "Step 2: Running database fixes..." -ForegroundColor Yellow
node run-db-fix.js

Write-Host ""
Write-Host "Step 3: Testing PDF invoice system..." -ForegroundColor Yellow
node test-pdf-invoice-system.js

Write-Host ""
Write-Host "Step 4: System is ready!" -ForegroundColor Green
Write-Host "Run this command next: " -NoNewline -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then test the PDF system by:" -ForegroundColor White
Write-Host "1. Login as a user" -ForegroundColor Gray
Write-Host "2. Go to auction detail page of ended auction" -ForegroundColor Gray
Write-Host "3. Check if PDF invoice section appears for winners" -ForegroundColor Gray
Write-Host "4. Test PDF preview and download buttons" -ForegroundColor Gray
Write-Host "5. Verify downloaded file is a proper PDF" -ForegroundColor Gray
