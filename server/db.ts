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
        avatar TEXT DEFAULT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        rating REAL DEFAULT 0.00,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      -- Add avatar column if it doesn't exist (for existing databases)
      PRAGMA table_info(users);
    `);

    // Check if avatar column exists, if not add it
    const columns = sqlite.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    const hasAvatarColumn = columns.some(col => col.name === 'avatar');
    
    if (!hasAvatarColumn) {
      sqlite.exec(`ALTER TABLE users ADD COLUMN avatar TEXT;`);
      console.log('✓ Added avatar column to users table');
    }

    sqlite.exec(`
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

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        auction_id INTEGER NOT NULL REFERENCES auctions(id),
        winner_id INTEGER NOT NULL REFERENCES users(id),
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_proof TEXT,
        bank_name TEXT,
        account_number TEXT,
        account_name TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        verified_at INTEGER,
        verified_by INTEGER REFERENCES users(id),
        invoice_document TEXT,
        release_letter_document TEXT,
        handover_document TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Jangan hapus data production!
    // Jika ingin seed data kategori, lakukan hanya jika tabel kosong
    const row = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number } | undefined;
    const count = row?.count ?? 0;
    if (count === 0) {
      sqlite.exec(`
        INSERT INTO categories (name, description) VALUES
        ('Motor', 'Sepeda motor bekas'),
        ('Mobil', 'Mobil bekas');
      `);
    }

    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}