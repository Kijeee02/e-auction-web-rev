import { initializeDatabase } from './server/db.js';

console.log('🔧 Running database initialization and fixes...\n');

try {
  // Initialize database with all migrations
  initializeDatabase();
  console.log('✅ Database initialization completed successfully!\n');
  
  // Test the connection
  console.log('Testing database connection...');
  const Database = (await import('better-sqlite3')).default;
  const { resolve } = await import('path');
  
  const dbPath = resolve(process.cwd(), 'auction.db');
  const db = new Database(dbPath);
  
  // Quick test
  const auctionCount = db.prepare("SELECT COUNT(*) as count FROM auctions").get();
  const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get();
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  
  console.log('📊 Database statistics:');
  console.log(`   Auctions: ${auctionCount.count}`);
  console.log(`   Categories: ${categoryCount.count}`);
  console.log(`   Users: ${userCount.count}`);
  
  if (auctionCount.count === 0) {
    console.log('\n⚠️  No auctions found. Creating sample data...');
    
    // Create an admin user if none exists
    if (userCount.count === 0) {
      const bcrypt = (await import('bcrypt')).default;
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      db.prepare(`
        INSERT INTO users (username, password, email, first_name, last_name, role, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('admin', hashedPassword, 'admin@auction.com', 'System', 'Admin', 'admin', Date.now());
      
      console.log('✅ Created admin user (username: admin, password: admin123)');
    }
    
    // Create sample auctions
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
      },
      {
        title: 'Yamaha NMAX 2021 - Matic Trendy',
        description: 'Yamaha NMAX 2021 warna hitam, kondisi istimewa, km rendah.',
        starting_price: 30000000,
        current_price: 30000000,
        condition: 'like_new',
        location: 'Bandung',
        end_time: endTime,
        category_id: 1,
        production_year: 2021,
        plate_number: 'D 9999 XYZ',
        chassis_number: 'MH2234567890',
        engine_number: 'NMAX21001'
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
  
  db.close();
  
  console.log('\n🎉 All fixes completed successfully!');
  console.log('\nTo start the application:');
  console.log('  npm run dev');
  
} catch (error) {
  console.error('❌ Error during database initialization:', error);
  console.error('Stack trace:', error.stack);
}
