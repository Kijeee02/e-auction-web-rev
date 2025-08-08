// Simple test without TypeScript imports
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testBasicInvoiceSystem() {
  console.log('🧪 Testing Basic Database Connection...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    
    const dbPath = path.join(__dirname, 'auction.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
      }
      console.log('✅ Database connection successful');
    });
    
    // Test tables exist
    console.log('\n2. Checking database tables...');
    
    const tables = ['users', 'auctions', 'bids', 'categories'];
    
    for (const table of tables) {
      await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
          if (err) {
            console.log(`❌ Table '${table}' error:`, err.message);
          } else {
            console.log(`✅ Table '${table}' exists - ${row.count} records`);
          }
          resolve();
        });
      });
    }
    
    // Check if invoice columns exist in auctions table
    console.log('\n3. Checking invoice columns...');
    
    await new Promise((resolve) => {
      db.all("PRAGMA table_info(auctions)", (err, columns) => {
        if (err) {
          console.log('❌ Error checking auction table structure:', err.message);
        } else {
          const columnNames = columns.map(col => col.name);
          const hasInvoiceDoc = columnNames.includes('invoiceDocument');
          const hasInvoiceNum = columnNames.includes('invoiceNumber');
          
          console.log(`✅ Auction table columns: ${columnNames.join(', ')}`);
          console.log(`${hasInvoiceDoc ? '✅' : '❌'} invoiceDocument column exists`);
          console.log(`${hasInvoiceNum ? '✅' : '❌'} invoiceNumber column exists`);
          
          if (!hasInvoiceDoc || !hasInvoiceNum) {
            console.log('\n⚠️  Missing invoice columns. Run the database fix script.');
          }
        }
        resolve();
      });
    });
    
    // Check puppeteer installation
    console.log('\n4. Checking puppeteer installation...');
    try {
      require('puppeteer');
      console.log('✅ Puppeteer is installed');
    } catch (err) {
      console.log('❌ Puppeteer is not installed - system will use HTML fallback');
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('\n✅ Database closed successfully');
      }
    });
    
    console.log('\n🎉 Basic system check completed!');
    console.log('\nNext steps:');
    console.log('1. If database tables are missing, run: node check-and-fix-database.js');
    console.log('2. If puppeteer is missing, it will be installed automatically');
    console.log('3. Try starting the server: npm run dev');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBasicInvoiceSystem();
