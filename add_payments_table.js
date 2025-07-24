
const Database = require('better-sqlite3');
const db = new Database('./auction.db');

try {
  // Create payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auction_id INTEGER NOT NULL REFERENCES auctions(id),
      winner_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_proof TEXT,
      bank_name TEXT,
      account_number TEXT,
      account_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      verified_at INTEGER,
      verified_by INTEGER REFERENCES users(id)
    )
  `);

  console.log('✓ Payments table created successfully');
  
} catch (error) {
  console.error('Error creating payments table:', error);
} finally {
  db.close();
}
