import Database from 'better-sqlite3';

const db = new Database('auction.db');

console.log('Checking auctions table structure...');
const columns = db.prepare("PRAGMA table_info(auctions)").all();
console.log('Auctions table columns:', columns.map(col => col.name));

const hasInvoiceDocument = columns.some(col => col.name === 'invoice_document');
const hasInvoiceNumber = columns.some(col => col.name === 'invoice_number');

console.log('Has invoice_document:', hasInvoiceDocument);
console.log('Has invoice_number:', hasInvoiceNumber);

if (!hasInvoiceDocument || !hasInvoiceNumber) {
  console.log('Adding missing columns...');
  
  if (!hasInvoiceDocument) {
    try {
      db.exec('ALTER TABLE auctions ADD COLUMN invoice_document TEXT');
      console.log('✅ Added invoice_document column');
    } catch (error) {
      console.error('❌ Error adding invoice_document:', error.message);
    }
  }
  
  if (!hasInvoiceNumber) {
    try {
      db.exec('ALTER TABLE auctions ADD COLUMN invoice_number TEXT');
      console.log('✅ Added invoice_number column');
    } catch (error) {
      console.error('❌ Error adding invoice_number:', error.message);
    }
  }
} else {
  console.log('✅ All columns already exist');
}

db.close();
