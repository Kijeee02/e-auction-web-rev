import { DatabaseStorage } from './server/storage.js';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    const storage = new DatabaseStorage();
    
    // Test basic operations
    const auctions = await storage.getAuctions();
    console.log(`Found ${auctions.length} auctions`);
    
    if (auctions.length > 0) {
      console.log('Sample auction:', auctions[0].title);
    } else {
      console.log('No auctions found - data might be missing');
    }
    
    // Test categories
    const categories = await storage.getCategories();
    console.log(`Found ${categories.length} categories`);
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();
