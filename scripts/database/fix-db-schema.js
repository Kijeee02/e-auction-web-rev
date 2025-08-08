import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'auction.db');

try {
  const db = new Database(dbPath);
  
  console.log('✓ Database connection established');
  
  // Check auctions table structure
  const auctionColumns = db.prepare("PRAGMA table_info(auctions)").all();
  console.log('\nCurrent auctions table columns:');
  auctionColumns.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
  
  // Check if we have invoice fields
  const hasInvoiceDoc = auctionColumns.some(col => col.name === 'invoice_document');
  const hasInvoiceNum = auctionColumns.some(col => col.name === 'invoice_number');
  
  console.log(`\nInvoice fields status:`);
  console.log(`  invoice_document: ${hasInvoiceDoc ? '✓ EXISTS' : '✗ MISSING'}`);
  console.log(`  invoice_number: ${hasInvoiceNum ? '✓ EXISTS' : '✗ MISSING'}`);
  
  // Add missing fields
  if (!hasInvoiceDoc) {
    console.log('\nAdding invoice_document column...');
    db.exec('ALTER TABLE auctions ADD COLUMN invoice_document TEXT');
    console.log('✓ Added invoice_document column');
  }
  
  if (!hasInvoiceNum) {
    console.log('\nAdding invoice_number column...');
    db.exec('ALTER TABLE auctions ADD COLUMN invoice_number TEXT');
    console.log('✓ Added invoice_number column');
  }
  
  // Count auctions and show sample
  const auctionCount = db.prepare("SELECT COUNT(*) as count FROM auctions").get();
  console.log(`\nDatabase status:`);
  console.log(`  Total auctions: ${auctionCount.count}`);
  
  if (auctionCount.count > 0) {
    const sampleAuctions = db.prepare("SELECT id, title, status, winner_id FROM auctions LIMIT 5").all();
    console.log('\nSample auctions:');
    sampleAuctions.forEach(a => {
      console.log(`  ID: ${a.id}, Title: ${a.title}, Status: ${a.status}, Winner: ${a.winner_id || 'None'}`);
    });
  } else {
    console.log('  ⚠️  No auctions found in database!');
  }
  
  // Check categories
  const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get();
  console.log(`  Total categories: ${categoryCount.count}`);
  
  // Check users
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  console.log(`  Total users: ${userCount.count}`);
  
  db.close();
  console.log('\n✓ Database check completed');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}
