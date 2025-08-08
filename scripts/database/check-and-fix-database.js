import Database from 'better-sqlite3';
import { resolve } from 'path';

async function checkAndFixDatabase() {
  console.log('🔧 Checking database for errors...\n');

  try {
    const dbPath = resolve(process.cwd(), 'auction.db');
    const db = new Database(dbPath);
    
    console.log('✅ Database connection established');
    
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
    console.log(`  invoice_document: ${hasInvoiceDoc ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  invoice_number: ${hasInvoiceNum ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Add missing fields
    let needsUpdate = false;
    if (!hasInvoiceDoc) {
      console.log('\n🔧 Adding invoice_document column...');
      db.exec('ALTER TABLE auctions ADD COLUMN invoice_document TEXT');
      console.log('✅ Added invoice_document column');
      needsUpdate = true;
    }
    
    if (!hasInvoiceNum) {
      console.log('\n🔧 Adding invoice_number column...');
      db.exec('ALTER TABLE auctions ADD COLUMN invoice_number TEXT');
      console.log('✅ Added invoice_number column');
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      console.log('\n✅ Database schema updated successfully!');
    } else {
      console.log('\n✅ Database schema is up to date!');
    }
    
    // Check data
    const auctionCount = db.prepare("SELECT COUNT(*) as count FROM auctions").get();
    const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
    
    console.log(`\n📊 Database statistics:`);
    console.log(`  Total auctions: ${auctionCount.count}`);
    console.log(`  Total categories: ${categoryCount.count}`);
    console.log(`  Total users: ${userCount.count}`);
    
    if (auctionCount.count === 0) {
      console.log('\n⚠️  No auctions found. Creating sample data...');
      
      // Create sample auctions if none exist
      const now = Date.now();
      const endTime = now + (7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const auctions = [
        {
          title: 'Honda CBR150R 2020 - Kondisi Prima',
          description: 'Motor sport Honda CBR150R tahun 2020 dengan kondisi sangat baik. Mesin halus, body mulus, surat lengkap.',
          starting_price: 25000000,
          current_price: 25000000,
          condition: 'good',
          location: 'Jakarta Selatan',
          end_time: endTime,
          category_id: 1,
          production_year: 2020,
          plate_number: 'B 1234 ABC',
          chassis_number: 'MH1234567890',
          engine_number: 'CBR150R001'
        },
        {
          title: 'Toyota Avanza 2019 - Mobil Keluarga',
          description: 'Toyota Avanza 2019 terawat, service rutin, interior bersih, cocok untuk keluarga.',
          starting_price: 150000000,
          current_price: 150000000,
          condition: 'good',
          location: 'Surabaya',
          end_time: endTime,
          category_id: 2,
          production_year: 2019,
          plate_number: 'L 5678 DEF',
          chassis_number: 'MHFM123456789',
          engine_number: 'AVZ19001'
        }
      ];
      
      const insertAuction = db.prepare(`
        INSERT INTO auctions (
          title, description, starting_price, current_price, condition, 
          location, end_time, category_id, production_year, plate_number,
          chassis_number, engine_number, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      auctions.forEach(auction => {
        insertAuction.run(
          auction.title, auction.description, auction.starting_price,
          auction.current_price, auction.condition, auction.location,
          auction.end_time, auction.category_id, auction.production_year,
          auction.plate_number, auction.chassis_number, auction.engine_number, now
        );
      });
      
      console.log(`✅ Created ${auctions.length} sample auctions`);
    }
    
    // Check for any auctions with invoices
    const auctionsWithInvoices = db.prepare(`
      SELECT id, title, invoice_number, 
      CASE WHEN invoice_document IS NOT NULL THEN 'Yes' ELSE 'No' END as has_document
      FROM auctions 
      WHERE invoice_number IS NOT NULL 
      LIMIT 5
    `).all();
    
    if (auctionsWithInvoices.length > 0) {
      console.log('\n📄 Auctions with invoices:');
      auctionsWithInvoices.forEach(auction => {
        console.log(`  ID: ${auction.id}, Title: ${auction.title}`);
        console.log(`    Invoice: ${auction.invoice_number}, Document: ${auction.has_document}`);
      });
    } else {
      console.log('\n📄 No invoices found in database yet');
    }
    
    db.close();
    console.log('\n✅ Database check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    console.error('Stack:', error.stack);
  }
}

checkAndFixDatabase();
