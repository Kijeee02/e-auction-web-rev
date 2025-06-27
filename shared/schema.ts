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
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  winnerId: integer("winner_id").references(() => users.id),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  auctions: many(auctions, { relationName: "seller" }),
  bids: many(bids),
  wonAuctions: many(auctions, { relationName: "winner" }),
  watchlist: many(watchlist),
}));

export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  seller: one(users, {
    fields: [auctions.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
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

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  role: true,
  isActive: true,
  rating: true,
});

export const insertAuctionSchema = createInsertSchema(auctions).omit({
  id: true,
  createdAt: true,
  sellerId: true,
  winnerId: true,
  status: true,
  currentPrice: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  bidderId: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  isActive: true,
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

// Extended types with relations
export type AuctionWithDetails = Auction & {
  seller: User;
  category: Category;
  bids: (Bid & { bidder: User })[];
  _count?: { bids: number };
};

export type UserStats = {
  activeBids: number;
  wonAuctions: number;
  watchlistCount: number;
  rating: string;
};
