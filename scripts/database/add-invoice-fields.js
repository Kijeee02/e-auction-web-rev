import Database from 'better-sqlite3';

const db = new Database('auction.db');

try {
  // Add invoice fields to auctions table
  db.exec('ALTER TABLE auctions ADD COLUMN invoice_document TEXT');
  console.log('✅ Added invoice_document column');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️ invoice_document column already exists');
  } else {
    console.error('❌ Error adding invoice_document:', error.message);
  }
}

try {
  db.exec('ALTER TABLE auctions ADD COLUMN invoice_number TEXT');
  console.log('✅ Added invoice_number column');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️ invoice_number column already exists');
  } else {
    console.error('❌ Error adding invoice_number:', error.message);
  }
}

console.log('🎉 Migration completed successfully!');
db.close();
