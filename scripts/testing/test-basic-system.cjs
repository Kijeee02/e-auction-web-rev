// Simple test without TypeScript imports
const Database = require('better-sqlite3');
const path = require('path');

async function testBasicInvoiceSystem() {
  console.log('🧪 Testing Basic Database Connection...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    
    const dbPath = path.join(__dirname, 'auction.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = new Database(dbPath);
    console.log('✅ Database connection successful');
    
    // Test tables exist
    console.log('\n2. Checking database tables...');
    
    const tables = ['users', 'auctions', 'bids', 'categories'];
    
    for (const table of tables) {
      try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        console.log(`✅ Table '${table}' exists - ${result.count} records`);
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message);
      }
    }
    
    // Check if invoice columns exist in auctions table
    console.log('\n3. Checking invoice columns...');
    
    try {
      const columns = db.prepare("PRAGMA table_info(auctions)").all();
      const columnNames = columns.map(col => col.name);
      const hasInvoiceDoc = columnNames.includes('invoiceDocument');
      const hasInvoiceNum = columnNames.includes('invoiceNumber');
      
      console.log(`✅ Auction table columns: ${columnNames.join(', ')}`);
      console.log(`${hasInvoiceDoc ? '✅' : '❌'} invoiceDocument column exists`);
      console.log(`${hasInvoiceNum ? '✅' : '❌'} invoiceNumber column exists`);
      
      if (!hasInvoiceDoc || !hasInvoiceNum) {
        console.log('\n⚠️  Missing invoice columns. Adding them now...');
        
        if (!hasInvoiceDoc) {
          try {
            db.prepare('ALTER TABLE auctions ADD COLUMN invoiceDocument TEXT').run();
            console.log('✅ Added invoiceDocument column');
          } catch (err) {
            console.log('❌ Error adding invoiceDocument column:', err.message);
          }
        }
        
        if (!hasInvoiceNum) {
          try {
            db.prepare('ALTER TABLE auctions ADD COLUMN invoiceNumber TEXT').run();
            console.log('✅ Added invoiceNumber column');
          } catch (err) {
            console.log('❌ Error adding invoiceNumber column:', err.message);
          }
        }
      }
    } catch (err) {
      console.log('❌ Error checking auction table structure:', err.message);
    }
    
    // Check puppeteer installation
    console.log('\n4. Checking puppeteer installation...');
    try {
      require('puppeteer');
      console.log('✅ Puppeteer is installed');
    } catch (err) {
      console.log('❌ Puppeteer is not installed - system will use HTML fallback');
    }
    
    db.close();
    console.log('\n✅ Database closed successfully');
    
    console.log('\n🎉 Basic system check completed!');
    console.log('\nNext steps:');
    console.log('1. Try starting the server: npm run dev');
    console.log('2. If puppeteer is missing, PDF will fallback to HTML');
    console.log('3. Invoice system should work now');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBasicInvoiceSystem();
