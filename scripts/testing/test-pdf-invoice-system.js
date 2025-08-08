import { DatabaseStorage } from './server/storage.js';
import { initializeDatabase } from './server/db.js';

async function testPDFInvoiceSystem() {
  console.log('🧪 Testing PDF Invoice System...\n');

  try {
    // Initialize database
    console.log('1. Initializing database...');
    initializeDatabase();
    
    const storage = new DatabaseStorage();
    
    // Check if puppeteer is available
    console.log('2. Checking Puppeteer availability...');
    try {
      const puppeteer = (await import('puppeteer')).default;
      console.log('   ✅ Puppeteer imported successfully');
    } catch (error) {
      console.log('   ❌ Puppeteer not available:', error.message);
      console.log('   Run: npm install puppeteer');
      return;
    }
    
    // Check existing auctions
    console.log('3. Checking existing auctions...');
    const auctions = await storage.getAuctions();
    console.log(`   Found ${auctions.length} auctions`);
    
    if (auctions.length === 0) {
      console.log('   No auctions found. Creating test auction...');
      
      // Create test auction
      const auction = await storage.createAuction({
        title: 'Test Honda CBR for PDF Invoice',
        description: 'Test motorcycle for PDF invoice system testing',
        startingPrice: 25000000,
        currentPrice: 25000000,
        minimumIncrement: 500000,
        condition: 'good',
        location: 'Jakarta',
        imageUrls: '[]',
        endTime: new Date(Date.now() + 1000), // Ends in 1 second
        categoryId: 1,
        productionYear: 2020,
        plateNumber: 'B 1234 TEST',
        chassisNumber: 'MH1234567890',
        engineNumber: 'CBR150R001'
      });
      
      console.log(`   Created test auction: ${auction.title} (ID: ${auction.id})`);
      
      // Wait for auction to end
      console.log('   Waiting for auction to end...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get users to find a test user
      const users = await storage.getUsers();
      const testUser = users.find(u => u.role === 'user') || users[0];
      
      if (testUser) {
        // Place a bid
        console.log(`   Placing bid from user: ${testUser.username}`);
        await storage.placeBid({
          amount: 26000000,
          bidderId: testUser.id,
          auctionId: auction.id
        });
        
        // End auction manually
        console.log('   Ending auction...');
        const endedAuction = await storage.endAuction(auction.id);
        
        console.log(`   Auction ended. Winner ID: ${endedAuction?.winnerId}`);
        
        // Check if PDF invoice was generated
        const updatedAuction = await storage.getAuction(auction.id);
        
        if (updatedAuction?.invoiceDocument && updatedAuction?.invoiceNumber) {
          console.log('✅ PDF Invoice System Test PASSED!');
          console.log(`   Invoice Number: ${updatedAuction.invoiceNumber}`);
          console.log(`   Invoice Document Length: ${updatedAuction.invoiceDocument.length} chars`);
          
          // Check if it's actually a PDF
          if (updatedAuction.invoiceDocument.startsWith('data:application/pdf;base64,')) {
            console.log('✅ PDF Format Test PASSED!');
            console.log('   Invoice is in PDF format');
            
            // Test PDF content
            const base64Data = updatedAuction.invoiceDocument.split(',')[1];
            const pdfBuffer = Buffer.from(base64Data, 'base64');
            
            console.log(`   PDF size: ${pdfBuffer.length} bytes`);
            
            // Check if PDF starts with PDF header
            const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
            if (pdfHeader === '%PDF') {
              console.log('✅ PDF Content Test PASSED!');
              console.log('   PDF file is valid');
              
              // Save test PDF file
              const fs = await import('fs');
              fs.writeFileSync(`test-invoice-${updatedAuction.invoiceNumber}.pdf`, pdfBuffer);
              console.log(`   ✅ Test PDF saved as: test-invoice-${updatedAuction.invoiceNumber}.pdf`);
              
            } else {
              console.log('❌ PDF Content Test FAILED!');
              console.log('   PDF file seems corrupted');
            }
            
          } else if (updatedAuction.invoiceDocument.startsWith('data:text/html;base64,')) {
            console.log('⚠️  Still using HTML format');
            console.log('   System might have fallen back to HTML');
          } else {
            console.log('❌ Unknown document format');
          }
          
        } else {
          console.log('❌ PDF Invoice System Test FAILED!');
          console.log('   Invoice not generated automatically');
        }
      } else {
        console.log('❌ No test user found');
      }
    } else {
      // Test with existing auction
      const testAuction = auctions.find(a => a.status === 'ended' && a.winnerId);
      
      if (testAuction) {
        console.log(`3. Testing with existing auction: ${testAuction.title}`);
        
        if (testAuction.invoiceDocument && testAuction.invoiceNumber) {
          if (testAuction.invoiceDocument.startsWith('data:application/pdf;base64,')) {
            console.log('✅ Existing auction has PDF invoice!');
            console.log(`   Invoice Number: ${testAuction.invoiceNumber}`);
          } else {
            console.log('⚠️  Existing auction has HTML invoice. Regenerating as PDF...');
            
            const invoiceDoc = await storage.generateInvoiceForWinner(testAuction.id, testAuction.winnerId);
            
            if (invoiceDoc) {
              console.log('✅ PDF invoice generated successfully!');
              
              const updatedAuction = await storage.getAuction(testAuction.id);
              console.log(`   Invoice Number: ${updatedAuction?.invoiceNumber}`);
              
              if (updatedAuction?.invoiceDocument?.startsWith('data:application/pdf;base64,')) {
                console.log('✅ Successfully converted to PDF format!');
              }
            } else {
              console.log('❌ Failed to generate PDF invoice');
            }
          }
        } else {
          console.log('⚠️  Existing auction missing invoice. Generating PDF...');
          
          const invoiceDoc = await storage.generateInvoiceForWinner(testAuction.id, testAuction.winnerId);
          
          if (invoiceDoc) {
            console.log('✅ PDF invoice generated successfully!');
            
            const updatedAuction = await storage.getAuction(testAuction.id);
            console.log(`   Invoice Number: ${updatedAuction?.invoiceNumber}`);
          } else {
            console.log('❌ Failed to generate PDF invoice');
          }
        }
      } else {
        console.log('⚠️  No ended auctions with winners found');
      }
    }
    
    console.log('\n🎉 PDF Invoice System Test Completed!');
    console.log('\nNext Steps:');
    console.log('1. Make sure puppeteer is installed: npm install');
    console.log('2. Start server: npm run dev');
    console.log('3. Login as winner user');
    console.log('4. Go to auction detail page');
    console.log('5. Check if PDF invoice section appears');
    console.log('6. Test PDF preview and download buttons');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testPDFInvoiceSystem();
