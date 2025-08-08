import Database from 'better-sqlite3';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixAllIssues() {
  console.log('🔧 Starting comprehensive database and system fix...\n');
  
  try {
    // 1. Check and fix database schema
    console.log('1. Checking database schema...');
    const dbPath = resolve(process.cwd(), 'auction.db');
    const db = new Database(dbPath);
    
    // Check auctions table structure
    const auctionColumns = db.prepare("PRAGMA table_info(auctions)").all();
    const hasInvoiceDoc = auctionColumns.some(col => col.name === 'invoice_document');
    const hasInvoiceNum = auctionColumns.some(col => col.name === 'invoice_number');
    
    console.log(`   Invoice document column: ${hasInvoiceDoc ? '✓' : '✗'}`);
    console.log(`   Invoice number column: ${hasInvoiceNum ? '✓' : '✗'}`);
    
    // Add missing columns
    if (!hasInvoiceDoc) {
      console.log('   Adding invoice_document column...');
      db.exec('ALTER TABLE auctions ADD COLUMN invoice_document TEXT');
      console.log('   ✓ Added invoice_document column');
    }
    
    if (!hasInvoiceNum) {
      console.log('   Adding invoice_number column...');
      db.exec('ALTER TABLE auctions ADD COLUMN invoice_number TEXT');
      console.log('   ✓ Added invoice_number column');
    }
    
    // 2. Check data existence
    console.log('\\n2. Checking data existence...');
    const counts = {
      users: db.prepare("SELECT COUNT(*) as count FROM users").get().count,
      categories: db.prepare("SELECT COUNT(*) as count FROM categories").get().count,
      auctions: db.prepare("SELECT COUNT(*) as count FROM auctions").get().count,
      bids: db.prepare("SELECT COUNT(*) as count FROM bids").get().count
    };
    
    console.log(`   Users: ${counts.users}`);
    console.log(`   Categories: ${counts.categories}`);
    console.log(`   Auctions: ${counts.auctions}`);
    console.log(`   Bids: ${counts.bids}`);
    
    // 3. If no data, create sample data
    if (counts.auctions === 0) {
      console.log('\\n3. No auctions found - creating sample data...');
      
      // Ensure we have categories
      if (counts.categories === 0) {
        console.log('   Creating categories...');
        db.prepare(`
          INSERT INTO categories (name, description) VALUES 
          ('Motor', 'Sepeda motor bekas'),
          ('Mobil', 'Mobil bekas')
        `).run();
        console.log('   ✓ Created categories');
      }
      
      // Ensure we have a user
      if (counts.users === 0) {
        console.log('   Creating admin user...');
        db.prepare(`
          INSERT INTO users (username, password, email, first_name, last_name, role, created_at) VALUES 
          ('admin', '$2b$10$rGtF8qwzqLmQkSbxLGR7UOKQEqLqZtJHf5qF7J5cLyF3f3f3f3f3f', 'admin@example.com', 'Admin', 'User', 'admin', ${Date.now()})
        `).run();
        console.log('   ✓ Created admin user');
      }
      
      // Create sample auctions
      console.log('   Creating sample auctions...');
      const now = Date.now();
      const endTime = now + (24 * 60 * 60 * 1000); // 24 hours from now
      
      const sampleAuctions = [
        {
          title: 'Honda CBR150R 2020',
          description: 'Motor sport Honda CBR150R tahun 2020 kondisi sangat baik',
          starting_price: 25000000,
          current_price: 25000000,
          condition: 'good',
          location: 'Jakarta',
          end_time: endTime,
          category_id: 1,
          production_year: 2020,
          plate_number: 'B 1234 ABC'
        },
        {
          title: 'Toyota Avanza 2019',
          description: 'Mobil keluarga Toyota Avanza 2019 terawat',
          starting_price: 150000000,
          current_price: 150000000,
          condition: 'good',
          location: 'Surabaya',
          end_time: endTime,
          category_id: 2,
          production_year: 2019,
          plate_number: 'L 5678 DEF'
        }
      ];
      
      const insertAuction = db.prepare(`
        INSERT INTO auctions (
          title, description, starting_price, current_price, condition, 
          location, end_time, category_id, production_year, plate_number, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      sampleAuctions.forEach(auction => {
        insertAuction.run(
          auction.title, auction.description, auction.starting_price,
          auction.current_price, auction.condition, auction.location,
          auction.end_time, auction.category_id, auction.production_year,
          auction.plate_number, now
        );
      });
      
      console.log('   ✓ Created sample auctions');
    }
    
    // 4. Final verification
    console.log('\\n4. Final verification...');
    const finalCounts = {
      users: db.prepare("SELECT COUNT(*) as count FROM users").get().count,
      categories: db.prepare("SELECT COUNT(*) as count FROM categories").get().count,
      auctions: db.prepare("SELECT COUNT(*) as count FROM auctions").get().count
    };
    
    console.log(`   Users: ${finalCounts.users}`);
    console.log(`   Categories: ${finalCounts.categories}`);
    console.log(`   Auctions: ${finalCounts.auctions}`);
    
    // Show sample auctions
    const sampleAuctions = db.prepare("SELECT id, title, status FROM auctions LIMIT 3").all();
    console.log('\\n   Sample auctions:');
    sampleAuctions.forEach(a => {
      console.log(`     ID: ${a.id}, Title: ${a.title}, Status: ${a.status}`);
    });
    
    db.close();
    
    // 5. Test storage module
    console.log('\\n5. Testing storage module...');
    try {
      const { DatabaseStorage } = await import('./server/storage.js');
      const storage = new DatabaseStorage();
      
      const auctions = await storage.getAuctions();
      console.log(`   ✓ Storage test successful - found ${auctions.length} auctions`);
      
      if (auctions.length > 0) {
        console.log(`   ✓ First auction: "${auctions[0].title}"`);
      }
      
    } catch (storageError) {
      console.error('   ❌ Storage test failed:', storageError.message);
      console.error('   Stack:', storageError.stack);
    }
    
    console.log('\\n🎉 Database fix completed successfully!');
    console.log('\\nNext steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Check if auctions appear on the frontend');
    console.log('3. Test the invoice generation system');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.error('Stack:', error.stack);
  }
}

fixAllIssues();
