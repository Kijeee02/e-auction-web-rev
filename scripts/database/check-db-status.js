const Database = require('better-sqlite3');
const { resolve } = require('path');

const dbPath = resolve(process.cwd(), 'auction.db');

try {
  const db = new Database(dbPath);
  
  console.log('✓ Database file exists');
  
  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));
  
  // Check auctions table structure
  if (tables.some(t => t.name === 'auctions')) {
    const auctionColumns = db.prepare("PRAGMA table_info(auctions)").all();
    console.log('\nAuctions table columns:');
    auctionColumns.forEach(col => {
      console.log(`  ${col.name} (${col.type})`);
    });
    
    // Check if we have invoice fields
    const hasInvoiceDoc = auctionColumns.some(col => col.name === 'invoice_document');
    const hasInvoiceNum = auctionColumns.some(col => col.name === 'invoice_number');
    console.log(`\nInvoice fields present:`);
    console.log(`  invoice_document: ${hasInvoiceDoc}`);
    console.log(`  invoice_number: ${hasInvoiceNum}`);
    
    // Count auctions
    const auctionCount = db.prepare("SELECT COUNT(*) as count FROM auctions").get();
    console.log(`\nTotal auctions: ${auctionCount.count}`);
    
    // Check for any auctions
    const sampleAuctions = db.prepare("SELECT id, title, status FROM auctions LIMIT 5").all();
    console.log('\nSample auctions:');
    sampleAuctions.forEach(a => {
      console.log(`  ID: ${a.id}, Title: ${a.title}, Status: ${a.status}`);
    });
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
  
  if (error.code === 'SQLITE_CANTOPEN') {
    console.log('Database file does not exist - need to initialize');
  }
}
