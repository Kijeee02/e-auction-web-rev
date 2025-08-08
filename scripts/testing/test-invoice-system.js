import { DatabaseStorage } from './server/storage.js';
import { initializeDatabase } from './server/db.js';

async function testInvoiceSystem() {
  console.log('🧪 Testing Invoice System...\n');

  try {
    // Initialize database
    console.log('1. Initializing database...');
    initializeDatabase();
    
    const storage = new DatabaseStorage();
    
    // Check existing auctions
    console.log('2. Checking existing auctions...');
    const auctions = await storage.getAuctions();
    console.log(`   Found ${auctions.length} auctions`);
    
    if (auctions.length === 0) {
      console.log('   No auctions found. Creating test auction...');
      
      // Create test auction
      const auction = await storage.createAuction({
        title: 'Test Honda CBR for Invoice',
        description: 'Test motorcycle for invoice system testing',
        startingPrice: 25000000,
        currentPrice: 25000000,
        minimumIncrement: 500000,
        condition: 'good',
        location: 'Jakarta',
        imageUrls: '[]',
        endTime: new Date(Date.now() + 1000), // Ends in 1 second
        categoryId: 1,
        productionYear: 2020,
        plateNumber: 'B 1234 TEST'
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
        
        // Check if invoice was generated
        const updatedAuction = await storage.getAuction(auction.id);
        
        if (updatedAuction?.invoiceDocument && updatedAuction?.invoiceNumber) {
          console.log('✅ Invoice System Test PASSED!');
          console.log(`   Invoice Number: ${updatedAuction.invoiceNumber}`);
          console.log(`   Invoice Document Length: ${updatedAuction.invoiceDocument.length} chars`);
          
          // Test invoice download
          console.log('3. Testing invoice content...');
          const base64Data = updatedAuction.invoiceDocument.split(',')[1];
          const invoiceHTML = Buffer.from(base64Data, 'base64').toString('utf8');
          
          if (invoiceHTML.includes('INVOICE PEMBAYARAN LELANG') && 
              invoiceHTML.includes(updatedAuction.invoiceNumber) &&
              invoiceHTML.includes(testUser.firstName)) {
            console.log('✅ Invoice Content Test PASSED!');
            console.log('   Invoice contains correct data');
          } else {
            console.log('❌ Invoice Content Test FAILED!');
            console.log('   Invoice missing required data');
          }
          
        } else {
          console.log('❌ Invoice System Test FAILED!');
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
          console.log('✅ Existing auction has invoice!');
          console.log(`   Invoice Number: ${testAuction.invoiceNumber}`);
        } else {
          console.log('⚠️  Existing auction missing invoice. Generating...');
          
          const invoiceDoc = await storage.generateInvoiceForWinner(testAuction.id, testAuction.winnerId);
          
          if (invoiceDoc) {
            console.log('✅ Invoice generated successfully!');
            
            const updatedAuction = await storage.getAuction(testAuction.id);
            console.log(`   Invoice Number: ${updatedAuction?.invoiceNumber}`);
          } else {
            console.log('❌ Failed to generate invoice');
          }
        }
      } else {
        console.log('⚠️  No ended auctions with winners found');
      }
    }
    
    console.log('\n🎉 Invoice System Test Completed!');
    console.log('\nNext Steps:');
    console.log('1. Start server: npm run dev');
    console.log('2. Login as winner user');
    console.log('3. Go to auction detail page');
    console.log('4. Check if invoice section appears');
    console.log('5. Test download and preview buttons');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testInvoiceSystem();
