import { initializeDatabase } from './server/db.js';

console.log('Initializing database...');
initializeDatabase();
console.log('Database initialization completed.');

// Test importing storage
try {
  const { DatabaseStorage } = await import('./server/storage.js');
  console.log('✓ Storage module imported successfully');
  
  const storage = new DatabaseStorage();
  console.log('✓ Storage instance created');
  
  // Test basic operations
  const categories = await storage.getCategories();
  console.log(`✓ Found ${categories.length} categories`);
  
  const auctions = await storage.getAuctions();
  console.log(`✓ Found ${auctions.length} auctions`);
  
  if (auctions.length === 0) {
    console.log('⚠️  No auctions found - this might be why the data appears missing');
  }
  
} catch (error) {
  console.error('❌ Error testing storage:', error);
}
