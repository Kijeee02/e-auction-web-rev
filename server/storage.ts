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
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";
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

  // Auctions
  getAuctions(filters?: {
    status?: string;
    categoryId?: number;
    sellerId?: number;
    search?: string;
  }): Promise<AuctionWithDetails[]>;
  getAuction(id: number): Promise<AuctionWithDetails | undefined>;
  createAuction(auction: InsertAuction, sellerId: number): Promise<Auction>;
  updateAuction(id: number, updates: Partial<Auction>): Promise<Auction | undefined>;
  deleteAuction(id: number): Promise<boolean>;
  endAuction(id: number): Promise<Auction | undefined>;

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
    
    // Get active bids count
    const activeBidsResult = await db
      .select({ count: count() })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .where(and(
        eq(bids.bidderId, userId),
        eq(auctions.status, "active"),
        gte(auctions.endTime, now)
      ));

    // Get won auctions count
    const wonAuctionsResult = await db
      .select({ count: count() })
      .from(auctions)
      .where(eq(auctions.winnerId, userId));

    // Get watchlist count
    const watchlistResult = await db
      .select({ count: count() })
      .from(watchlist)
      .where(eq(watchlist.userId, userId));

    // Get user rating
    const user = await this.getUser(userId);

    return {
      activeBids: activeBidsResult[0]?.count || 0,
      wonAuctions: wonAuctionsResult[0]?.count || 0,
      watchlistCount: watchlistResult[0]?.count || 0,
      rating: user?.rating || "0.00",
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

  async getAuctions(filters?: {
    status?: string;
    categoryId?: number;
    sellerId?: number;
    search?: string;
  }): Promise<AuctionWithDetails[]> {
    let query = db
      .select({
        auction: auctions,
        seller: users,
        category: categories,
      })
      .from(auctions)
      .innerJoin(users, eq(auctions.sellerId, users.id))
      .innerJoin(categories, eq(auctions.categoryId, categories.id));

    if (filters?.status) {
      query = query.where(eq(auctions.status, filters.status));
    }
    if (filters?.categoryId) {
      query = query.where(eq(auctions.categoryId, filters.categoryId));
    }
    if (filters?.sellerId) {
      query = query.where(eq(auctions.sellerId, filters.sellerId));
    }

    const results = await query.orderBy(desc(auctions.createdAt));

    // Get bids for each auction
    const auctionsWithBids = await Promise.all(
      results.map(async (result) => {
        const auctionBids = await this.getBidsForAuction(result.auction.id);
        return {
          ...result.auction,
          seller: result.seller,
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
        seller: users,
        category: categories,
      })
      .from(auctions)
      .innerJoin(users, eq(auctions.sellerId, users.id))
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .where(eq(auctions.id, id));

    if (!result) return undefined;

    const auctionBids = await this.getBidsForAuction(id);

    return {
      ...result.auction,
      seller: result.seller,
      category: result.category,
      bids: auctionBids,
      _count: { bids: auctionBids.length },
    };
  }

  async createAuction(auction: InsertAuction, sellerId: number): Promise<Auction> {
    const [newAuction] = await db
      .insert(auctions)
      .values({
        ...auction,
        sellerId,
        currentPrice: auction.startingPrice,
      })
      .returning();
    return newAuction;
  }

  async updateAuction(id: number, updates: Partial<Auction>): Promise<Auction | undefined> {
    const [auction] = await db
      .update(auctions)
      .set(updates)
      .where(eq(auctions.id, id))
      .returning();
    return auction || undefined;
  }

  async deleteAuction(id: number): Promise<boolean> {
    const result = await db.delete(auctions).where(eq(auctions.id, id));
    return result.rowCount > 0;
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

  async placeBid(bid: InsertBid & { bidderId: number }): Promise<Bid> {
    // Start transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Place the bid
      const [newBid] = await tx
        .insert(bids)
        .values(bid)
        .returning();

      // Update auction current price
      await tx
        .update(auctions)
        .set({ currentPrice: bid.amount })
        .where(eq(auctions.id, bid.auctionId));

      return newBid;
    });

    return result;
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
        seller: users,
        category: categories,
      })
      .from(watchlist)
      .innerJoin(auctions, eq(watchlist.auctionId, auctions.id))
      .innerJoin(users, eq(auctions.sellerId, users.id))
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.createdAt));

    // Get bids for each auction
    const auctionsWithBids = await Promise.all(
      results.map(async (result) => {
        const auctionBids = await this.getBidsForAuction(result.auction.id);
        return {
          ...result.auction,
          seller: result.seller,
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
