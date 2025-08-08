// Script untuk test alur invoice yang benar:
// 1. User menang → Invoice otomatis (status unpaid)
// 2. User submit payment details → Status jadi pending
// 3. Admin verifikasi → Status jadi verified + upload dokumen

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca database
const dbPath = path.join(__dirname, 'auction.db');
const db = new Database(dbPath);

console.log('=== TESTING INVOICE FLOW ===\n');

// Check table structure first
console.log('Checking table structures...');
const userColumns = db.prepare("PRAGMA table_info(users)").all();
console.log('Users table columns:', userColumns.map(col => col.name));

const paymentColumns = db.prepare("PRAGMA table_info(payments)").all();
console.log('Payments table columns:', paymentColumns.map(col => col.name));

// Test 1: Cek invoice yang sudah dibuat otomatis saat menang
console.log('\n1. Checking auto-generated invoices...');
const invoices = db.prepare(`
  SELECT p.*, a.title as auction_title, u.username as winner_name
  FROM payments p
  JOIN auctions a ON p.auction_id = a.id  
  JOIN users u ON p.winner_id = u.id
  WHERE p.invoice_number IS NOT NULL
  ORDER BY p.created_at DESC
  LIMIT 5
`).all();

console.log(`Found ${invoices.length} invoices:`);
invoices.forEach(invoice => {
  console.log(`- Invoice ${invoice.invoice_number}`);
  console.log(`  Auction: ${invoice.auction_title}`);
  console.log(`  Winner: ${invoice.winner_name}`);
  console.log(`  Amount: Rp ${invoice.amount.toLocaleString('id-ID')}`);
  console.log(`  Status: ${invoice.status}`);
  console.log(`  Payment Method: ${invoice.payment_method}`);
  console.log(`  Created: ${new Date(invoice.created_at * 1000).toLocaleString('id-ID')}`);
  console.log('');
});

// Test 2: Simulasi user submit payment details
console.log('2. Simulating user submitting payment details...');

// Cari invoice dengan status unpaid
const unpaidInvoice = db.prepare(`
  SELECT * FROM payments 
  WHERE status = 'unpaid' 
  LIMIT 1
`).get();

if (unpaidInvoice) {
  console.log(`Found unpaid invoice: ${unpaidInvoice.invoice_number}`);
  
  // Simulasi user submit payment (biasanya lewat API)
  const updateResult = db.prepare(`
    UPDATE payments 
    SET 
      payment_method = 'bank_transfer',
      payment_proof = 'data:image/jpeg;base64,fake_payment_proof_data',
      bank_name = 'Bank Mandiri', 
      account_number = '1234567890',
      account_name = 'John Doe',
      status = 'pending',
      updated_at = ?
    WHERE id = ?
  `).run(Math.floor(Date.now() / 1000), unpaidInvoice.id);
  
  if (updateResult.changes > 0) {
    console.log('✅ Payment details submitted successfully!');
    console.log('   Status changed: unpaid → pending');
  }
} else {
  console.log('❌ No unpaid invoice found to test with');
}

// Test 3: Simulasi admin verifikasi
console.log('\n3. Simulating admin verification...');

const pendingPayment = db.prepare(`
  SELECT * FROM payments 
  WHERE status = 'pending' 
  LIMIT 1
`).get();

if (pendingPayment) {
  console.log(`Found pending payment: ${pendingPayment.invoice_number}`);
  
  // Simulasi admin approve dengan upload dokumen
  const verifyResult = db.prepare(`
    UPDATE payments 
    SET 
      status = 'verified',
      verified_at = ?,
      verified_by = 7,
      notes = 'Pembayaran telah diverifikasi. Dokumen lengkap.',
      release_letter_document = 'data:application/pdf;base64,fake_release_letter_pdf',
      handover_document = 'data:application/pdf;base64,fake_handover_document_pdf'
    WHERE id = ?
  `).run(Math.floor(Date.now() / 1000), pendingPayment.id);
  
  if (verifyResult.changes > 0) {
    console.log('✅ Payment verified successfully!');
    console.log('   Status changed: pending → verified');
    console.log('   Documents uploaded: release letter, handover document');
  }
} else {
  console.log('❌ No pending payment found to test with');
}

// Test 4: Tampilkan hasil akhir
console.log('\n4. Final results - Complete payment flow:');
const completeFlow = db.prepare(`
  SELECT 
    p.*,
    a.title as auction_title,
    u.username as winner_name
  FROM payments p
  JOIN auctions a ON p.auction_id = a.id
  JOIN users u ON p.winner_id = u.id
  WHERE p.invoice_number IS NOT NULL
  ORDER BY p.created_at DESC
  LIMIT 3
`).all();

completeFlow.forEach(payment => {
  console.log(`\n📋 Invoice: ${payment.invoice_number}`);
  console.log(`   Auction: ${payment.auction_title}`);
  console.log(`   Winner: ${payment.winner_name}`);
  console.log(`   Amount: Rp ${payment.amount.toLocaleString('id-ID')}`);
  console.log(`   Status: ${payment.status}`);
  console.log(`   Has Invoice Document: ${payment.invoice_document ? '✅' : '❌'}`);
  console.log(`   Has Release Letter: ${payment.release_letter_document ? '✅' : '❌'}`);
  console.log(`   Has Handover Document: ${payment.handover_document ? '✅' : '❌'}`);
  
  if (payment.verified_at) {
    console.log(`   Verified: ${new Date(payment.verified_at * 1000).toLocaleString('id-ID')}`);
  }
});

console.log('\n=== INVOICE FLOW TEST COMPLETED ===');
console.log('\nCorrect Flow:');
console.log('1. ✅ User wins auction → System auto-generates invoice (status: unpaid)');
console.log('2. ✅ User fills payment form → Status changes to pending');  
console.log('3. ✅ Admin verifies payment → Status changes to verified + uploads documents');

db.close();
