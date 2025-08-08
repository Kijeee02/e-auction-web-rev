import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'auction.db'));

console.log('Checking payments table structure...');
const schema = db.prepare("PRAGMA table_info(payments)").all();
console.log('Payments table columns:');
schema.forEach(col => {
  console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
});

console.log('\nSample payment data:');
const payments = db.prepare("SELECT * FROM payments LIMIT 3").all();
console.log(payments);

db.close();
