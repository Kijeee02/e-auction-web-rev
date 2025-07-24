import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("user"), // "user" or "admin"
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  rating: real("rating").default(0.00),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const auctions = sqliteTable("auctions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startingPrice: real("starting_price").notNull(),
  currentPrice: real("current_price").notNull(),
  minimumIncrement: real("minimum_increment").notNull().default(50000),
  condition: text("condition").notNull(), // "new", "like_new", "good", "fair"
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("active"), // "active", "ended", "cancelled"
  startTime: integer("start_time", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  winnerId: integer("winner_id").references(() => users.id),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  // Vehicle-specific fields
  productionYear: integer("production_year"),
  plateNumber: text("plate_number"),
  chassisNumber: text("chassis_number"),
  engineNumber: text("engine_number"),
  documentInfo: text("document_info"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const bids = sqliteTable("bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  amount: real("amount").notNull(),
  bidderId: integer("bidder_id").references(() => users.id).notNull(),
  auctionId: integer("auction_id").references(() => auctions.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  auctionId: integer("auction_id").references(() => auctions.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  auctionId: integer("auction_id").references(() => auctions.id).notNull(),
  winnerId: integer("winner_id").references(() => users.id).notNull(),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // "bank_transfer", "ewallet", etc.
  paymentProof: text("payment_proof"), // URL to uploaded proof image
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  status: text("status").notNull().default("pending"), // "pending", "verified", "rejected"
  notes: text("notes"), // Admin notes
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  verifiedAt: integer("verified_at", { mode: "timestamp" }),
  verifiedBy: integer("verified_by").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bids: many(bids),
  wonAuctions: many(auctions, { relationName: "winner" }),
  watchlist: many(watchlist),
}));

export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  winner: one(users, {
    fields: [auctions.winnerId],
    references: [users.id],
    relationName: "winner",
  }),
  category: one(categories, {
    fields: [auctions.categoryId],
    references: [categories.id],
  }),
  bids: many(bids),
  watchlist: many(watchlist),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id],
  }),
  auction: one(auctions, {
    fields: [bids.auctionId],
    references: [auctions.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  auctions: many(auctions),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id],
  }),
  auction: one(auctions, {
    fields: [watchlist.auctionId],
    references: [auctions.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  auction: one(auctions, {
    fields: [payments.auctionId],
    references: [auctions.id],
  }),
  winner: one(users, {
    fields: [payments.winnerId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  role: true,
  isActive: true,
  rating: true,
});

export const insertAuctionSchema = createInsertSchema(auctions)
  .omit({
    id: true,
    winnerId: true,
    status: true,
  })
  .extend({
    endTime: z.preprocess((arg) => {
      if (arg instanceof Date) return arg;
      if (typeof arg === "number" && arg < 1e12) return new Date(arg * 1000);
      if (typeof arg === "number") return new Date(arg);
      if (typeof arg === "string") return new Date(arg);
      return arg;
    }, z.date().refine(d => d > new Date(), "Waktu berakhir harus di masa depan")),
    startTime: z.preprocess((arg) => {
      if (arg instanceof Date) return arg;
      if (typeof arg === "number" && arg < 1e12) return new Date(arg * 1000);
      if (typeof arg === "number") return new Date(arg);
      if (typeof arg === "string") return new Date(arg);
      return arg;
    }, z.date().optional()),
    createdAt: z.preprocess((arg) => {
      if (arg instanceof Date) return arg;
      if (typeof arg === "number" && arg < 1e12) return new Date(arg * 1000);
      if (typeof arg === "number") return new Date(arg);
      if (typeof arg === "string") return new Date(arg);
      return arg;
    }, z.date().optional()),
    startingPrice: z.number().min(0, "Harga awal harus lebih dari 0"),
    currentPrice: z.number().default(0),
    condition: z.enum(["new", "like_new", "good", "fair"]),
    imageUrl: z.string().optional(),
    minimumIncrement: z.number().default(50000),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    categoryId: z.number(),
    // Vehicle-specific fields (optional)
    productionYear: z.number().optional(),
    plateNumber: z.string().optional(),
    chassisNumber: z.string().optional(),
    engineNumber: z.string().optional(),
    documentInfo: z.string().optional(),
  });




export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  bidderId: true,
}).extend({
  createdAt: z.preprocess(
    (arg) => {
      if (arg instanceof Date) return arg;
      if (typeof arg === "number" && arg < 1e12) return new Date(arg * 1000);
      if (typeof arg === "number") return new Date(arg);
      if (typeof arg === "string") return new Date(arg);
      return arg;
    }, z.date().optional()
  )
});


export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  isActive: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
  verifiedBy: true,
}).extend({
  paymentMethod: z.enum(["bank_transfer", "ewallet", "cash"]),
  status: z.enum(["pending", "verified", "rejected"]).default("pending"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Watchlist = typeof watchlist.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Extended types with relations
export type AuctionWithDetails = Auction & {
  category: Category;
  bids: (Bid & { bidder: User })[];
  _count?: { bids: number };
};

export type UserStats = {
  activeBids: number;
  wonAuctions: number;
  watchlistCount: number;
};
