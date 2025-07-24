import {
  users,
  auctions,
  bids,
  categories,
  watchlist,
  type User,
  type InsertUser,
  type Auction,
  type InsertAuction,
  type Bid,
  type InsertBid,
  type Category,
  type InsertCategory,
  type AuctionWithDetails,
  type UserStats
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, count, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUserStats(userId: number): Promise<UserStats>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Auctions
  getAuctions(filters?: {
    status?: string;
    categoryId?: number;
    search?: string;
    includeArchived?: boolean;
  }): Promise<AuctionWithDetails[]>;
  getAuction(id: number): Promise<AuctionWithDetails | undefined>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  updateAuction(id: number, updates: Partial<Auction>): Promise<Auction | undefined>;
  deleteAuction(id: number): Promise<boolean>;
  endAuction(id: number): Promise<Auction | undefined>;
  archiveAuction(auctionId: number): Promise<AuctionWithDetails | undefined>;
  unarchiveAuction(auctionId: number): Promise<AuctionWithDetails | undefined>;
  getArchivedAuctions(): Promise<AuctionWithDetails[]>;
  getWonAuctions(userId: number): Promise<AuctionWithDetails[]>;

  // Bids
  getBidsForAuction(auctionId: number): Promise<(Bid & { bidder: User })[]>;
  getUserBids(userId: number): Promise<(Bid & { auction: Auction })[]>;
  placeBid(bid: InsertBid & { bidderId: number }): Promise<Bid>;
  getHighestBid(auctionId: number): Promise<Bid | undefined>;

  // Watchlist
  addToWatchlist(userId: number, auctionId: number): Promise<void>;
  removeFromWatchlist(userId: number, auctionId: number): Promise<void>;
  getUserWatchlist(userId: number): Promise<AuctionWithDetails[]>;

  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const now = new Date();

    const activeBidsResult = await db
      .select({ count: count() })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .where(and(
        eq(bids.bidderId, userId),
        eq(auctions.status, "active"),
        gte(auctions.endTime, now)
      ));

    const wonAuctionsResult = await db
      .select({ count: count() })
      .from(auctions)
      .where(eq(auctions.winnerId, userId));

    const watchlistResult = await db
      .select({ count: count() })
      .from(watchlist)
      .where(eq(watchlist.userId, userId));

    return {
      activeBids: activeBidsResult[0]?.count || 0,
      wonAuctions: wonAuctionsResult[0]?.count || 0,
      watchlistCount: watchlistResult[0]?.count || 0
    };
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  async getAuctions(filters?: {
    status?: string;
    categoryId?: number;
    search?: string;
    includeArchived?: boolean;
  }): Promise<AuctionWithDetails[]> {
    let query = db
      .select({
        auction: auctions,
        category: categories,
      })
      .from(auctions)
      .innerJoin(categories, eq(auctions.categoryId, categories.id));

    const whereClauses = [];

    // Exclude archived auctions by default
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
      whereClauses.push(sql`title LIKE '%' || ${filters.search} || '%'`);
    }

    const results = await (
      whereClauses.length > 0
        ? query.where(and(...whereClauses)).orderBy(desc(auctions.createdAt))
        : query.orderBy(desc(auctions.createdAt))
    );

    // Get bids for each auction
    const auctionsWithBids = await Promise.all(
      results.map(async (result) => {
        const auctionBids = await this.getBidsForAuction(result.auction.id);
        return {
          ...result.auction,
          category: result.category,
          bids: auctionBids,
          _count: { bids: auctionBids.length },
        };
      })
    );

    return auctionsWithBids;
  }

  async getAuction(id: number): Promise<AuctionWithDetails | undefined> {
    const [result] = await db
      .select({
        auction: auctions,
        category: categories,
      })
      .from(auctions)
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .where(eq(auctions.id, id));

    if (!result) return undefined;

    const auctionBids = await this.getBidsForAuction(id);

    return {
      ...result.auction,
      category: result.category,
      bids: auctionBids,
      _count: { bids: auctionBids.length },
    };
  }

  async createAuction(auction: InsertAuction): Promise<Auction> {
    try {
      // PATCH: Pastikan semua field waktu berupa Date!
      if (auction.endTime && typeof auction.endTime === "number") {
        auction.endTime = new Date(auction.endTime * 1000);
      } else if (typeof auction.endTime === "string") {
        auction.endTime = new Date(auction.endTime);
      }
      if (auction.startTime && typeof auction.startTime === "number") {
        auction.startTime = new Date(auction.startTime * 1000);
      } else if (typeof auction.startTime === "string") {
        auction.startTime = new Date(auction.startTime);
      }
      if (auction.createdAt && typeof auction.createdAt === "number") {
        auction.createdAt = new Date(auction.createdAt * 1000);
      } else if (typeof auction.createdAt === "string") {
        auction.createdAt = new Date(auction.createdAt);
      }
      if (!auction.startTime) {
        auction.startTime = new Date();
      }
      if (!auction.createdAt) {
        auction.createdAt = new Date();
      }
      if (!auction.currentPrice) {
        auction.currentPrice = auction.startingPrice;
      }

      const [created] = await db.insert(auctions).values(auction).returning();
      return created;
    } catch (err) {
      console.error("Failed to create auction:", err, auction);
      throw err;
    }
  }

  async updateAuction(id: number, updates: Partial<Auction>): Promise<Auction | undefined> {
    // PATCH: pastikan waktu tetap Date jika ada
    if (updates.endTime && typeof updates.endTime === "number") {
      updates.endTime = new Date(updates.endTime * 1000);
    } else if (typeof updates.endTime === "string") {
      updates.endTime = new Date(updates.endTime);
    }
    if (updates.startTime && typeof updates.startTime === "number") {
      updates.startTime = new Date(updates.startTime * 1000);
    } else if (typeof updates.startTime === "string") {
      updates.startTime = new Date(updates.startTime);
    }
    if (updates.createdAt && typeof updates.createdAt === "number") {
      updates.createdAt = new Date(updates.createdAt * 1000);
    } else if (typeof updates.createdAt === "string") {
      updates.createdAt = new Date(updates.createdAt);
    }

    const [auction] = await db
      .update(auctions)
      .set(updates)
      .where(eq(auctions.id, id))
      .returning();
    return auction || undefined;
  }

  async deleteAuction(id: number): Promise<boolean> {
    // PATCH: cek dengan returning().length
    const result = await db.delete(auctions).where(eq(auctions.id, id)).returning();
    return result.length > 0;
  }

  async endAuction(id: number): Promise<Auction | undefined> {
    const highestBid = await this.getHighestBid(id);
    const winnerId = highestBid?.bidderId || null;

    const [auction] = await db
      .update(auctions)
      .set({
        status: "ended",
        winnerId: winnerId
      })
      .where(eq(auctions.id, id))
      .returning();

    return auction || undefined;
  }

  async archiveAuction(auctionId: number): Promise<AuctionWithDetails | undefined> {
    const result = await db
      .update(auctions)
      .set({ archived: true })
      .where(eq(auctions.id, auctionId))
      .returning();
    if (result.length === 0) {
      console.error(`[archiveAuction] Tidak ada auction dengan id`, auctionId);
    } else {
      console.log(`[archiveAuction] Auction id ${auctionId} berhasil diarsipkan.`);
    }
    return this.getAuction(auctionId);
  }

  async unarchiveAuction(auctionId: number): Promise<AuctionWithDetails | undefined> {
    await db
      .update(auctions)
      .set({ archived: false })
      .where(eq(auctions.id, auctionId))
      .returning();

    return this.getAuction(auctionId);
  }

  async getWonAuctions(userId: number): Promise<AuctionWithDetails[]> {
    const results = await db
      .select({
        auction: auctions,
        category: categories,
      })
      .from(auctions)
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .where(and(eq(auctions.winnerId, userId), eq(auctions.archived, false)))
      .orderBy(desc(auctions.createdAt));

    const auctionsWithBids = await Promise.all(
      results.map(async (result) => {
        const auctionBids = await this.getBidsForAuction(result.auction.id);
        return {
          ...result.auction,
          category: result.category,
          bids: auctionBids,
          _count: { bids: auctionBids.length },
        };
      })
    );

    return auctionsWithBids;
  }

  async getArchivedAuctions(): Promise<AuctionWithDetails[]> {
    try {
      const results = await db
        .select({
          auction: auctions,
          category: categories,
        })
        .from(auctions)
        .innerJoin(categories, eq(auctions.categoryId, categories.id))
        .where(eq(auctions.archived, true))
        .orderBy(desc(auctions.createdAt));

      console.log(`[getArchivedAuctions] Jumlah data arsip:`, results.length);
      if (results.length === 0) {
        console.warn(`[getArchivedAuctions] Tidak ada data lelang yang diarsipkan.`);
      }

      // FLATTEN: spread result.auction ke root agar frontend bisa akses id, title, dst langsung
      const auctionsWithBids = await Promise.all(
        results.map(async (result) => {
          const auctionBids = await this.getBidsForAuction(result.auction.id);
          return {
            ...result.auction,
            category: result.category,
            bids: auctionBids,
            _count: { bids: auctionBids.length },
          };
        })
      );

      return auctionsWithBids;
    } catch (error) {
      console.error("Error fetching archived auctions:", error);
      return [];
    }
  }

  async getBidsForAuction(auctionId: number): Promise<(Bid & { bidder: User })[]> {
    const results = await db
      .select({
        bid: bids,
        bidder: users,
      })
      .from(bids)
      .innerJoin(users, eq(bids.bidderId, users.id))
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.createdAt));

    return results.map(result => ({
      ...result.bid,
      bidder: result.bidder,
    }));
  }

  async getUserBids(userId: number): Promise<(Bid & { auction: Auction })[]> {
    const results = await db
      .select({
        bid: bids,
        auction: auctions,
      })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .where(eq(bids.bidderId, userId))
      .orderBy(desc(bids.createdAt));

    return results.map(result => ({
      ...result.bid,
      auction: result.auction,
    }));
  }

  // Hapus seluruh fungsi placeBid lama, ganti dengan ini:

  async placeBid(bid: InsertBid & { bidderId: number }): Promise<Bid> {
    // Pastikan createdAt selalu ada
    const toInsert = {
      ...bid,
      createdAt: bid.createdAt ?? new Date(),
    };

    // 1) Insert bid
    const [created] = await db
      .insert(bids)
      .values(toInsert)
      .returning();

    if (!created) {
      throw new Error("Failed to create bid");
    }

    // 2) Update auction current price
    await db
      .update(auctions)
      .set({ currentPrice: bid.amount })
      .where(eq(auctions.id, bid.auctionId))
      // di SQLite returning() tidak selalu didukung, jadi kita abaikan hasilnya
      .execute();

    return created;
  }



  async getHighestBid(auctionId: number): Promise<Bid | undefined> {
    const [bid] = await db
      .select()
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.amount))
      .limit(1);

    return bid || undefined;
  }

  async addToWatchlist(userId: number, auctionId: number): Promise<void> {
    await db
      .insert(watchlist)
      .values({ userId, auctionId })
      .onConflictDoNothing();
  }

  async removeFromWatchlist(userId: number, auctionId: number): Promise<void> {
    await db
      .delete(watchlist)
      .where(and(
        eq(watchlist.userId, userId),
        eq(watchlist.auctionId, auctionId)
      ));
  }

  async getUserWatchlist(userId: number): Promise<AuctionWithDetails[]> {
    const results = await db
      .select({
        auction: auctions,
        category: categories,
      })
      .from(watchlist)
      .innerJoin(auctions, eq(watchlist.auctionId, auctions.id))
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.createdAt));

    const auctionsWithBids = await Promise.all(
      results.map(async (result) => {
        const auctionBids = await this.getBidsForAuction(result.auction.id);
        return {
          ...result.auction,
          category: result.category,
          bids: auctionBids,
          _count: { bids: auctionBids.length },
        };
      })
    );

    return auctionsWithBids;
  }
}

export const storage = new DatabaseStorage();