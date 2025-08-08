console.log('Testing simple script...');

import Database from 'better-sqlite3';
const db = new Database('auction.db');

console.log('Database connected successfully');

// Test sederhana
const result = db.prepare('SELECT COUNT(*) as count FROM auctions').get();
console.log('Total auctions:', result.count);

db.close();
console.log('Test completed');
