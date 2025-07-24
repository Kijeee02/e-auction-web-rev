
const Database = require('better-sqlite3');
const { resolve } = require('path');

const dbPath = resolve(process.cwd(), 'auction.db');
const db = new Database(dbPath);

try {
  // Tambah kolom archived jika belum ada
  db.exec(`ALTER TABLE auctions ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;`);
  console.log('✓ Kolom archived berhasil ditambahkan');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('✓ Kolom archived sudah ada');
  } else {
    console.error('Error:', error.message);
  }
} finally {
  db.close();
}
