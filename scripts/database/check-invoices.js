import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'auction.db'));

console.log('Checking recent payments with invoice numbers...');
const paymentsWithInvoice = db.prepare(`
  SELECT id, auction_id, winner_id, amount, invoice_number, status, created_at, updated_at
  FROM payments 
  WHERE invoice_number IS NOT NULL
  ORDER BY id DESC
  LIMIT 5
`).all();

console.log('Payments with invoice numbers:');
paymentsWithInvoice.forEach(payment => {
  console.log(`- Payment ID: ${payment.id}, Auction: ${payment.auction_id}, Invoice: ${payment.invoice_number}`);
});

console.log('\nChecking auction 44 details...');
const auction44 = db.prepare("SELECT * FROM auctions WHERE id = 44").get();
console.log('Auction 44:', auction44);

console.log('\nChecking payment for auction 44...');
const payment44 = db.prepare("SELECT * FROM payments WHERE auction_id = 44").get();
console.log('Payment for auction 44:', payment44);

db.close();
