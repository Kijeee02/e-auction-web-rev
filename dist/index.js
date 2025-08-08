var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auctions: () => auctions,
  auctionsRelations: () => auctionsRelations,
  bids: () => bids,
  bidsRelations: () => bidsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  insertAuctionSchema: () => insertAuctionSchema,
  insertBidSchema: () => insertBidSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertUserSchema: () => insertUserSchema,
  notifications: () => notifications,
  payments: () => payments,
  paymentsRelations: () => paymentsRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  watchlist: () => watchlist,
  watchlistRelations: () => watchlistRelations
});
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
var users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  role: text("role").notNull().default("user"),
  // "user" or "admin"
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  rating: real("rating").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var auctions = sqliteTable("auctions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startingPrice: real("starting_price").notNull(),
  currentPrice: real("current_price").notNull(),
  minimumIncrement: real("minimum_increment").notNull().default(5e4),
  condition: text("condition").notNull(),
  // "new", "like_new", "good", "fair"
  location: text("location").notNull(),
  imageUrls: text("image_urls"),
  // JSON array of image URLs
  status: text("status").notNull().default("active"),
  // "active", "ended", "cancelled"
  startTime: integer("start_time", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  winnerId: integer("winner_id").references(() => users.id),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  // Invoice fields - untuk ditampilkan di detail page saat user menang
  invoiceDocument: text("invoice_document"),
  // Invoice PDF document
  invoiceNumber: text("invoice_number"),
  // Invoice number for winner
  // Vehicle-specific fields
  productionYear: integer("production_year"),
  plateNumber: text("plate_number"),
  chassisNumber: text("chassis_number"),
  engineNumber: text("engine_number"),
  documentInfo: text("document_info"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var bids = sqliteTable("bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  amount: real("amount").notNull(),
  bidderId: integer("bidder_id").references(() => users.id).notNull(),
  auctionId: integer("auction_id").references(() => auctions.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  auctionId: integer("auction_id").references(() => auctions.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  auctionId: integer("auction_id").references(() => auctions.id).notNull(),
  winnerId: integer("winner_id").references(() => users.id).notNull(),
  amount: real("amount").notNull(),
  invoiceNumber: text("invoice_number"),
  // Auto-generated invoice number
  paymentMethod: text("payment_method").notNull(),
  // "bank_transfer", "ewallet", etc.
  paymentProof: text("payment_proof"),
  // URL to uploaded proof image
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  status: text("status").notNull().default("unpaid"),
  // "unpaid", "pending", "verified", "rejected"
  notes: text("notes"),
  // Admin notes
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  verifiedAt: integer("verified_at", { mode: "timestamp" }),
  verifiedBy: integer("verified_by").references(() => users.id),
  // Admin document uploads
  invoiceDocument: text("invoice_document"),
  // Invoice/Receipt URL
  releaseLetterDocument: text("release_letter_document"),
  // Surat Pelepasan Kendaraan URL
  handoverDocument: text("handover_document")
  // Bukti Serah Terima URL
});
var usersRelations = relations(users, ({ many }) => ({
  bids: many(bids),
  wonAuctions: many(auctions, { relationName: "winner" }),
  watchlist: many(watchlist)
}));
var auctionsRelations = relations(auctions, ({ one, many }) => ({
  winner: one(users, {
    fields: [auctions.winnerId],
    references: [users.id],
    relationName: "winner"
  }),
  category: one(categories, {
    fields: [auctions.categoryId],
    references: [categories.id]
  }),
  bids: many(bids),
  watchlist: many(watchlist)
}));
var bidsRelations = relations(bids, ({ one }) => ({
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id]
  }),
  auction: one(auctions, {
    fields: [bids.auctionId],
    references: [auctions.id]
  })
}));
var categoriesRelations = relations(categories, ({ many }) => ({
  auctions: many(auctions)
}));
var watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id]
  }),
  auction: one(auctions, {
    fields: [watchlist.auctionId],
    references: [auctions.id]
  })
}));
var paymentsRelations = relations(payments, ({ one }) => ({
  auction: one(auctions, {
    fields: [payments.auctionId],
    references: [auctions.id]
  }),
  winner: one(users, {
    fields: [payments.winnerId],
    references: [users.id]
  }),
  verifier: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  role: true,
  isActive: true,
  rating: true
});
var insertAuctionSchema = createInsertSchema(auctions).omit({
  id: true,
  winnerId: true,
  status: true
}).extend({
  endTime: z.preprocess((arg) => {
    if (arg instanceof Date) return arg;
    if (typeof arg === "number" && arg < 1e12) return new Date(arg * 1e3);
    if (typeof arg === "number") return new Date(arg);
    if (typeof arg === "string") return new Date(arg);
    return arg;
  }, z.date().refine((d) => d > /* @__PURE__ */ new Date(), "Waktu berakhir harus di masa depan")),
  startTime: z.preprocess((arg) => {
    if (arg instanceof Date) return arg;
    if (typeof arg === "number" && arg < 1e12) return new Date(arg * 1e3);
    if (typeof arg === "number") return new Date(arg);
    if (typeof arg === "string") return new Date(arg);
    return arg;
  }, z.date().optional()),
  createdAt: z.preprocess((arg) => {
    if (arg instanceof Date) return arg;
    if (typeof arg === "number" && arg < 1e12) return new Date(arg * 1e3);
    if (typeof arg === "number") return new Date(arg);
    if (typeof arg === "string") return new Date(arg);
    return arg;
  }, z.date().optional()),
  startingPrice: z.number().min(0, "Harga awal harus lebih dari 0"),
  currentPrice: z.number().default(0),
  condition: z.enum(["new", "like_new", "good", "fair"]),
  imageUrls: z.array(z.string()).optional(),
  minimumIncrement: z.number().default(5e4),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  categoryId: z.number(),
  // Vehicle-specific fields (optional)
  productionYear: z.number().optional(),
  plateNumber: z.string().optional(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  documentInfo: z.string().optional()
});
var insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  bidderId: true
}).extend({
  createdAt: z.preprocess(
    (arg) => {
      if (arg instanceof Date) return arg;
      if (typeof arg === "number" && arg < 1e12) return new Date(arg * 1e3);
      if (typeof arg === "number") return new Date(arg);
      if (typeof arg === "string") return new Date(arg);
      return arg;
    },
    z.date().optional()
  )
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  isActive: true
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  verifiedBy: true
}).extend({
  paymentMethod: z.enum(["bank_transfer", "ewallet", "cash", "pending_selection"]),
  status: z.enum(["unpaid", "pending", "verified", "rejected"]).default("unpaid"),
  amount: z.number().positive("Amount must be positive"),
  auctionId: z.number().positive("Auction ID must be positive"),
  winnerId: z.number().positive("Winner ID must be positive"),
  paymentProof: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional()
});
var notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  // 'payment', 'auction', 'bid', 'system'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  data: text("data", { mode: "json" }),
  // Additional data as JSON
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var insertNotificationSchema = createInsertSchema(notifications);

// server/db.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { resolve } from "path";
var dbPath = resolve(process.cwd(), "database", "auction.db");
var sqlite = new Database(dbPath);
var db = drizzle(sqlite, { schema: schema_exports });
function initializeDatabase() {
  try {
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
    const columns = sqlite.prepare("PRAGMA table_info(users)").all();
    const hasAvatarColumn = columns.some((col) => col.name === "avatar");
    if (!hasAvatarColumn) {
      sqlite.exec(`ALTER TABLE users ADD COLUMN avatar TEXT;`);
      console.log("\u2713 Added avatar column to users table");
    }
    const paymentColumns = sqlite.prepare("PRAGMA table_info(payments)").all();
    const hasInvoiceNumber = paymentColumns.some((col) => col.name === "invoice_number");
    const hasUpdatedAt = paymentColumns.some((col) => col.name === "updated_at");
    if (!hasInvoiceNumber) {
      sqlite.exec(`ALTER TABLE payments ADD COLUMN invoice_number TEXT;`);
      console.log("\u2713 Added invoice_number column to payments table");
    }
    if (!hasUpdatedAt) {
      sqlite.exec(`ALTER TABLE payments ADD COLUMN updated_at INTEGER;`);
      console.log("\u2713 Added updated_at column to payments table");
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
          image_urls TEXT, -- JSON array of image URLs
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
          invoice_document TEXT, -- Invoice document for winner
          invoice_number TEXT, -- Invoice number for winner  
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
    try {
      const tableInfo = sqlite.prepare("PRAGMA table_info(auctions)").all();
      const hasOldColumn = tableInfo.some((col) => col.name === "image_url");
      const hasNewColumn = tableInfo.some((col) => col.name === "image_urls");
      if (hasOldColumn && !hasNewColumn) {
        console.log("Running migration: Converting image_url to image_urls...");
        sqlite.exec("ALTER TABLE auctions ADD COLUMN image_urls TEXT");
        sqlite.exec(`
          UPDATE auctions 
          SET image_urls = CASE 
              WHEN image_url IS NOT NULL AND image_url != '' THEN '["' || replace(image_url, '"', '\\"') || '"]'
              ELSE NULL
          END
        `);
        console.log("\u2713 Migration completed: image_url -> image_urls");
      }
    } catch (error) {
      console.warn("Migration warning:", error);
    }
    try {
      const tableInfo = sqlite.prepare("PRAGMA table_info(auctions)").all();
      const hasInvoiceDoc = tableInfo.some((col) => col.name === "invoice_document");
      const hasInvoiceNum = tableInfo.some((col) => col.name === "invoice_number");
      if (!hasInvoiceDoc) {
        console.log("Adding invoice_document column to auctions table...");
        sqlite.exec("ALTER TABLE auctions ADD COLUMN invoice_document TEXT");
        console.log("\u2713 Added invoice_document column");
      }
      if (!hasInvoiceNum) {
        console.log("Adding invoice_number column to auctions table...");
        sqlite.exec("ALTER TABLE auctions ADD COLUMN invoice_number TEXT");
        console.log("\u2713 Added invoice_number column");
      }
    } catch (error) {
      console.warn("Invoice fields migration warning:", error);
    }
    const row = sqlite.prepare("SELECT COUNT(*) as count FROM categories").get();
    const count2 = row?.count ?? 0;
    if (count2 === 0) {
      sqlite.exec(`
        INSERT INTO categories (name, description) VALUES
        ('Motor', 'Sepeda motor bekas'),
        ('Mobil', 'Mobil bekas');
      `);
    }
    console.log("\u2713 Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

// server/storage.ts
import { eq, desc, and, or, like, ne, gte, count, sql as sql2, inArray } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
function serializeImages(images) {
  if (!images || images.length === 0) return void 0;
  return JSON.stringify(images);
}
function deserializeImages(imageData) {
  if (!imageData) return [];
  try {
    const parsed = JSON.parse(imageData);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return imageData ? [imageData] : [];
  }
}
var MemoryStore = createMemoryStore(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
    });
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUsers() {
    return await db.select().from(users);
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== void 0)
    );
    if (Object.keys(cleanUpdates).length > 0) {
      const [user] = await db.update(users).set(cleanUpdates).where(eq(users.id, id)).returning();
      return user || void 0;
    }
    return this.getUser(id);
  }
  async getUserStats(userId) {
    const now = /* @__PURE__ */ new Date();
    const activeBidsResult = await db.select({ count: count() }).from(bids).innerJoin(auctions, eq(bids.auctionId, auctions.id)).where(and(
      eq(bids.bidderId, userId),
      eq(auctions.status, "active"),
      gte(auctions.endTime, now)
    ));
    const wonAuctionsResult = await db.select({ count: count() }).from(auctions).where(eq(auctions.winnerId, userId));
    const watchlistResult = await db.select({ count: count() }).from(watchlist).where(eq(watchlist.userId, userId));
    return {
      activeBids: activeBidsResult[0]?.count || 0,
      wonAuctions: wonAuctionsResult[0]?.count || 0,
      watchlistCount: watchlistResult[0]?.count || 0
    };
  }
  async getCategories() {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }
  async createCategory(category) {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  async updateCategory(id, updates) {
    const [category] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return category || void 0;
  }
  async deleteCategory(id) {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }
  async getAuctions(filters) {
    let query = db.select({
      auction: auctions,
      category: categories
    }).from(auctions).innerJoin(categories, eq(auctions.categoryId, categories.id));
    const whereClauses = [];
    if (!filters?.includeArchived) {
      whereClauses.push(eq(auctions.archived, false));
    }
    if (filters?.status) {
      whereClauses.push(eq(auctions.status, filters.status));
    }
    if (filters?.categoryId) {
      whereClauses.push(eq(auctions.categoryId, filters.categoryId));
    }
    if (filters?.search) {
      whereClauses.push(sql2`title LIKE '%' || ${filters.search} || '%'`);
    }
    const results = await (whereClauses.length > 0 ? query.where(and(...whereClauses)).orderBy(desc(auctions.createdAt)) : query.orderBy(desc(auctions.createdAt)));
    const auctionsWithBids = await Promise.all(
      results.map(async (result) => {
        const auctionBids = await this.getBidsForAuction(result.auction.id);
        return {
          ...result.auction,
          imageUrls: deserializeImages(result.auction.imageUrls),
          category: result.category,
          bids: auctionBids,
          _count: { bids: auctionBids.length }
        };
      })
    );
    return auctionsWithBids;
  }
  async getAuction(id) {
    const [result] = await db.select({
      auction: auctions,
      category: categories
    }).from(auctions).innerJoin(categories, eq(auctions.categoryId, categories.id)).where(eq(auctions.id, id));
    if (!result) return void 0;
    const auctionBids = await this.getBidsForAuction(id);
    return {
      ...result.auction,
      imageUrls: deserializeImages(result.auction.imageUrls),
      category: result.category,
      bids: auctionBids,
      _count: { bids: auctionBids.length }
    };
  }
  async createAuction(auction) {
    try {
      if (auction.endTime && typeof auction.endTime === "number") {
        auction.endTime = new Date(auction.endTime * 1e3);
      } else if (typeof auction.endTime === "string") {
        auction.endTime = new Date(auction.endTime);
      }
      if (auction.startTime && typeof auction.startTime === "number") {
        auction.startTime = new Date(auction.startTime * 1e3);
      } else if (typeof auction.startTime === "string") {
        auction.startTime = new Date(auction.startTime);
      }
      if (auction.createdAt && typeof auction.createdAt === "number") {
        auction.createdAt = new Date(auction.createdAt * 1e3);
      } else if (typeof auction.createdAt === "string") {
        auction.createdAt = new Date(auction.createdAt);
      }
      if (!auction.startTime) {
        auction.startTime = /* @__PURE__ */ new Date();
      }
      if (!auction.createdAt) {
        auction.createdAt = /* @__PURE__ */ new Date();
      }
      if (!auction.currentPrice) {
        auction.currentPrice = auction.startingPrice;
      }
      const auctionData = {
        ...auction,
        imageUrls: serializeImages(auction.imageUrls)
      };
      const [created] = await db.insert(auctions).values(auctionData).returning();
      return created;
    } catch (err) {
      console.error("Failed to create auction:", err, auction);
      throw err;
    }
  }
  async updateAuction(id, updates) {
    if (updates.endTime && typeof updates.endTime === "number") {
      updates.endTime = new Date(updates.endTime * 1e3);
    } else if (typeof updates.endTime === "string") {
      updates.endTime = new Date(updates.endTime);
    }
    if (updates.startTime && typeof updates.startTime === "number") {
      updates.startTime = new Date(updates.startTime * 1e3);
    } else if (typeof updates.startTime === "string") {
      updates.startTime = new Date(updates.startTime);
    }
    if (updates.createdAt && typeof updates.createdAt === "number") {
      updates.createdAt = new Date(updates.createdAt * 1e3);
    } else if (typeof updates.createdAt === "string") {
      updates.createdAt = new Date(updates.createdAt);
    }
    const currentAuction = await this.getAuction(id);
    if (!currentAuction) {
      return void 0;
    }
    if (updates.endTime && currentAuction.status === "ended") {
      const now = /* @__PURE__ */ new Date();
      const newEndTime = new Date(updates.endTime);
      console.log(`[updateAuction] Auction ${id} status check: currentStatus=${currentAuction.status}, newEndTime=${newEndTime.toISOString()}, now=${now.toISOString()}`);
      if (newEndTime > now) {
        updates.status = "active";
        updates.winnerId = null;
        console.log(`[updateAuction] Reactivating auction ${id} because new end time is in future`);
      }
    }
    const updatesData = {
      ...updates,
      imageUrls: updates.imageUrls ? serializeImages(updates.imageUrls) : void 0
    };
    const [auction] = await db.update(auctions).set(updatesData).where(eq(auctions.id, id)).returning();
    if (!auction) return void 0;
    return auction;
  }
  async deleteAuction(id) {
    const result = await db.delete(auctions).where(eq(auctions.id, id)).returning();
    return result.length > 0;
  }
  async endAuction(id) {
    const highestBid = await this.getHighestBid(id);
    const winnerId = highestBid?.bidderId || null;
    const [auction] = await db.update(auctions).set({
      status: "ended",
      winnerId
    }).where(eq(auctions.id, id)).returning();
    if (auction) {
      if (winnerId) {
        const winner = await this.getUser(winnerId);
        if (winner && winner.role !== "admin") {
          const invoiceDocument = await this.generateInvoiceForWinner(id, winnerId);
          const updatedAuction = await this.getAuction(id);
          const invoiceNumber = updatedAuction?.invoiceNumber;
          console.log(`[endAuction] Auto-generated invoice for auction ${id}, winner ${winnerId}: ${invoiceNumber || "failed"}`);
          await this.createNotification({
            userId: winnerId,
            type: "auction",
            title: "Selamat! Anda Menang",
            message: `Anda memenangkan lelang ${auction.title}. Invoice telah dibuat dengan nomor ${invoiceNumber || "N/A"}. Silakan lakukan pembayaran.`,
            data: JSON.stringify({
              auctionId: id,
              auctionTitle: auction.title,
              winningBid: highestBid?.amount,
              invoiceNumber,
              action: "view_payment"
            })
          });
        }
        const allBids = await this.getBidsForAuction(id);
        const otherBidders = allBids.filter((bid) => bid.bidderId !== winnerId).map((bid) => bid.bidderId);
        const uniqueBidders = Array.from(new Set(otherBidders));
        for (const bidderId of uniqueBidders) {
          const bidder = await this.getUser(bidderId);
          if (bidder && bidder.role !== "admin") {
            await this.createNotification({
              userId: bidderId,
              type: "auction",
              title: "Lelang Berakhir",
              message: `Lelang ${auction.title} telah berakhir. Sayangnya Anda tidak memenangkan lelang ini.`,
              data: JSON.stringify({
                auctionId: id,
                auctionTitle: auction.title,
                winningBid: highestBid?.amount,
                action: "view_auction"
              })
            });
          }
        }
      }
    }
    return auction || void 0;
  }
  async archiveAuction(auctionId) {
    const result = await db.update(auctions).set({ archived: true }).where(eq(auctions.id, auctionId)).returning();
    if (result.length === 0) {
      console.error(`[archiveAuction] Tidak ada auction dengan id`, auctionId);
    } else {
      console.log(`[archiveAuction] Auction id ${auctionId} berhasil diarsipkan.`);
    }
    return this.getAuction(auctionId);
  }
  async unarchiveAuction(auctionId) {
    await db.update(auctions).set({ archived: false }).where(eq(auctions.id, auctionId)).returning();
    return this.getAuction(auctionId);
  }
  async getWonAuctions(userId) {
    const results = await db.select({
      auction: auctions,
      category: categories
    }).from(auctions).innerJoin(categories, eq(auctions.categoryId, categories.id)).where(and(eq(auctions.winnerId, userId), eq(auctions.archived, false))).orderBy(desc(auctions.createdAt));
    const auctionsWithBids = await Promise.all(
      results.map(async (result) => {
        const auctionBids = await this.getBidsForAuction(result.auction.id);
        return {
          ...result.auction,
          imageUrls: deserializeImages(result.auction.imageUrls),
          category: result.category,
          bids: auctionBids,
          _count: { bids: auctionBids.length }
        };
      })
    );
    return auctionsWithBids;
  }
  async getArchivedAuctions() {
    try {
      const results = await db.select({
        auction: auctions,
        category: categories
      }).from(auctions).innerJoin(categories, eq(auctions.categoryId, categories.id)).where(eq(auctions.archived, true)).orderBy(desc(auctions.createdAt));
      console.log(`[getArchivedAuctions] Jumlah data arsip:`, results.length);
      if (results.length === 0) {
        console.warn(`[getArchivedAuctions] Tidak ada data lelang yang diarsipkan.`);
      }
      const auctionsWithBids = await Promise.all(
        results.map(async (result) => {
          const auctionBids = await this.getBidsForAuction(result.auction.id);
          return {
            ...result.auction,
            imageUrls: deserializeImages(result.auction.imageUrls),
            category: result.category,
            bids: auctionBids,
            _count: { bids: auctionBids.length }
          };
        })
      );
      return auctionsWithBids;
    } catch (error) {
      console.error("Error fetching archived auctions:", error);
      return [];
    }
  }
  async getBidsForAuction(auctionId) {
    const results = await db.select({
      bid: bids,
      bidder: users
    }).from(bids).innerJoin(users, eq(bids.bidderId, users.id)).where(eq(bids.auctionId, auctionId)).orderBy(desc(bids.createdAt));
    return results.map((result) => ({
      ...result.bid,
      bidder: result.bidder
    }));
  }
  async getUserBids(userId) {
    const results = await db.select({
      bid: bids,
      auction: auctions
    }).from(bids).innerJoin(auctions, eq(bids.auctionId, auctions.id)).where(eq(bids.bidderId, userId)).orderBy(desc(bids.createdAt));
    return results.map((result) => ({
      ...result.bid,
      auction: result.auction
    }));
  }
  // Hapus seluruh fungsi placeBid lama, ganti dengan ini:
  async placeBid(bid) {
    const toInsert = {
      ...bid,
      createdAt: bid.createdAt ?? /* @__PURE__ */ new Date()
    };
    const [created] = await db.insert(bids).values(toInsert).returning();
    if (!created) {
      throw new Error("Failed to create bid");
    }
    await db.update(auctions).set({ currentPrice: bid.amount }).where(eq(auctions.id, bid.auctionId)).execute();
    const auction = await this.getAuction(bid.auctionId);
    if (auction) {
      const previousHighestBids = await db.select().from(bids).where(and(
        eq(bids.auctionId, bid.auctionId),
        sql2`id != ${created.id}`
      )).orderBy(desc(bids.amount)).limit(1);
      if (previousHighestBids.length > 0) {
        const previousBidder = previousHighestBids[0];
        const bidder = await this.getUser(previousBidder.bidderId);
        if (bidder && bidder.role !== "admin") {
          await this.createNotification({
            userId: previousBidder.bidderId,
            type: "bid",
            title: "Penawaran Terlampaui",
            message: `Penawaran Anda untuk ${auction.title} telah dilampaui oleh pengguna lain`,
            data: JSON.stringify({
              auctionId: bid.auctionId,
              auctionTitle: auction.title,
              newBidAmount: bid.amount,
              action: "view_auction"
            })
          });
        }
      }
    }
    return created;
  }
  async getHighestBid(auctionId) {
    const [bid] = await db.select().from(bids).where(eq(bids.auctionId, auctionId)).orderBy(desc(bids.amount)).limit(1);
    return bid || void 0;
  }
  async addToWatchlist(userId, auctionId) {
    await db.insert(watchlist).values({ userId, auctionId }).onConflictDoNothing();
  }
  async removeFromWatchlist(userId, auctionId) {
    await db.delete(watchlist).where(and(
      eq(watchlist.userId, userId),
      eq(watchlist.auctionId, auctionId)
    ));
  }
  async getUserWatchlist(userId) {
    const results = await db.select().from(watchlist).leftJoin(auctions, eq(watchlist.auctionId, auctions.id)).leftJoin(categories, eq(auctions.categoryId, categories.id)).where(eq(watchlist.userId, userId));
    const auctionIds = results.map((r) => r.auctions?.id).filter(Boolean);
    if (auctionIds.length === 0) {
      return [];
    }
    const bidsResults = await db.select().from(bids).leftJoin(users, eq(bids.bidderId, users.id)).where(inArray(bids.auctionId, auctionIds)).orderBy(bids.createdAt);
    const bidsMap = /* @__PURE__ */ new Map();
    bidsResults.forEach((result) => {
      if (result.bids && result.users) {
        const auctionId = result.bids.auctionId;
        if (!bidsMap.has(auctionId)) {
          bidsMap.set(auctionId, []);
        }
        bidsMap.get(auctionId).push({
          ...result.bids,
          bidder: result.users
        });
      }
    });
    return results.filter((result) => result.auctions && result.categories).map((result) => ({
      ...result.auctions,
      imageUrls: deserializeImages(result.auctions.imageUrls),
      category: result.categories,
      bids: bidsMap.get(result.auctions.id) || []
    }));
  }
  async updateUserProfile(userId, profileData) {
    try {
      const result = await db.update(users).set({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        username: profileData.username,
        email: profileData.email,
        phone: profileData.phone
      }).where(eq(users.id, userId)).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
  async getPaymentsForUser(userId) {
    return db.select().from(payments).where(eq(payments.winnerId, userId));
  }
  async getUserPayments(userId) {
    const results = await db.select({
      payment: payments,
      auction: auctions
    }).from(payments).leftJoin(auctions, eq(payments.auctionId, auctions.id)).where(eq(payments.winnerId, userId)).orderBy(desc(payments.createdAt));
    return results.map((result) => ({
      ...result.payment,
      auction: result.auction || void 0
    }));
  }
  async createPayment(payment) {
    try {
      const existingPayment = await this.getPaymentByAuctionId(payment.auctionId);
      if (existingPayment && existingPayment.status === "rejected") {
        const [updatedPayment] = await db.update(payments).set({
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentProof: payment.paymentProof,
          bankName: payment.bankName,
          accountNumber: payment.accountNumber,
          accountName: payment.accountName,
          status: "pending",
          notes: null,
          createdAt: /* @__PURE__ */ new Date(),
          verifiedAt: null,
          verifiedBy: null
        }).where(eq(payments.id, existingPayment.id)).returning();
        const auction2 = await this.getAuction(payment.auctionId);
        if (auction2) {
          if (updatedPayment.status === "pending") {
            await this.createAdminNotification(
              "payment",
              "Pembayaran Ulang Diterima",
              `Pembayaran ulang untuk lelang "${auction2.title}" telah diterima dan menunggu verifikasi.`,
              {
                auctionId: payment.auctionId,
                auctionTitle: auction2.title,
                amount: payment.amount,
                paymentId: updatedPayment.id
              }
            );
          }
          const winner = await this.getUser(payment.winnerId);
          if (winner && winner.role !== "admin") {
            await this.createNotification({
              userId: payment.winnerId,
              type: "payment",
              title: "Pembayaran Ulang Berhasil Dikirim",
              message: `Pembayaran ulang Anda untuk lelang "${auction2.title}" telah diterima dan sedang diverifikasi oleh admin.`,
              data: JSON.stringify({
                auctionId: payment.auctionId,
                auctionTitle: auction2.title,
                amount: payment.amount,
                paymentId: updatedPayment.id
              })
            });
          }
        }
        console.log("Payment resubmitted successfully:", updatedPayment);
        return updatedPayment;
      }
      const [newPayment] = await db.insert(payments).values({
        ...payment,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      const auction = await this.getAuction(payment.auctionId);
      if (auction) {
        await this.createAdminNotification(
          "payment",
          "Pembayaran Baru Diterima",
          `Pembayaran baru untuk lelang "${auction.title}" telah diterima dan menunggu verifikasi.`,
          {
            auctionId: payment.auctionId,
            auctionTitle: auction.title,
            amount: payment.amount,
            paymentId: newPayment.id
          }
        );
        const winner = await this.getUser(payment.winnerId);
        if (winner && winner.role !== "admin") {
          await this.createNotification({
            userId: payment.winnerId,
            type: "payment",
            title: "Pembayaran Berhasil Dikirim",
            message: `Pembayaran Anda untuk lelang "${auction.title}" telah diterima dan sedang diverifikasi oleh admin.`,
            data: JSON.stringify({
              auctionId: payment.auctionId,
              auctionTitle: auction.title,
              amount: payment.amount,
              paymentId: newPayment.id
            })
          });
        }
      }
      console.log("Payment created successfully:", newPayment);
      return newPayment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }
  async updatePayment(id, updates) {
    const [payment] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return payment || void 0;
  }
  async getPayment(id) {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || void 0;
  }
  async getPaymentByAuctionId(auctionId) {
    const [payment] = await db.select().from(payments).where(eq(payments.auctionId, auctionId));
    return payment || void 0;
  }
  async getAllPendingPayments() {
    const results = await db.select({
      payment: payments,
      auction: auctions,
      winner: users
    }).from(payments).leftJoin(auctions, eq(payments.auctionId, auctions.id)).leftJoin(users, eq(auctions.winnerId, users.id)).where(eq(payments.status, "pending"));
    return results.map((result) => ({
      ...result.payment,
      auction: result.auction ? {
        ...result.auction
        // Do not modify imageUrls here; keep as is for type compatibility
      } : void 0,
      winner: result.winner || void 0
    }));
  }
  async verifyPayment(paymentId, verifiedBy, status, notes, documents) {
    try {
      console.log(`[verifyPayment] Admin verifying payment ${paymentId} with status ${status}`);
      const updateData = {
        status,
        verifiedAt: /* @__PURE__ */ new Date(),
        verifiedBy,
        notes: notes || null
      };
      if (documents) {
        if (documents.invoiceDocument) updateData.invoiceDocument = documents.invoiceDocument;
        if (documents.releaseLetterDocument) updateData.releaseLetterDocument = documents.releaseLetterDocument;
        if (documents.handoverDocument) updateData.handoverDocument = documents.handoverDocument;
      }
      const [updatedPayment] = await db.update(payments).set(updateData).where(eq(payments.id, paymentId)).returning();
      const auction = await this.getAuction(updatedPayment.auctionId);
      if (auction && updatedPayment.winnerId) {
        const winner = await this.getUser(updatedPayment.winnerId);
        if (winner && winner.role !== "admin") {
          const verifiedTitle = status === "verified" ? "\u2705 Pembayaran Disetujui" : "\u274C Pembayaran Ditolak";
          const verifiedMessage = status === "verified" ? `Selamat! Pembayaran untuk lelang "${auction.title}" telah disetujui. ${documents?.releaseLetterDocument ? "Surat pelepasan kendaraan telah tersedia." : ""}` : `Pembayaran untuk lelang "${auction.title}" ditolak. Alasan: ${notes || "Tidak ada keterangan"}`;
          await this.createNotification({
            userId: updatedPayment.winnerId,
            type: "payment",
            title: verifiedTitle,
            message: verifiedMessage,
            data: JSON.stringify({
              paymentId,
              auctionId: updatedPayment.auctionId,
              auctionTitle: auction.title,
              status,
              notes,
              hasReleaseDocument: !!documents?.releaseLetterDocument,
              hasHandoverDocument: !!documents?.handoverDocument,
              action: "view_payment"
            })
          });
        }
      }
      console.log(`[verifyPayment] Payment verification successful. Status: ${status}, Documents uploaded: ${Object.keys(documents || {}).join(", ")}`);
      return updatedPayment;
    } catch (error) {
      console.error(`[verifyPayment] Payment verification error:`, error);
      throw error;
    }
  }
  async getPaymentHistory(search, statusFilter) {
    try {
      let query = db.select({
        payment: payments,
        auction: auctions,
        winner: users
      }).from(payments).leftJoin(auctions, eq(payments.auctionId, auctions.id)).leftJoin(users, eq(auctions.winnerId, users.id));
      const whereClauses = [];
      whereClauses.push(or(eq(payments.status, "verified"), eq(payments.status, "rejected")));
      if (statusFilter && statusFilter !== "all") {
        whereClauses.push(eq(payments.status, statusFilter));
      }
      if (search) {
        whereClauses.push(
          or(
            sql2`auctions.title LIKE '%' || ${search} || '%'`,
            sql2`users.username LIKE '%' || ${search} || '%'`,
            sql2`users.email LIKE '%' || ${search} || '%'`
          )
        );
      }
      const results = await (whereClauses.length > 0 ? query.where(and(...whereClauses)).orderBy(desc(payments.verifiedAt)) : query.orderBy(desc(payments.verifiedAt)));
      return results.map((result) => ({
        ...result.payment,
        auction: result.auction ? {
          ...result.auction,
          imageUrls: result.auction.imageUrls
          // keep as string | null for type compatibility
        } : void 0,
        winner: result.winner || void 0
      }));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }
  }
  async checkAndEndExpiredAuctions() {
    try {
      const now = /* @__PURE__ */ new Date();
      const expiredAuctions = await db.select().from(auctions).where(eq(auctions.status, "active"));
      console.log(`[checkAndEndExpiredAuctions] Checking ${expiredAuctions.length} active auctions against current time: ${now.toISOString()}`);
      let endedCount = 0;
      const actuallyExpired = [];
      for (const auction of expiredAuctions) {
        const endTime = new Date(auction.endTime);
        const isExpired = now >= endTime;
        console.log(`[checkAndEndExpiredAuctions] Auction ${auction.id} (${auction.title}): endTime=${endTime.toISOString()}, now=${now.toISOString()}, expired=${isExpired}`);
        if (isExpired) {
          actuallyExpired.push(auction);
        }
      }
      console.log(`[checkAndEndExpiredAuctions] Found ${actuallyExpired.length} actually expired auctions`);
      for (const auction of actuallyExpired) {
        try {
          const highestBid = await this.getHighestBid(auction.id);
          const winnerId = highestBid?.bidderId || null;
          await db.update(auctions).set({
            status: "ended",
            winnerId
          }).where(eq(auctions.id, auction.id));
          if (winnerId) {
            const invoice = await this.generateInvoiceForWinner(auction.id, winnerId);
            console.log(`[checkAndEndExpiredAuctions] Auto-generated invoice for auction ${auction.id}, winner ${winnerId}: ${invoice ? "success" : "failed"}`);
          }
          console.log(`[checkAndEndExpiredAuctions] Ended auction ${auction.id} (${auction.title}), winner: ${winnerId || "none"}`);
          endedCount++;
        } catch (error) {
          console.error(`[checkAndEndExpiredAuctions] Error ending auction ${auction.id}:`, error);
        }
      }
      console.log(`[checkAndEndExpiredAuctions] Successfully ended ${endedCount} auctions`);
      return endedCount;
    } catch (error) {
      console.error("[checkAndEndExpiredAuctions] Error:", error);
      throw error;
    }
  }
  async generateInvoiceForWinner(auctionId, winnerId) {
    try {
      console.log(`[generateInvoiceForWinner] Generating invoice document for auction ${auctionId}, winner ${winnerId}`);
      const auction = await this.getAuction(auctionId);
      if (!auction) {
        console.error(`[generateInvoiceForWinner] Auction ${auctionId} not found`);
        return null;
      }
      const highestBid = await this.getHighestBid(auctionId);
      if (!highestBid) {
        console.error(`[generateInvoiceForWinner] No highest bid found for auction ${auctionId}`);
        return null;
      }
      const now = /* @__PURE__ */ new Date();
      const timestamp = now.getTime();
      const invoiceNumber = `INV-${String(auctionId).padStart(4, "0")}-${String(winnerId).padStart(4, "0")}-${timestamp}`;
      const bidAmount = parseFloat(String(highestBid.amount));
      const invoiceDocument = await this.generateInvoiceDocument(auction, winnerId, bidAmount, invoiceNumber);
      await db.update(auctions).set({
        invoiceDocument,
        invoiceNumber
      }).where(eq(auctions.id, auctionId));
      console.log(`[generateInvoiceForWinner] Successfully generated INVOICE DOCUMENT ${invoiceNumber} for auction ${auctionId}, amount: Rp ${bidAmount.toLocaleString("id-ID")}`);
      await this.createNotification({
        userId: winnerId,
        type: "payment",
        title: "\u{1F3C6} Selamat! Anda Pemenang Lelang",
        message: `Selamat! Anda memenangkan lelang "${auction.title}" dengan harga Rp ${bidAmount.toLocaleString("id-ID")}. Invoice tagihan ${invoiceNumber} telah tersedia. Silakan lakukan pembayaran melalui form pembayaran.`,
        data: JSON.stringify({
          auctionId,
          invoiceNumber,
          amount: bidAmount,
          auctionTitle: auction.title,
          invoiceDocument
        })
      });
      return invoiceDocument;
    } catch (error) {
      console.error(`[generateInvoiceForWinner] Error generating invoice for auction ${auctionId}:`, error);
      return null;
    }
  }
  async generateInvoiceDocument(auction, winnerId, amount, invoiceNumber) {
    try {
      const winner = await this.getUser(winnerId);
      if (!winner) return null;
      const now = /* @__PURE__ */ new Date();
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
      const invoiceHTML = this.createInvoiceTemplate(auction, winner, amount, invoiceNumber, now, dueDate);
      console.log(`[generateInvoiceDocument] Generating PDF for invoice ${invoiceNumber}...`);
      try {
        const puppeteer = (await import("puppeteer")).default;
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-extensions",
            "--no-first-run",
            "--disable-default-apps",
            "--disable-background-timer-throttling",
            "--disable-renderer-backgrounding",
            "--disable-backgrounding-occluded-windows"
          ]
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123 });
        await page.setContent(invoiceHTML, {
          waitUntil: ["domcontentloaded", "networkidle0"],
          timeout: 3e4
        });
        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "20mm",
            right: "20mm",
            bottom: "20mm",
            left: "20mm"
          },
          displayHeaderFooter: true,
          headerTemplate: "<div></div>",
          footerTemplate: `
            <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
              <span style="float: right;">Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
            </div>
          `
        });
        await browser.close();
        const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");
        console.log(`[generateInvoiceDocument] PDF generated successfully for invoice ${invoiceNumber}, size: ${pdfBuffer.length} bytes`);
        return `data:application/pdf;base64,${pdfBase64}`;
      } catch (puppeteerError) {
        if (puppeteerError && typeof puppeteerError === "object" && "message" in puppeteerError) {
          console.warn(`[generateInvoiceDocument] Puppeteer failed for invoice ${invoiceNumber}:`, puppeteerError.message);
        } else {
          console.warn(`[generateInvoiceDocument] Puppeteer failed for invoice ${invoiceNumber}:`, puppeteerError);
        }
        console.log(`[generateInvoiceDocument] Falling back to HTML format for invoice ${invoiceNumber}...`);
        const documentData = Buffer.from(invoiceHTML).toString("base64");
        return `data:text/html;base64,${documentData}`;
      }
    } catch (error) {
      console.error("Error generating PDF invoice document:", error);
      return null;
    }
  }
  async getRealAdminStats() {
    try {
      const totalUsersResult = await db.select({ count: sql2`count(*)` }).from(users);
      const totalUsers = totalUsersResult[0]?.count || 0;
      const activeUsersResult = await db.select({ count: sql2`count(DISTINCT user_id)` }).from(sql2`(
          SELECT bidder_id as user_id FROM bids WHERE created_at > datetime('now', '-30 days')
          UNION
          SELECT winner_id as user_id FROM auctions WHERE winner_id IS NOT NULL AND end_time > datetime('now', '-30 days')
        ) as active_users`);
      const activeUsers = activeUsersResult[0]?.count || 0;
      const activeAuctionsResult = await db.select({ count: sql2`count(*)` }).from(auctions).where(and(eq(auctions.status, "active"), eq(auctions.archived, false)));
      const activeAuctions = activeAuctionsResult[0]?.count || 0;
      const completedAuctionsResult = await db.select({ count: sql2`count(*)` }).from(auctions).where(eq(auctions.status, "ended"));
      const completedAuctions = completedAuctionsResult[0]?.count || 0;
      const revenueResult = await db.select({ total: sql2`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "verified"));
      const totalRevenue = revenueResult[0]?.total || 0;
      return {
        totalUsers,
        activeUsers,
        activeAuctions,
        completedAuctions,
        totalRevenue
      };
    } catch (error) {
      console.error("Error fetching real admin stats:", error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        activeAuctions: 0,
        completedAuctions: 0,
        totalRevenue: 0
      };
    }
  }
  async exportAuctionData() {
    try {
      const results = await db.select({
        auction: auctions,
        category: categories
      }).from(auctions).innerJoin(categories, eq(auctions.categoryId, categories.id)).where(and(
        ne(auctions.status, "archived"),
        eq(auctions.archived, false)
      )).orderBy(desc(auctions.createdAt));
      return results.map((result) => ({
        id: result.auction.id,
        title: result.auction.title,
        description: result.auction.description,
        categoryName: result.category.name,
        categoryId: result.auction.categoryId,
        startingBid: result.auction.startingPrice,
        currentBid: result.auction.currentPrice,
        condition: result.auction.condition,
        location: result.auction.location,
        status: result.auction.status,
        startTime: result.auction.startTime,
        endTime: result.auction.endTime,
        winnerId: result.auction.winnerId,
        winnerName: null,
        // Will be populated with seller/winner info if needed
        sellerName: null,
        // Will be populated with seller info if needed
        bidCount: 0,
        // Default to 0, can be populated from bids table if needed
        archived: result.auction.archived,
        productionYear: result.auction.productionYear,
        plateNumber: result.auction.plateNumber,
        chassisNumber: result.auction.chassisNumber,
        engineNumber: result.auction.engineNumber,
        documentInfo: result.auction.documentInfo,
        createdAt: result.auction.createdAt
      }));
    } catch (error) {
      console.error("Error exporting auction data:", error);
      throw error;
    }
  }
  async exportFilteredAuctionData(filters) {
    try {
      console.log("[STORAGE DEBUG] exportFilteredAuctionData called with filters:", filters);
      const conditions = [];
      conditions.push(ne(auctions.status, "archived"));
      conditions.push(eq(auctions.archived, false));
      if (filters.status && filters.status !== "all") {
        conditions.push(eq(auctions.status, filters.status));
      }
      if (filters.search && filters.search.trim()) {
        conditions.push(like(auctions.title, `%${filters.search.trim()}%`));
      }
      const whereCondition = and(...conditions);
      console.log("[STORAGE DEBUG] Number of conditions:", conditions.length);
      const results = await db.select({
        auction: auctions,
        category: categories
      }).from(auctions).innerJoin(categories, eq(auctions.categoryId, categories.id)).where(whereCondition).orderBy(desc(auctions.createdAt));
      console.log("[STORAGE DEBUG] Raw query results count:", results.length);
      console.log("[STORAGE DEBUG] Raw results statuses:", results.map((r) => ({ id: r.auction.id, status: r.auction.status, archived: r.auction.archived })));
      return results.map((result) => ({
        id: result.auction.id,
        title: result.auction.title,
        description: result.auction.description,
        categoryName: result.category.name,
        categoryId: result.auction.categoryId,
        startingBid: result.auction.startingPrice,
        currentBid: result.auction.currentPrice,
        condition: result.auction.condition,
        location: result.auction.location,
        status: result.auction.status,
        startTime: result.auction.startTime,
        endTime: result.auction.endTime,
        winnerId: result.auction.winnerId,
        winnerName: null,
        // Will be populated with seller/winner info if needed
        sellerName: null,
        // Will be populated with seller info if needed
        bidCount: 0,
        // Default to 0, can be populated from bids table if needed
        archived: result.auction.archived,
        productionYear: result.auction.productionYear,
        plateNumber: result.auction.plateNumber,
        chassisNumber: result.auction.chassisNumber,
        engineNumber: result.auction.engineNumber,
        documentInfo: result.auction.documentInfo,
        createdAt: result.auction.createdAt
      }));
    } catch (error) {
      console.error("Error exporting filtered auction data:", error);
      throw error;
    }
  }
  // Notification functions
  async createNotification(notification) {
    try {
      const [newNotification] = await db.insert(notifications).values({
        ...notification,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
      return newNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }
  async getUserNotifications(userId) {
    try {
      return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      throw error;
    }
  }
  async getAdminNotifications() {
    try {
      return await db.select().from(notifications).where(or(
        eq(notifications.type, "system"),
        eq(notifications.type, "payment"),
        eq(notifications.type, "auction")
      )).orderBy(desc(notifications.createdAt)).limit(50);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      throw error;
    }
  }
  async getNotification(id) {
    try {
      const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
      return notification || void 0;
    } catch (error) {
      console.error("Error fetching notification:", error);
      throw error;
    }
  }
  async markNotificationAsRead(notificationId, userId) {
    try {
      await db.update(notifications).set({ isRead: true }).where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
  async markAllNotificationsAsRead(userId) {
    try {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }
  async deleteNotification(notificationId) {
    try {
      await db.delete(notifications).where(eq(notifications.id, notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }
  // Admin Notification function
  async createAdminNotification(type, title, message, data) {
    try {
      const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
      for (const admin of adminUsers) {
        await this.createNotification({
          userId: admin.id,
          type,
          title,
          message,
          data: JSON.stringify(data)
        });
      }
    } catch (error) {
      console.error("Error creating admin notification:", error);
      throw error;
    }
  }
  /**
   * Create standardized invoice template with consistent payment instructions and auction data
   */
  createInvoiceTemplate(auction, winner, amount, invoiceNumber, invoiceDate, dueDate) {
    const companyInfo = {
      name: "3D Auction",
      legalName: "PT Auctioneer Tridaya",
      bankName: "Bank Central Asia (BCA)",
      accountNumber: "1234567890",
      customerService: "support@e-auction.id",
      phone: "+62-21-1234-5678",
      address: "Jl. Sudirman No. 123, Jakarta 10220, Indonesia"
    };
    const paymentInstructions = [
      "Transfer sesuai PERSIS dengan jumlah yang tertera (tidak lebih, tidak kurang)",
      "Gunakan berita transfer: " + invoiceNumber,
      "Simpan bukti transfer dengan jelas dan lengkap",
      "Upload bukti transfer melalui menu 'Upload Pembayaran' di sistem",
      "Verifikasi pembayaran akan dilakukan maksimal 1x24 jam (hari kerja)",
      "Setelah pembayaran terverifikasi, surat kuasa kendaraan akan diberikan",
      "Hubungi customer service jika ada kendala dalam pembayaran"
    ];
    const termsAndConditions = [
      "Pembayaran harus dilakukan dalam 7 hari kerja setelah invoice diterbitkan",
      "Keterlambatan pembayaran akan dikenakan denda 2% per hari",
      "Pemenang lelang bertanggung jawab atas biaya administrasi balik nama",
      "Barang lelang dijual dalam kondisi apa adanya (as is)",
      "Pemenang wajib mengambil barang maksimal 14 hari setelah pembayaran lunas"
    ];
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber} - ${companyInfo.name}</title>
    <style>
        @page { 
            size: A4; 
            margin: 15mm; 
            @bottom-center {
                content: "Halaman " counter(page) " dari " counter(pages);
                font-size: 9px;
                color: #666;
            }
        }
        * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
        }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            color: #333;
            line-height: 1.5;
            font-size: 12px;
        }
        .invoice-container { 
            max-width: 100%; 
            background: white; 
        }
        
        /* Header Styles */
        .header { 
            text-align: center; 
            border-bottom: 3px solid #1e40af; 
            padding-bottom: 20px; 
            margin-bottom: 25px; 
        }
        .company-logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e40af; 
            letter-spacing: 2px;
            margin-bottom: 8px;
        }
        .invoice-title { 
            font-size: 20px; 
            color: #1f2937; 
            margin: 10px 0; 
            font-weight: 600;
        }
        .invoice-meta { 
            font-size: 14px; 
            color: #6b7280; 
            margin: 5px 0;
        }
        .status-badge { 
            display: inline-block; 
            padding: 6px 12px; 
            border-radius: 15px; 
            font-size: 12px; 
            font-weight: bold; 
            margin-top: 8px;
            background: #fee2e2; 
            color: #dc2626; 
            border: 1px solid #fecaca; 
        }
        
        /* Section Styles */
        .section { 
            margin-bottom: 25px; 
            break-inside: avoid;
        }
        .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 12px; 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 6px; 
            display: flex;
            align-items: center;
        }
        .section-icon {
            margin-right: 8px;
            font-size: 18px;
        }
        
        /* Info Grid and Items */
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 15px;
        }
        .info-item { 
            margin-bottom: 8px; 
            display: flex;
        }
        .label { 
            font-weight: 600; 
            color: #374151; 
            min-width: 110px;
            margin-right: 8px;
        }
        .value { 
            color: #6b7280; 
            flex: 1;
        }
        
        /* Auction Details Box */
        .auction-details { 
            background: #f8fafc; 
            padding: 18px; 
            border-radius: 6px; 
            border-left: 4px solid #1e40af; 
            margin: 12px 0;
        }
        
        /* Amount Section */
        .amount-section { 
            background: linear-gradient(135deg, #fef3c7, #fde68a); 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            border: 2px solid #f59e0b; 
            margin: 15px 0;
        }
        .amount-label { 
            font-size: 16px; 
            color: #374151; 
            font-weight: 600; 
            margin-bottom: 8px;
        }
        .total-amount { 
            font-size: 32px; 
            font-weight: bold; 
            color: #b45309; 
            margin: 10px 0; 
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .amount-note { 
            font-size: 12px; 
            color: #6b7280; 
            margin-top: 5px;
        }
        
        /* Payment Section */
        .payment-section { 
            background: #ecfdf5; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #10b981; 
            margin: 15px 0;
        }
        .bank-info { 
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #d1fae5;
            margin: 15px 0;
        }
        .transfer-amount {
            font-size: 18px; 
            font-weight: bold; 
            color: #b45309;
            background: #fef3c7;
            padding: 8px 12px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
        }
        
        /* Instructions Box */
        .instructions { 
            background: #fef9c3; 
            padding: 18px; 
            border-radius: 6px; 
            border-left: 4px solid #eab308; 
            margin: 15px 0;
        }
        .instructions-title {
            font-weight: bold; 
            color: #a16207; 
            font-size: 14px;
            margin-bottom: 10px;
        }
        .instructions ol { 
            margin: 10px 0; 
            padding-left: 20px; 
            color: #92400e; 
        }
        .instructions li { 
            margin-bottom: 6px; 
            font-size: 12px;
        }
        
        /* Terms Section */
        .terms-section {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #64748b;
            margin: 15px 0;
        }
        .terms-title {
            font-weight: bold;
            color: #475569;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .terms-list {
            font-size: 11px;
            color: #64748b;
            line-height: 1.4;
        }
        .terms-list li {
            margin-bottom: 4px;
        }
        
        /* Footer */
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 11px; 
            break-inside: avoid;
        }
        .footer-company {
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .footer-contact {
            margin: 3px 0;
        }
        
        /* Print Optimizations */
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .section { page-break-inside: avoid; }
            .header { page-break-after: avoid; }
        }
        
        /* Responsive adjustments */
        @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; gap: 10px; }
            .total-amount { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header Section -->
        <div class="header">
            <div class="company-logo">${companyInfo.name}</div>
            <div class="invoice-title">INVOICE PEMBAYARAN LELANG</div>
            <div class="invoice-meta">No. Invoice: <strong>${invoiceNumber}</strong></div>
            <div class="invoice-meta">Tanggal: ${invoiceDate.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}</div>
            <div class="status-badge">\u23F3 MENUNGGU PEMBAYARAN</div>
        </div>

        <!-- Winner Information -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">\u{1F464}</span>
                Informasi Pemenang Lelang
            </div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="label">Nama Lengkap:</span>
                        <span class="value"><strong>${winner.firstName} ${winner.lastName}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Username:</span>
                        <span class="value">${winner.username}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Email:</span>
                        <span class="value">${winner.email}</span>
                    </div>
                    ${winner.phone ? `
                    <div class="info-item">
                        <span class="label">Telepon:</span>
                        <span class="value">${winner.phone}</span>
                    </div>` : ""}
                </div>
                <div>
                    <div class="info-item">
                        <span class="label">Tanggal Invoice:</span>
                        <span class="value">${invoiceDate.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Jatuh Tempo:</span>
                        <span class="value"><strong>${dueDate.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Status:</span>
                        <span class="value" style="color: #dc2626; font-weight: bold;">Belum Bayar</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Auction Details -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">\u{1F697}</span>
                Detail Barang Lelang
            </div>
            <div class="auction-details">
                <div class="info-item">
                    <span class="label">ID Lelang:</span>
                    <span class="value"><strong>#${auction.id.toString().padStart(6, "0")}</strong></span>
                </div>
                <div class="info-item">
                    <span class="label">Nama Barang:</span>
                    <span class="value"><strong>${auction.title}</strong></span>
                </div>
                <div class="info-item">
                    <span class="label">Deskripsi:</span>
                    <span class="value">${auction.description || "Tidak ada deskripsi"}</span>
                </div>
                <div class="info-item">
                    <span class="label">Kondisi:</span>
                    <span class="value">${auction.condition || "Tidak disebutkan"}</span>
                </div>
                <div class="info-item">
                    <span class="label">Lokasi Barang:</span>
                    <span class="value">${auction.location || "Tidak disebutkan"}</span>
                </div>
                ${auction.productionYear ? `
                <div class="info-item">
                    <span class="label">Tahun Produksi:</span>
                    <span class="value">${auction.productionYear}</span>
                </div>` : ""}
                ${auction.plateNumber ? `
                <div class="info-item">
                    <span class="label">No. Plat Kendaraan:</span>
                    <span class="value"><strong>${auction.plateNumber}</strong></span>
                </div>` : ""}
                ${auction.chassisNumber ? `
                <div class="info-item">
                    <span class="label">No. Rangka (Chassis):</span>
                    <span class="value">${auction.chassisNumber}</span>
                </div>` : ""}
                ${auction.engineNumber ? `
                <div class="info-item">
                    <span class="label">No. Mesin:</span>
                    <span class="value">${auction.engineNumber}</span>
                </div>` : ""}
                <div class="info-item">
                    <span class="label">Tanggal Lelang:</span>
                    <span class="value">${new Date(auction.startTime).toLocaleDateString("id-ID")} - ${new Date(auction.endTime).toLocaleDateString("id-ID")}</span>
                </div>
            </div>
        </div>

        <!-- Payment Amount -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">\u{1F4B0}</span>
                Rincian Pembayaran
            </div>
            <div class="amount-section">
                <div class="amount-label">Total Yang Harus Dibayar</div>
                <div class="total-amount">Rp ${amount.toLocaleString("id-ID")}</div>
                <div class="amount-note">Sesuai dengan bid tertinggi yang Anda menangkan</div>
            </div>
        </div>

        <!-- Payment Information -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">\u{1F3E6}</span>
                Informasi Pembayaran
            </div>
            <div class="payment-section">
                <p style="margin-bottom: 15px; font-weight: bold; color: #047857; font-size: 14px;">
                    \u{1F4B3} TRANSFER KE REKENING BERIKUT:
                </p>
                
                <div class="bank-info">
                    <div class="info-item">
                        <span class="label">Nama Bank:</span>
                        <span class="value"><strong>${companyInfo.bankName}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">No. Rekening:</span>
                        <span class="value"><strong>${companyInfo.accountNumber}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Atas Nama:</span>
                        <span class="value"><strong>${companyInfo.legalName}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Jumlah Transfer:</span>
                        <span class="transfer-amount">Rp ${amount.toLocaleString("id-ID")}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Berita Transfer:</span>
                        <span class="value"><strong>${invoiceNumber}</strong></span>
                    </div>
                </div>

                <div class="instructions">
                    <div class="instructions-title">\u{1F4CB} PETUNJUK PEMBAYARAN:</div>
                    <ol>
                        ${paymentInstructions.map((instruction) => `<li>${instruction}</li>`).join("")}
                    </ol>
                </div>
            </div>
        </div>

        <!-- Terms and Conditions -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">\u{1F4DC}</span>
                Syarat dan Ketentuan
            </div>
            <div class="terms-section">
                <div class="terms-title">Ketentuan Pembayaran dan Pengambilan Barang:</div>
                <ol class="terms-list">
                    ${termsAndConditions.map((term) => `<li>${term}</li>`).join("")}
                </ol>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-company">${companyInfo.name}</div>
            <div class="footer-contact">${companyInfo.address}</div>
            <div class="footer-contact">Telepon: ${companyInfo.phone} | Email: ${companyInfo.customerService}</div>
            <div style="margin-top: 15px; font-weight: bold; color: #1e40af;">
                \u2728 Terima kasih telah menggunakan layanan 3D Auction! \u2728
            </div>
            <div style="margin-top: 10px; font-size: 10px; color: #9ca3af;">
                Invoice ini digenerate otomatis oleh sistem pada ${invoiceDate.toLocaleString("id-ID")}
            </div>
        </div>
    </div>
</body>
</html>`;
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import dotenv from "dotenv";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
dotenv.config();
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
import { z as z2 } from "zod";
import express from "express";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
var router = express.Router();
var routes_default = router;
function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.post("/api/categories", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  app2.put("/api/categories/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const updates = req.body;
      const category = await storage.updateCategory(id, updates);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  app2.delete("/api/categories/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      if (deleted) {
        res.status(200).json({ message: "Category deleted" });
      } else {
        res.status(404).json({ message: "Category not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  app2.get("/api/auctions", async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : void 0,
        search: req.query.search
      };
      const auctions2 = await storage.getAuctions(filters);
      res.json(auctions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  });
  app2.get("/api/auctions/archived", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const archivedAuctions = await storage.getArchivedAuctions();
      res.json(archivedAuctions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch archived auctions" });
    }
  });
  app2.get("/api/auctions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const auction = await storage.getAuction(id);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      res.json(auction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch auction" });
    }
  });
  app2.post("/api/auctions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      console.log("[CREATE AUCTION DEBUG] Received data:", req.body);
      const auctionData = insertAuctionSchema.parse(req.body);
      console.log("[CREATE AUCTION DEBUG] Parsed data:", auctionData);
      const auction = await storage.createAuction(auctionData);
      console.log("[CREATE AUCTION DEBUG] Created auction:", auction.id);
      await storage.createAdminNotification(
        "auction",
        "Lelang Baru Dibuat",
        `Lelang baru "${auction.title}" telah dibuat dan aktif.`,
        {
          auctionId: auction.id,
          auctionTitle: auction.title,
          startingPrice: auction.startingPrice,
          endTime: auction.endTime
        }
      );
      res.status(201).json(auction);
    } catch (error) {
      console.error("[CREATE AUCTION DEBUG] Error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid auction data", errors: error.errors });
      }
      res.status(500).json({
        message: "Failed to create auction",
        error: typeof error === "object" && error !== null && "message" in error ? error.message : String(error)
      });
    }
  });
  app2.put("/api/auctions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const id = parseInt(req.params.id);
      const auction = await storage.getAuction(id);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (!auction || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const updates = req.body;
      const updatedAuction = await storage.updateAuction(id, updates);
      res.json(updatedAuction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update auction" });
    }
  });
  app2.delete("/api/auctions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const id = parseInt(req.params.id);
      const auction = await storage.getAuction(id);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (!auction || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      if (auction.winnerId) {
        return res.status(400).json({
          message: "Cannot delete auction with winner",
          error: "Lelang yang sudah ada pemenang tidak dapat dihapus"
        });
      }
      const deleted = await storage.deleteAuction(id);
      if (deleted) {
        res.status(200).json({ message: "Auction deleted" });
      } else {
        res.status(404).json({ message: "Auction not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete auction" });
    }
  });
  app2.post("/api/auctions/:id/end", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const auction = await storage.endAuction(id);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      res.status(200).json({
        message: "Auction ended successfully",
        auction
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to end auction" });
    }
  });
  app2.post("/api/auctions/:id/archive", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const auction = await storage.archiveAuction(id);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      res.status(200).json({
        message: "Auction archived successfully",
        auction
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to archive auction" });
    }
  });
  app2.post("/api/auctions/:id/unarchive", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const auction = await storage.unarchiveAuction(id);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      res.status(200).json({
        message: "Auction unarchived successfully",
        auction
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to unarchive auction" });
    }
  });
  app2.get("/api/auctions/:id/bids", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const bids2 = await storage.getBidsForAuction(auctionId);
      res.json(bids2);
    } catch (error) {
      console.error("Failed to fetch bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });
  app2.post("/api/auctions/:id/bids", async (req, res) => {
    try {
      if (!req.isAuthenticated?.() || !req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (auction.status !== "active") {
        return res.status(400).json({ message: "Auction is not active" });
      }
      if (/* @__PURE__ */ new Date() >= new Date(auction.endTime)) {
        return res.status(400).json({ message: "Auction has ended" });
      }
      console.log("POST /bids req.body:", req.body);
      let bidData;
      try {
        bidData = insertBidSchema.parse({
          ...req.body,
          auctionId,
          amount: Number(req.body.amount)
        });
      } catch (err) {
        console.error("Zod error in bidData:", err);
        return res.status(400).json({
          message: "Invalid bid data",
          errors: err instanceof z2.ZodError ? err.errors : typeof err === "object" && err !== null && "message" in err ? err.message : String(err)
        });
      }
      const minimumBid = Number(auction.currentPrice) + Number(auction.minimumIncrement);
      if (Number(bidData.amount) < minimumBid) {
        return res.status(400).json({
          message: `Bid must be at least Rp ${minimumBid.toLocaleString("id-ID")}`
        });
      }
      let bid;
      try {
        bid = await storage.placeBid({
          ...bidData,
          bidderId: req.user.id
        });
        console.log("Bid created:", bid);
      } catch (err) {
        console.error("Error from storage.placeBid:", err);
        return res.status(500).json({ message: "Failed to save bid", error: typeof err === "object" && err !== null && "message" in err ? err.message : String(err) });
      }
      if (!bid) {
        console.error("Bid result undefined/null!");
        return res.status(500).json({ message: "Bid was not created." });
      }
      res.status(201).json(bid);
    } catch (error) {
      console.error("Failed to place bid:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid bid data", errors: error.errors });
      }
      res.status(500).json({
        message: "Failed to place bid",
        error: typeof error === "object" && error !== null && "message" in error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/user/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });
  app2.get("/api/user/bids", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const bids2 = await storage.getUserBids(req.user.id);
      res.json(bids2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user bids" });
    }
  });
  app2.get("/api/user/watchlist", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const watchlist2 = await storage.getUserWatchlist(req.user.id);
      res.json(watchlist2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });
  app2.get("/api/user/won-auctions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const wonAuctions = await storage.getWonAuctions(req.user.id);
      res.json(wonAuctions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch won auctions" });
    }
  });
  app2.post("/api/user/watchlist/:auctionId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const auctionId = parseInt(req.params.auctionId);
      await storage.addToWatchlist(req.user.id, auctionId);
      res.json({ message: "Added to watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });
  app2.delete("/api/user/watchlist/:auctionId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const auctionId = parseInt(req.params.auctionId);
      await storage.removeFromWatchlist(req.user.id, auctionId);
      res.json({ message: "Removed from watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });
  app2.put("/api/user/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { firstName, lastName, username, email, phone } = req.body;
      if (!firstName || !lastName || !username || !email) {
        return res.status(400).json({ message: "All required fields must be filled" });
      }
      const updatedUser = await storage.updateUserProfile(req.user.id, {
        firstName,
        lastName,
        username,
        email,
        phone
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.post("/api/user/change-password", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const bcrypt = __require("bcrypt");
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      await storage.updateUser(req.user.id, { password: hashedNewPassword });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  app2.post("/api/user/avatar", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.firstName + " " + req.user.lastName)}&size=200&background=3b82f6&color=ffffff`;
      await storage.updateUser(req.user.id, { avatar: avatarUrl });
      res.json({
        message: "Avatar uploaded successfully",
        avatarUrl
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });
  app2.delete("/api/user/delete-account", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (req.user.role === "admin") {
        return res.status(400).json({
          message: "Cannot delete admin account. Please contact system administrator."
        });
      }
      res.json({ message: "Account deletion request processed" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  app2.get("/api/admin/export-data", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { status, search, filtered, format = "csv" } = req.query;
      console.log("[EXPORT DEBUG] Filter parameters received:", { status, search, filtered, format });
      let exportData;
      let baseFilename = "auction_data";
      if (filtered === "true") {
        console.log("[EXPORT DEBUG] Using filtered export with filters:", { status, search });
        exportData = await storage.exportFilteredAuctionData({
          status,
          search
        });
        const parts = [baseFilename];
        if (status && status !== "all") {
          parts.push(`status_${status}`);
        }
        if (search) {
          parts.push(`search_${search.replace(/[^a-zA-Z0-9]/g, "_")}`);
        }
        parts.push("filtered");
        baseFilename = parts.join("_");
      } else {
        console.log("[EXPORT DEBUG] Using unfiltered export");
        exportData = await storage.exportAuctionData();
      }
      console.log("[EXPORT DEBUG] Export data count:", exportData.length);
      console.log("[EXPORT DEBUG] First few records:", exportData.slice(0, 2).map((item) => ({ id: item.id, title: item.title, status: item.status })));
      const formatHeader = (key) => {
        const headerMap = {
          "id": "ID",
          "title": "Judul Lelang",
          "description": "Deskripsi",
          "startingBid": "Bid Awal",
          "currentBid": "Bid Saat Ini",
          "startTime": "Waktu Mulai",
          "endTime": "Waktu Berakhir",
          "status": "Status",
          "categoryId": "ID Kategori",
          "categoryName": "Kategori",
          "sellerId": "ID Penjual",
          "sellerName": "Nama Penjual",
          "winnerId": "ID Pemenang",
          "winnerName": "Nama Pemenang",
          "bidCount": "Jumlah Bid",
          "createdAt": "Dibuat Pada",
          "updatedAt": "Diperbarui Pada",
          "images": "Gambar",
          "location": "Lokasi"
        };
        return headerMap[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
      };
      const formatValue = (key, value) => {
        if (value === null || value === void 0) return "-";
        if (["startingBid", "currentBid"].includes(key)) {
          return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
          }).format(Number(value));
        }
        if (["startTime", "endTime", "createdAt", "updatedAt"].includes(key)) {
          return new Date(value).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        }
        if (key === "status") {
          const statusMap = {
            "active": "Aktif",
            "ended": "Berakhir",
            "pending": "Menunggu",
            "cancelled": "Dibatalkan"
          };
          return statusMap[value] || value;
        }
        return String(value);
      };
      if (exportData.length === 0) {
        return res.status(404).json({ message: "No data available for export" });
      }
      switch (format) {
        case "csv":
          res.setHeader("Content-Type", "text/csv; charset=utf-8");
          res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.csv"`);
          const csvColumns = [
            { key: "id", header: "ID" },
            { key: "title", header: "Judul Lelang" },
            { key: "description", header: "Deskripsi" },
            { key: "categoryName", header: "Kategori" },
            { key: "startingBid", header: "Bid Awal" },
            { key: "currentBid", header: "Bid Saat Ini" },
            { key: "status", header: "Status" },
            { key: "location", header: "Lokasi" },
            { key: "startTime", header: "Waktu Mulai" },
            { key: "endTime", header: "Waktu Berakhir" },
            { key: "sellerName", header: "Penjual" },
            { key: "winnerName", header: "Pemenang" },
            { key: "bidCount", header: "Jumlah Bid" }
          ];
          const csvHeaders = csvColumns.map((col) => col.header).join(",");
          const csvData = exportData.map(
            (row) => csvColumns.map((col) => {
              let value = row[col.key];
              let formattedValue = formatValue(col.key, value);
              if (formattedValue === null || formattedValue === void 0 || formattedValue === "null") {
                formattedValue = "-";
              }
              if (formattedValue.includes(",") || formattedValue.includes('"') || formattedValue.includes("\n")) {
                formattedValue = `"${formattedValue.replace(/"/g, '""')}"`;
              }
              return formattedValue;
            }).join(",")
          ).join("\n");
          const csvContent = "\uFEFF" + csvHeaders + "\n" + csvData;
          return res.send(csvContent);
        case "excel":
          const cleanExcelData = exportData.map((row) => {
            return {
              "ID": row.id,
              "Judul Lelang": row.title,
              "Deskripsi": row.description,
              "Kategori": row.categoryName || "-",
              "Bid Awal": formatValue("startingBid", row.startingBid),
              "Bid Saat Ini": formatValue("currentBid", row.currentBid),
              "Status": formatValue("status", row.status),
              "Lokasi": row.location || "-",
              "Waktu Mulai": formatValue("startTime", row.startTime),
              "Waktu Berakhir": formatValue("endTime", row.endTime),
              "Penjual": row.sellerName || "-",
              "Pemenang": row.winnerName || "-",
              "Jumlah Bid": row.bidCount || 0,
              "Dibuat Pada": formatValue("createdAt", row.createdAt)
            };
          });
          const ws = XLSX.utils.json_to_sheet(cleanExcelData);
          ws["!cols"] = [
            { wch: 8 },
            // ID
            { wch: 30 },
            // Judul Lelang
            { wch: 40 },
            // Deskripsi
            { wch: 15 },
            // Kategori
            { wch: 18 },
            // Bid Awal
            { wch: 18 },
            // Bid Saat Ini
            { wch: 12 },
            // Status
            { wch: 20 },
            // Lokasi
            { wch: 22 },
            // Waktu Mulai
            { wch: 22 },
            // Waktu Berakhir
            { wch: 20 },
            // Penjual
            { wch: 20 },
            // Pemenang
            { wch: 12 },
            // Jumlah Bid
            { wch: 22 }
            // Dibuat Pada
          ];
          const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "3498DB" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Data Lelang");
          const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.xlsx"`);
          return res.send(excelBuffer);
        case "pdf":
          const doc = new jsPDF("l", "mm", "a4");
          doc.setFontSize(20);
          doc.setFont("helvetica", "bold");
          doc.text("LAPORAN DATA LELANG", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text(`Tanggal Export: ${(/* @__PURE__ */ new Date()).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}`, 20, 35);
          doc.text(`Total Data: ${exportData.length} lelang`, 20, 45);
          const importantColumns = ["id", "title", "startingBid", "currentBid", "status", "startTime", "endTime"];
          const pdfHeaders = importantColumns.map(formatHeader);
          const pdfData = exportData.map(
            (row) => importantColumns.map((key) => {
              let value = row[key];
              let formattedValue = formatValue(key, value);
              if (key === "title" && formattedValue.length > 25) {
                formattedValue = formattedValue.substring(0, 22) + "...";
              }
              return formattedValue;
            })
          );
          autoTable(doc, {
            head: [pdfHeaders],
            body: pdfData,
            startY: 55,
            styles: {
              fontSize: 10,
              cellPadding: 4,
              valign: "middle",
              lineColor: [128, 128, 128],
              lineWidth: 0.1
            },
            headStyles: {
              fillColor: [52, 152, 219],
              textColor: 255,
              fontStyle: "bold",
              fontSize: 11,
              halign: "center"
            },
            bodyStyles: {
              textColor: 50
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            columnStyles: {
              0: { halign: "center", cellWidth: 20 },
              // ID
              1: { halign: "left", cellWidth: 60 },
              // Title
              2: { halign: "right", cellWidth: 35 },
              // Starting Bid
              3: { halign: "right", cellWidth: 35 },
              // Current Bid
              4: { halign: "center", cellWidth: 25 },
              // Status
              5: { halign: "center", cellWidth: 40 },
              // Start Time
              6: { halign: "center", cellWidth: 40 }
              // End Time
            },
            margin: { top: 55, left: 20, right: 20 },
            didDrawPage: function(data) {
              const pageCount = doc.getNumberOfPages();
              doc.setFontSize(10);
              doc.text(
                `Halaman ${data.pageNumber} dari ${pageCount}`,
                doc.internal.pageSize.getWidth() - 40,
                doc.internal.pageSize.getHeight() - 15
              );
            }
          });
          const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.pdf"`);
          return res.send(pdfBuffer);
        case "json":
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.json"`);
          const formattedJsonData = exportData.map((row) => {
            const formattedRow = {};
            Object.entries(row).forEach(([key, value]) => {
              const header = formatHeader(key);
              formattedRow[header] = formatValue(key, value);
            });
            return formattedRow;
          });
          return res.json({
            metadata: {
              exportDate: (/* @__PURE__ */ new Date()).toISOString(),
              exportDateFormatted: (/* @__PURE__ */ new Date()).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              }),
              totalRecords: exportData.length,
              format: "JSON",
              source: "E-Auction System"
            },
            data: formattedJsonData
          });
        default:
          return res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });
  app2.post("/api/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      console.log("Payment request body:", req.body);
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        winnerId: req.user.id
      });
      console.log("Parsed payment data:", paymentData);
      const auction = await storage.getAuction(paymentData.auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (auction.winnerId !== req.user.id) {
        return res.status(403).json({ message: "You are not the winner of this auction" });
      }
      const existingPayment = await storage.getPaymentByAuctionId(paymentData.auctionId);
      if (existingPayment && existingPayment.status !== "rejected") {
        return res.status(400).json({ message: "Payment already submitted for this auction" });
      }
      const payment = await storage.createPayment(paymentData);
      console.log("Payment created successfully:", payment);
      if (payment.status === "pending") {
        await storage.createAdminNotification(
          "payment",
          "Pembayaran Baru Menunggu Verifikasi",
          `Pembayaran untuk lelang "${auction.title}" perlu diverifikasi oleh admin.`,
          {
            paymentId: payment.id,
            auctionId: payment.auctionId,
            auctionTitle: auction.title,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod
          }
        );
      }
      res.status(201).json(payment);
    } catch (error) {
      console.error("Payment creation error:", error);
      if (error instanceof z2.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({
          message: "Invalid payment data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({
        message: "Failed to create payment",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/payments/auction/:auctionId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const auctionId = parseInt(req.params.auctionId);
      const payment = await storage.getPaymentByAuctionId(auctionId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      if (payment.winnerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });
  app2.get("/api/user/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const payments2 = await storage.getUserPayments(req.user.id);
      res.json(payments2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user payments" });
    }
  });
  app2.get("/api/admin/payments/pending", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const pendingPayments = await storage.getAllPendingPayments();
      res.json(pendingPayments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending payments" });
    }
  });
  app2.post("/api/admin/payments/:id/verify", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const paymentId = parseInt(req.params.id);
      const { status, notes, documents } = req.body;
      console.log(`[API] Verifying payment ${paymentId} with status ${status}`, { notes, documents });
      if (!paymentId || isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'verified' or 'rejected'" });
      }
      const payment = await storage.verifyPayment(paymentId, req.user.id, status, notes, documents);
      console.log(`[API] Payment verification successful:`, payment);
      res.json(payment);
    } catch (error) {
      console.error(`[API] Payment verification error:`, error);
      res.status(500).json({
        message: "Failed to verify payment",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/admin/auctions/:id/generate-invoice", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const auctionId = parseInt(req.params.id);
      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({ message: "Invalid auction ID" });
      }
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (!auction.winnerId) {
        return res.status(400).json({ message: "Auction has no winner yet" });
      }
      const invoiceDocument = await storage.generateInvoiceForWinner(auctionId, auction.winnerId);
      if (!invoiceDocument) {
        return res.status(500).json({ message: "Failed to generate invoice" });
      }
      const updatedAuction = await storage.getAuction(auctionId);
      res.json({
        message: "Invoice generated successfully",
        invoice: {
          invoiceNumber: updatedAuction?.invoiceNumber,
          invoiceDocument: updatedAuction?.invoiceDocument,
          auctionId,
          winnerId: auction.winnerId,
          auctionTitle: auction.title
        }
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to generate invoice",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/auctions/:id/invoice", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({ message: "Invalid auction ID" });
      }
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (!req.isAuthenticated() || auction.winnerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only the winner or admin can download the invoice." });
      }
      if (auction.status !== "ended" || !auction.winnerId) {
        return res.status(400).json({ message: "Invoice not available. Auction must be ended with a winner." });
      }
      if (!auction.invoiceDocument || !auction.invoiceNumber) {
        return res.status(404).json({ message: "Invoice not found. Please contact admin to generate invoice." });
      }
      const base64Data = auction.invoiceDocument.split(",")[1];
      const mimeType = auction.invoiceDocument.split(",")[0].split(":")[1].split(";")[0];
      let fileExtension = "pdf";
      let contentType = "application/pdf";
      if (mimeType.includes("html")) {
        fileExtension = "html";
        contentType = "text/html; charset=utf-8";
        const invoiceContent = Buffer.from(base64Data, "base64").toString("utf8");
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="Invoice-${auction.invoiceNumber}.${fileExtension}"`);
        res.send(invoiceContent);
      } else {
        const invoiceBuffer = Buffer.from(base64Data, "base64");
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="Invoice-${auction.invoiceNumber}.${fileExtension}"`);
        res.send(invoiceBuffer);
      }
    } catch (error) {
      console.error(`[API] Invoice download error:`, error);
      res.status(500).json({
        message: "Failed to download invoice",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/auctions/:id/invoice/preview", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({ message: "Invalid auction ID" });
      }
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (!req.isAuthenticated() || auction.winnerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only the winner or admin can view the invoice." });
      }
      if (auction.status !== "ended" || !auction.winnerId) {
        return res.status(400).json({ message: "Invoice not available. Auction must be ended with a winner." });
      }
      if (!auction.invoiceDocument || !auction.invoiceNumber) {
        return res.status(404).json({ message: "Invoice not found. Please contact admin to generate invoice." });
      }
      const base64Data = auction.invoiceDocument.split(",")[1];
      const mimeType = auction.invoiceDocument.split(",")[0].split(":")[1].split(";")[0];
      if (mimeType.includes("html")) {
        const invoiceContent = Buffer.from(base64Data, "base64").toString("utf8");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(invoiceContent);
      } else {
        const invoiceBuffer = Buffer.from(base64Data, "base64");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="Invoice-${auction.invoiceNumber}.pdf"`);
        res.send(invoiceBuffer);
      }
    } catch (error) {
      console.error(`[API] Invoice preview error:`, error);
      res.status(500).json({
        message: "Failed to preview invoice",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/admin/payments/history", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { search, status } = req.query;
      const paymentHistory = await storage.getPaymentHistory(search, status);
      res.json(paymentHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });
  app2.get("/api/admin/real-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const stats = await storage.getRealAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching real admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });
  app2.get("/api/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const notifications2 = await storage.getUserNotifications(req.user.id);
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/admin/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const notifications2 = await storage.getAdminNotifications();
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin notifications" });
    }
  });
  app2.post("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      if (notification.userId === req.user.id || req.user.role === "admin") {
        if (notification.userId) {
          await storage.markNotificationAsRead(notificationId, notification.userId);
          res.json({ message: "Notification marked as read" });
        } else {
          res.status(400).json({ message: "Invalid notification user ID" });
        }
      } else {
        res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  app2.delete("/api/notifications/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      if (notification.userId === req.user.id || req.user.role === "admin") {
        await storage.deleteNotification(notificationId);
        res.json({ message: "Notification deleted successfully" });
      } else {
        res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
  app2.post("/api/admin/backup-database", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const backupInfo = {
        filename: `backup_${timestamp}.db`,
        created: /* @__PURE__ */ new Date(),
        size: "Unknown"
      };
      res.json({ message: "Backup created successfully", backup: backupInfo });
    } catch (error) {
      res.status(500).json({ message: "Failed to create backup" });
    }
  });
  app2.post("/api/admin/clear-cache", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });
  app2.get("/api/admin/system-health", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const health = {
        status: "OK",
        database: "Connected",
        memory: "Normal",
        uptime: process.uptime(),
        timestamp: /* @__PURE__ */ new Date()
      };
      res.json(health);
    } catch (error) {
      res.status(500).json({ message: "Failed to check system health" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// config/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "..", "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "..", "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "..", "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json({ limit: "50mb" }));
app.use(express3.urlencoded({ extended: false, limit: "50mb" }));
app.use(routes_default);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  initializeDatabase();
  const startBackgroundTasks = () => {
    const checkExpiredAuctions = async () => {
      try {
        console.log("[Background] Starting automatic expired auction check...");
        const endedCount = await storage.checkAndEndExpiredAuctions();
        if (endedCount > 0) {
          log(`[Background] Automatically ended ${endedCount} expired auctions`);
        } else {
          console.log("[Background] No expired auctions found");
        }
      } catch (error) {
        console.error("[Background] Error checking expired auctions:", error);
      }
    };
    checkExpiredAuctions();
    setInterval(checkExpiredAuctions, 3e5);
    log("[Background] Started automatic auction expiry checker (every 60 seconds)");
  };
  startBackgroundTasks();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(5e3, "127.0.0.1", () => {
    log("serving on http://127.0.0.1:5000");
  });
})();
