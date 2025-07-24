import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import { resolve } from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// Create SQLite database file in the project root
const dbPath = resolve(process.cwd(), 'auction.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

// Initialize database tables
export function initializeDatabase() {
  try {
    // Create tables manually since we're not using migrations yet
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        rating REAL DEFAULT 0.00,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS auctions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          starting_price REAL NOT NULL,
          current_price REAL NOT NULL,
          minimum_increment REAL NOT NULL DEFAULT 50000,
          condition TEXT NOT NULL,
          location TEXT NOT NULL,
          image_url TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          start_time INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          end_time INTEGER NOT NULL,
          category_id INTEGER NOT NULL REFERENCES categories(id),
          winner_id INTEGER REFERENCES users(id),
          archived INTEGER NOT NULL DEFAULT 0,
          production_year INTEGER,
          plate_number TEXT,
          chassis_number TEXT,
          engine_number TEXT,
          document_info TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        bidder_id INTEGER NOT NULL REFERENCES users(id),
        auction_id INTEGER NOT NULL REFERENCES auctions(id),
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        auction_id INTEGER NOT NULL REFERENCES auctions(id),
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Insert default categories
    const categoriesExist = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    if (categoriesExist.count === 0) {
      sqlite.exec(`
        INSERT INTO categories (name, description) VALUES
        ('Elektronik', 'Perangkat elektronik dan gadget'),
        ('Kendaraan', 'Motor dan mobil bekas'),
        ('Rumah & Taman', 'Furniture dan peralatan rumah'),
        ('Fashion', 'Pakaian dan aksesoris'),
        ('Hobi & Koleksi', 'Barang koleksi dan hobi'),
        ('Olahraga', 'Peralatan olahraga');
      `);
    }

    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}