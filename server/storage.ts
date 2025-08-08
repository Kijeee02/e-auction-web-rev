import {
  users,
  auctions,
  bids,
  categories,
  watchlist,
  payments,
  notifications,
  type User,
  type Auction,
  type Bid,
  type Category,
  type Payment,
  type Notification,
  type AuctionWithDetails,
  type AuctionUpdate,
  type UserStats,
  type InsertAuction,
  type InsertBid,
  type InsertCategory,
  type InsertPayment,
  type InsertNotification,
} from "../shared/schema.js";

// Helper functions for image handling
function serializeImages(images: string[] | undefined): string | undefined {
  if (!images || images.length === 0) return undefined;
  return JSON.stringify(images);
}

function deserializeImages(imageData: string | null | undefined): string[] {
  if (!imageData) return [];
  try {
    const parsed = JSON.parse(imageData);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Fallback for old single image format
    return imageData ? [imageData] : [];
  }
}

import { db } from "./db";
import { eq, desc, and, or, like, ilike, ne, gte, count, sql, inArray } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
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
  updateAuction(id: number, updates: AuctionUpdate): Promise<Auction | undefined>;
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

  // Payments
  getPaymentsForUser(userId: number): Promise<Payment[]>;
  getUserPayments(userId: number): Promise<(Payment & { auction?: Auction })[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByAuctionId(auctionId: number): Promise<Payment | undefined>;
  getAllPendingPayments(): Promise<(Payment & { auction?: Auction; winner?: User })[]>;
  verifyPayment(paymentId: number, adminId: number, status: string, notes?: string, documents?: any): Promise<Payment>;
  getPaymentHistory(search?: string, statusFilter?: string): Promise<(Payment & { auction?: Auction; winner?: User })[]>;

  // Session store
  sessionStore: any;

  // Automatic expiry checking
  checkAndEndExpiredAuctions(): Promise<number>;
  generateInvoiceForWinner(auctionId: number, winnerId: number): Promise<string | null>;

  updateUserProfile(userId: number, profileData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone?: string;
  }): Promise<User | null>;

  // Real admin statistics
  getRealAdminStats(): Promise<{
    totalUsers: number;
    activeAuctions: number;
    completedAuctions: number;
    totalRevenue: number;
  }>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getAdminNotifications(): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(notificationId: number, userId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(notificationId: number): Promise<void>;

  // Admin Notifications
  createAdminNotification(type: string, title: string, message: string, data: any): Promise<void>;
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    // Remove undefined fields to avoid SQL errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      const [user] = await db
        .update(users)
        .set(cleanUpdates)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    }
    return this.getUser(id);
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
          imageUrls: deserializeImages(result.auction.imageUrls),
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
      imageUrls: deserializeImages(result.auction.imageUrls),
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

      // Serialize images for database storage
      const auctionData = {
        ...auction,
        imageUrls: serializeImages(auction.imageUrls),
      };

      const [created] = await db.insert(auctions).values(auctionData).returning();

      // Return the created auction without modifying imageUrls type
      return created;
    } catch (err) {
      console.error("Failed to create auction:", err, auction);
      throw err;
    }
  }

  async updateAuction(id: number, updates: AuctionUpdate): Promise<Auction | undefined> {
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

    // Get current auction data to check current status
    const currentAuction = await this.getAuction(id);
    if (!currentAuction) {
      return undefined;
    }

    // If endTime is being updated and current auction is "ended", check if we should reactivate
    if (updates.endTime && currentAuction.status === "ended") {
      const now = new Date();
      const newEndTime = new Date(updates.endTime);

      console.log(`[updateAuction] Auction ${id} status check: currentStatus=${currentAuction.status}, newEndTime=${newEndTime.toISOString()}, now=${now.toISOString()}`);

      // If new end time is in the future, reactivate the auction
      if (newEndTime > now) {
        updates.status = "active";
        // Clear winner since auction is active again
        updates.winnerId = null;
        console.log(`[updateAuction] Reactivating auction ${id} because new end time is in future`);
      }
    }

    // Serialize images if they are being updated
    const updatesData = {
      ...updates,
      imageUrls: updates.imageUrls ? serializeImages(updates.imageUrls) : undefined,
    };

    const [auction] = await db
      .update(auctions)
      .set(updatesData)
      .where(eq(auctions.id, id))
      .returning();

    if (!auction) return undefined;

    return auction;
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

    // Create notifications
    if (auction) {
      if (winnerId) {
        // Get winner details to check if they're not admin
        const winner = await this.getUser(winnerId);

        // Only notify winner if they're not an admin
        if (winner && winner.role !== "admin") {
          // Auto-generate invoice for the winner
          const invoiceDocument = await this.generateInvoiceForWinner(id, winnerId);

          // Get updated auction to get invoice number
          const updatedAuction = await this.getAuction(id);
          const invoiceNumber = updatedAuction?.invoiceNumber;

          console.log(`[endAuction] Auto-generated invoice for auction ${id}, winner ${winnerId}: ${invoiceNumber || 'failed'}`);

          await this.createNotification({
            userId: winnerId,
            type: "auction",
            title: "Selamat! Anda Menang",
            message: `Anda memenangkan lelang ${auction.title}. Invoice telah dibuat dengan nomor ${invoiceNumber || 'N/A'}. Silakan lakukan pembayaran.`,
            data: JSON.stringify({
              auctionId: id,
              auctionTitle: auction.title,
              winningBid: highestBid?.amount,
              invoiceNumber: invoiceNumber,
              action: "view_payment",
            }),
          });
        }

        // Notify other bidders that they lost (excluding admins)
        const allBids = await this.getBidsForAuction(id);
        const otherBidders = allBids
          .filter(bid => bid.bidderId !== winnerId)
          .map(bid => bid.bidderId);

        const uniqueBidders = Array.from(new Set(otherBidders));

        for (const bidderId of uniqueBidders) {
          // Check if bidder is not admin before notifying
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
                action: "view_auction",
              }),
            });
          }
        }
      }
    }

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
          imageUrls: deserializeImages(result.auction.imageUrls),
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
            imageUrls: deserializeImages(result.auction.imageUrls),
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
      .execute();

    // 3) Get auction details for notification
    const auction = await this.getAuction(bid.auctionId);
    if (auction) {
      // 4) Create notification for previous highest bidder (if any)
      const previousHighestBids = await db
        .select()
        .from(bids)
        .where(and(
          eq(bids.auctionId, bid.auctionId),
          sql`id != ${created.id}`
        ))
        .orderBy(desc(bids.amount))
        .limit(1);

      if (previousHighestBids.length > 0) {
        const previousBidder = previousHighestBids[0];
        // Only notify previous bidder if they're not admin
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
              action: "view_auction",
            }),
          });
        }
      }
    }

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
      .select()
      .from(watchlist)
      .leftJoin(auctions, eq(watchlist.auctionId, auctions.id))
      .leftJoin(categories, eq(auctions.categoryId, categories.id))
      .where(eq(watchlist.userId, userId));

    const auctionIds = results.map(r => r.auctions?.id).filter(Boolean) as number[];

    if (auctionIds.length === 0) {
      return [];
    }

    // Get bids for these auctions
    const bidsResults = await db
      .select()
      .from(bids)
      .leftJoin(users, eq(bids.bidderId, users.id))
      .where(inArray(bids.auctionId, auctionIds))
      .orderBy(bids.createdAt);

    const bidsMap = new Map<number, (Bid & { bidder: User })[]>();
    bidsResults.forEach(result => {
      if (result.bids && result.users) {
        const auctionId = result.bids.auctionId;
        if (!bidsMap.has(auctionId)) {
          bidsMap.set(auctionId, []);
        }
        bidsMap.get(auctionId)!.push({
          ...result.bids,
          bidder: result.users
        });
      }
    });

    return results
      .filter(result => result.auctions && result.categories)
      .map(result => ({
        ...result.auctions!,
        imageUrls: deserializeImages(result.auctions!.imageUrls),
        category: result.categories!,
        bids: bidsMap.get(result.auctions!.id) || []
      }));
  }

  async updateUserProfile(userId: number, profileData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone?: string;
  }): Promise<User | null> {
    try {
      const result = await db
        .update(users)
        .set({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          username: profileData.username,
          email: profileData.email,
          phone: profileData.phone,
        })
        .where(eq(users.id, userId))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  async getPaymentsForUser(userId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.winnerId, userId));
  }

  async getUserPayments(userId: number): Promise<(Payment & { auction?: Auction })[]> {
    const results = await db
      .select({
        payment: payments,
        auction: auctions,
      })
      .from(payments)
      .leftJoin(auctions, eq(payments.auctionId, auctions.id))
      .where(eq(payments.winnerId, userId))
      .orderBy(desc(payments.createdAt));

    return results.map((result) => ({
      ...result.payment,
      auction: result.auction || undefined,
    }));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      // Check if there's a rejected payment to update instead of creating new
      const existingPayment = await this.getPaymentByAuctionId(payment.auctionId);

      if (existingPayment && existingPayment.status === "rejected") {
        // Update the existing rejected payment
        const [updatedPayment] = await db
          .update(payments)
          .set({
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paymentProof: payment.paymentProof,
            bankName: payment.bankName,
            accountNumber: payment.accountNumber,
            accountName: payment.accountName,
            status: "pending",
            notes: null,
            createdAt: new Date(),
            verifiedAt: null,
            verifiedBy: null,
          })
          .where(eq(payments.id, existingPayment.id))
          .returning();

        // Get auction details for notification
        const auction = await this.getAuction(payment.auctionId);
        if (auction) {
          // Only notify admins about pending payment resubmission
          if (updatedPayment.status === "pending") {
            await this.createAdminNotification(
              "payment",
              "Pembayaran Ulang Diterima",
              `Pembayaran ulang untuk lelang "${auction.title}" telah diterima dan menunggu verifikasi.`,
              {
                auctionId: payment.auctionId,
                auctionTitle: auction.title,
                amount: payment.amount,
                paymentId: updatedPayment.id,
              }
            );
          }

          // Only notify user about payment resubmission if they're not admin
          const winner = await this.getUser(payment.winnerId);
          if (winner && winner.role !== "admin") {
            await this.createNotification({
              userId: payment.winnerId,
              type: "payment",
              title: "Pembayaran Ulang Berhasil Dikirim",
              message: `Pembayaran ulang Anda untuk lelang "${auction.title}" telah diterima dan sedang diverifikasi oleh admin.`,
              data: JSON.stringify({
                auctionId: payment.auctionId,
                auctionTitle: auction.title,
                amount: payment.amount,
                paymentId: updatedPayment.id,
              }),
            });
          }
        }

        console.log("Payment resubmitted successfully:", updatedPayment);
        return updatedPayment;
      }

      // Create new payment if no rejected payment exists
      const [newPayment] = await db
        .insert(payments)
        .values({
          ...payment,
          createdAt: new Date(),
        })
        .returning();

      // Get auction details for notification
      const auction = await this.getAuction(payment.auctionId);
      if (auction) {
        // Notify admins about new payment submission
        await this.createAdminNotification(
          "payment",
          "Pembayaran Baru Diterima",
          `Pembayaran baru untuk lelang "${auction.title}" telah diterima dan menunggu verifikasi.`,
          {
            auctionId: payment.auctionId,
            auctionTitle: auction.title,
            amount: payment.amount,
            paymentId: newPayment.id,
          }
        );

        // Only notify user about payment submission if they're not admin
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
              paymentId: newPayment.id,
            }),
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

  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  } async getPaymentByAuctionId(auctionId: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.auctionId, auctionId));
    return payment || undefined;
  }

  async getAllPendingPayments(): Promise<(Payment & { auction?: Auction; winner?: User })[]> {
    const results = await db
      .select({
        payment: payments,
        auction: auctions,
        winner: users,
      })
      .from(payments)
      .leftJoin(auctions, eq(payments.auctionId, auctions.id))
      .leftJoin(users, eq(auctions.winnerId, users.id))
      .where(eq(payments.status, "pending"));

    return results.map((result) => ({
      ...result.payment,
      auction: result.auction
        ? {
          ...result.auction
          // Do not modify imageUrls here; keep as is for type compatibility
        }
        : undefined,
      winner: result.winner || undefined,
    }));
  }

  async verifyPayment(paymentId: number, verifiedBy: number, status: string, notes?: string, documents?: any): Promise<Payment> {
    try {
      console.log(`[verifyPayment] Admin verifying payment ${paymentId} with status ${status}`);

      const updateData: any = {
        status,
        verifiedAt: new Date(),
        verifiedBy,
        notes: notes || null,
      };

      // Add documents if provided (surat kuasa, surat pelepasan, dll)
      if (documents) {
        if (documents.invoiceDocument) updateData.invoiceDocument = documents.invoiceDocument;
        if (documents.releaseLetterDocument) updateData.releaseLetterDocument = documents.releaseLetterDocument;
        if (documents.handoverDocument) updateData.handoverDocument = documents.handoverDocument;
      }

      const [updatedPayment] = await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, paymentId))
        .returning();

      // Get auction and user details for notification
      const auction = await this.getAuction(updatedPayment.auctionId);

      if (auction && updatedPayment.winnerId) {
        // Kirim notifikasi ke user (pemenang)
        const winner = await this.getUser(updatedPayment.winnerId);
        if (winner && winner.role !== "admin") {
          const verifiedTitle = status === "verified" ? "✅ Pembayaran Disetujui" : "❌ Pembayaran Ditolak";
          const verifiedMessage = status === "verified"
            ? `Selamat! Pembayaran untuk lelang "${auction.title}" telah disetujui. ${documents?.releaseLetterDocument ? 'Surat pelepasan kendaraan telah tersedia.' : ''}`
            : `Pembayaran untuk lelang "${auction.title}" ditolak. Alasan: ${notes || 'Tidak ada keterangan'}`;

          await this.createNotification({
            userId: updatedPayment.winnerId,
            type: "payment",
            title: verifiedTitle,
            message: verifiedMessage,
            data: JSON.stringify({
              paymentId: paymentId,
              auctionId: updatedPayment.auctionId,
              auctionTitle: auction.title,
              status: status,
              notes: notes,
              hasReleaseDocument: !!documents?.releaseLetterDocument,
              hasHandoverDocument: !!documents?.handoverDocument,
              action: "view_payment"
            }),
          });
        }
      }

      console.log(`[verifyPayment] Payment verification successful. Status: ${status}, Documents uploaded: ${Object.keys(documents || {}).join(', ')}`);
      return updatedPayment;
    } catch (error) {
      console.error(`[verifyPayment] Payment verification error:`, error);
      throw error;
    }
  }

  async getPaymentHistory(search?: string, statusFilter?: string): Promise<(Payment & { auction?: Auction; winner?: User })[]> {
    try {
      let query = db
        .select({
          payment: payments,
          auction: auctions,
          winner: users,
        })
        .from(payments)
        .leftJoin(auctions, eq(payments.auctionId, auctions.id))
        .leftJoin(users, eq(auctions.winnerId, users.id));

      const whereClauses = [];

      // Only show processed payments (verified or rejected)
      whereClauses.push(or(eq(payments.status, "verified"), eq(payments.status, "rejected")));

      if (statusFilter && statusFilter !== "all") {
        whereClauses.push(eq(payments.status, statusFilter));
      }

      if (search) {
        whereClauses.push(
          or(
            sql`auctions.title LIKE '%' || ${search} || '%'`,
            sql`users.username LIKE '%' || ${search} || '%'`,
            sql`users.email LIKE '%' || ${search} || '%'`
          )
        );
      }

      const results = await (
        whereClauses.length > 0
          ? query.where(and(...whereClauses)).orderBy(desc(payments.verifiedAt))
          : query.orderBy(desc(payments.verifiedAt))
      );

      return results.map((result) => ({
        ...result.payment,
        auction: result.auction
          ? {
            ...result.auction,
            imageUrls: result.auction.imageUrls // keep as string | null for type compatibility
          }
          : undefined,
        winner: result.winner || undefined,
      }));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }
  }

  async checkAndEndExpiredAuctions(): Promise<number> {
    try {
      const now = new Date();

      // Find all active auctions that have expired
      const expiredAuctions = await db
        .select()
        .from(auctions)
        .where(eq(auctions.status, "active"));

      console.log(`[checkAndEndExpiredAuctions] Checking ${expiredAuctions.length} active auctions against current time: ${now.toISOString()}`);

      let endedCount = 0;
      const actuallyExpired = [];

      for (const auction of expiredAuctions) {
        // Properly compare dates - endTime should be a Date object
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
          // Get highest bid for this auction
          const highestBid = await this.getHighestBid(auction.id);
          const winnerId = highestBid?.bidderId || null;

          // Update auction to ended status
          await db
            .update(auctions)
            .set({
              status: "ended",
              winnerId: winnerId
            })
            .where(eq(auctions.id, auction.id));

          // Auto-generate invoice if there's a winner
          if (winnerId) {
            const invoice = await this.generateInvoiceForWinner(auction.id, winnerId);
            console.log(`[checkAndEndExpiredAuctions] Auto-generated invoice for auction ${auction.id}, winner ${winnerId}: ${invoice ? 'success' : 'failed'}`);
          }

          console.log(`[checkAndEndExpiredAuctions] Ended auction ${auction.id} (${auction.title}), winner: ${winnerId || 'none'}`);
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

  async generateInvoiceForWinner(auctionId: number, winnerId: number): Promise<string | null> {
    try {
      console.log(`[generateInvoiceForWinner] Generating invoice document for auction ${auctionId}, winner ${winnerId}`);

      // Get auction details
      const auction = await this.getAuction(auctionId);
      if (!auction) {
        console.error(`[generateInvoiceForWinner] Auction ${auctionId} not found`);
        return null;
      }

      // Get highest bid amount
      const highestBid = await this.getHighestBid(auctionId);
      if (!highestBid) {
        console.error(`[generateInvoiceForWinner] No highest bid found for auction ${auctionId}`);
        return null;
      }

      // Generate unique invoice number
      const now = new Date();
      const timestamp = now.getTime();
      const invoiceNumber = `INV-${String(auctionId).padStart(4, '0')}-${String(winnerId).padStart(4, '0')}-${timestamp}`;

      // Calculate total amount (winning bid amount)
      const bidAmount = parseFloat(String(highestBid.amount));

      // Generate invoice document (PDF tagihan untuk winner)
      const invoiceDocument = await this.generateInvoiceDocument(auction, winnerId, bidAmount, invoiceNumber);

      // Store invoice document in auction record untuk ditampilkan di detail page
      await db
        .update(auctions)
        .set({
          invoiceDocument: invoiceDocument,
          invoiceNumber: invoiceNumber
        })
        .where(eq(auctions.id, auctionId));

      console.log(`[generateInvoiceForWinner] Successfully generated INVOICE DOCUMENT ${invoiceNumber} for auction ${auctionId}, amount: Rp ${bidAmount.toLocaleString('id-ID')}`);

      // Send notification to winner dengan invoice tagihan
      await this.createNotification({
        userId: winnerId,
        type: "payment",
        title: "🏆 Selamat! Anda Pemenang Lelang",
        message: `Selamat! Anda memenangkan lelang "${auction.title}" dengan harga Rp ${bidAmount.toLocaleString('id-ID')}. Invoice tagihan ${invoiceNumber} telah tersedia. Silakan lakukan pembayaran melalui form pembayaran.`,
        data: JSON.stringify({
          auctionId: auctionId,
          invoiceNumber: invoiceNumber,
          amount: bidAmount,
          auctionTitle: auction.title,
          invoiceDocument: invoiceDocument
        })
      });

      return invoiceDocument;
    } catch (error) {
      console.error(`[generateInvoiceForWinner] Error generating invoice for auction ${auctionId}:`, error);
      return null;
    }
  }

  private async generateInvoiceDocument(auction: AuctionWithDetails, winnerId: number, amount: number, invoiceNumber: string): Promise<string | null> {
    try {
      // Get winner details
      const winner = await this.getUser(winnerId);
      if (!winner) return null;

      const now = new Date();
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Generate comprehensive invoice HTML document optimized for PDF with standardized template
      const invoiceHTML = this.createInvoiceTemplate(auction, winner, amount, invoiceNumber, now, dueDate);

      // Generate PDF using puppeteer
      console.log(`[generateInvoiceDocument] Generating PDF for invoice ${invoiceNumber}...`);

      try {
        const puppeteer = (await import('puppeteer')).default;
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows'
          ]
        });

        const page = await browser.newPage();

        // Set viewport for consistent rendering
        await page.setViewport({ width: 794, height: 1123 }); // A4 size in pixels at 96 DPI

        await page.setContent(invoiceHTML, {
          waitUntil: ['domcontentloaded', 'networkidle0'],
          timeout: 30000
        });

        // Generate PDF with options
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          },
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate: `
            <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
              <span style="float: right;">Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
            </div>
          `
        });

        await browser.close();

        // Convert PDF buffer to base64
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

        console.log(`[generateInvoiceDocument] PDF generated successfully for invoice ${invoiceNumber}, size: ${pdfBuffer.length} bytes`);

        return `data:application/pdf;base64,${pdfBase64}`;

      } catch (puppeteerError) {
        if (puppeteerError && typeof puppeteerError === "object" && "message" in puppeteerError) {
          console.warn(`[generateInvoiceDocument] Puppeteer failed for invoice ${invoiceNumber}:`, (puppeteerError as any).message);
        } else {
          console.warn(`[generateInvoiceDocument] Puppeteer failed for invoice ${invoiceNumber}:`, puppeteerError);
        }
        console.log(`[generateInvoiceDocument] Falling back to HTML format for invoice ${invoiceNumber}...`);

        // Fallback to HTML if PDF generation fails
        const documentData = Buffer.from(invoiceHTML).toString('base64');
        return `data:text/html;base64,${documentData}`;
      }

    } catch (error) {
      console.error('Error generating PDF invoice document:', error);
      return null;
    }
  } async getRealAdminStats() {
    try {
      // Total users
      const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
      const totalUsers = totalUsersResult[0]?.count || 0;

      // Active users (users who have placed bids or won auctions in last 30 days)
      const activeUsersResult = await db
        .select({ count: sql<number>`count(DISTINCT user_id)` })
        .from(sql`(
          SELECT bidder_id as user_id FROM bids WHERE created_at > datetime('now', '-30 days')
          UNION
          SELECT winner_id as user_id FROM auctions WHERE winner_id IS NOT NULL AND end_time > datetime('now', '-30 days')
        ) as active_users`);
      const activeUsers = activeUsersResult[0]?.count || 0;

      // Active auctions
      const activeAuctionsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(auctions)
        .where(and(eq(auctions.status, "active"), eq(auctions.archived, false)));
      const activeAuctions = activeAuctionsResult[0]?.count || 0;

      // Completed auctions
      const completedAuctionsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(auctions)
        .where(eq(auctions.status, "ended"));
      const completedAuctions = completedAuctionsResult[0]?.count || 0;

      // Total revenue from verified payments
      const revenueResult = await db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(eq(payments.status, "verified"));
      const totalRevenue = revenueResult[0]?.total || 0;

      return {
        totalUsers,
        activeUsers,
        activeAuctions,
        completedAuctions,
        totalRevenue,
      };
    } catch (error) {
      console.error("Error fetching real admin stats:", error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        activeAuctions: 0,
        completedAuctions: 0,
        totalRevenue: 0,
      };
    }
  }

  async exportAuctionData(): Promise<any[]> {
    try {
      const results = await db
        .select({
          auction: auctions,
          category: categories,
        })
        .from(auctions)
        .innerJoin(categories, eq(auctions.categoryId, categories.id))
        .where(and(
          ne(auctions.status, "archived"),
          eq(auctions.archived, false)
        )) // Only non-archived auctions (same as "Kelola Lelang" tab)
        .orderBy(desc(auctions.createdAt));

      return results.map(result => ({
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
        winnerName: null, // Will be populated with seller/winner info if needed
        sellerName: null, // Will be populated with seller info if needed
        bidCount: 0, // Default to 0, can be populated from bids table if needed
        archived: result.auction.archived,
        productionYear: result.auction.productionYear,
        plateNumber: result.auction.plateNumber,
        chassisNumber: result.auction.chassisNumber,
        engineNumber: result.auction.engineNumber,
        documentInfo: result.auction.documentInfo,
        createdAt: result.auction.createdAt,
      }));
    } catch (error) {
      console.error("Error exporting auction data:", error);
      throw error;
    }
  }

  async exportFilteredAuctionData(filters: { status?: string; search?: string }): Promise<any[]> {
    try {
      console.log("[STORAGE DEBUG] exportFilteredAuctionData called with filters:", filters);

      // Build where conditions
      const conditions = [];

      // ALWAYS exclude archived auctions (check both status and archived field)
      conditions.push(ne(auctions.status, "archived"));
      conditions.push(eq(auctions.archived, false));

      // Apply additional filters
      if (filters.status && filters.status !== "all") {
        conditions.push(eq(auctions.status, filters.status));
      }

      if (filters.search && filters.search.trim()) {
        conditions.push(like(auctions.title, `%${filters.search.trim()}%`));
      }

      // Combine all conditions with AND
      const whereCondition = and(...conditions);

      console.log("[STORAGE DEBUG] Number of conditions:", conditions.length);

      const results = await db
        .select({
          auction: auctions,
          category: categories,
        })
        .from(auctions)
        .innerJoin(categories, eq(auctions.categoryId, categories.id))
        .where(whereCondition)
        .orderBy(desc(auctions.createdAt));

      console.log("[STORAGE DEBUG] Raw query results count:", results.length);
      console.log("[STORAGE DEBUG] Raw results statuses:", results.map(r => ({ id: r.auction.id, status: r.auction.status, archived: r.auction.archived })));

      return results.map(result => ({
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
        winnerName: null, // Will be populated with seller/winner info if needed
        sellerName: null, // Will be populated with seller info if needed
        bidCount: 0, // Default to 0, can be populated from bids table if needed
        archived: result.auction.archived,
        productionYear: result.auction.productionYear,
        plateNumber: result.auction.plateNumber,
        chassisNumber: result.auction.chassisNumber,
        engineNumber: result.auction.engineNumber,
        documentInfo: result.auction.documentInfo,
        createdAt: result.auction.createdAt,
      }));
    } catch (error) {
      console.error("Error exporting filtered auction data:", error);
      throw error;
    }
  }

  // Notification functions
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const [newNotification] = await db
        .insert(notifications)
        .values({
          ...notification,
          createdAt: new Date().toISOString(),
        })
        .returning();
      return newNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      throw error;
    }
  }

  async getAdminNotifications(): Promise<Notification[]> {
    try {
      // Get system-wide notifications for admin
      return await db
        .select()
        .from(notifications)
        .where(or(
          eq(notifications.type, "system"),
          eq(notifications.type, "payment"),
          eq(notifications.type, "auction")
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      throw error;
    }
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    try {
      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, id));
      return notification || undefined;
    } catch (error) {
      console.error("Error fetching notification:", error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await db
        .delete(notifications)
        .where(eq(notifications.id, notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Admin Notification function
  async createAdminNotification(type: string, title: string, message: string, data: any): Promise<void> {
    try {
      // Fetch all admin users (you might need to adjust this based on your admin user identification logic)
      const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));

      // Create a notification for each admin user
      for (const admin of adminUsers) {
        await this.createNotification({
          userId: admin.id,
          type: type,
          title: title,
          message: message,
          data: JSON.stringify(data),
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
  private createInvoiceTemplate(
    auction: AuctionWithDetails,
    winner: User,
    amount: number,
    invoiceNumber: string,
    invoiceDate: Date,
    dueDate: Date
  ): string {
    // Standard company information
    const companyInfo = {
      name: "3D Auction",
      legalName: "PT Auctioneer Tridaya",
      bankName: "Bank Central Asia (BCA)",
      accountNumber: "1234567890",
      customerService: "support@e-auction.id",
      phone: "+62-21-1234-5678",
      address: "Jl. Sudirman No. 123, Jakarta 10220, Indonesia"
    };

    // Standard payment instructions
    const paymentInstructions = [
      "Transfer sesuai PERSIS dengan jumlah yang tertera (tidak lebih, tidak kurang)",
      "Gunakan berita transfer: " + invoiceNumber,
      "Simpan bukti transfer dengan jelas dan lengkap",
      "Upload bukti transfer melalui menu 'Upload Pembayaran' di sistem",
      "Verifikasi pembayaran akan dilakukan maksimal 1x24 jam (hari kerja)",
      "Setelah pembayaran terverifikasi, surat kuasa kendaraan akan diberikan",
      "Hubungi customer service jika ada kendala dalam pembayaran"
    ];

    // Additional terms and conditions
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
            <div class="invoice-meta">Tanggal: ${invoiceDate.toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}</div>
            <div class="status-badge">⏳ MENUNGGU PEMBAYARAN</div>
        </div>

        <!-- Winner Information -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">👤</span>
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
                    </div>` : ''}
                </div>
                <div>
                    <div class="info-item">
                        <span class="label">Tanggal Invoice:</span>
                        <span class="value">${invoiceDate.toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric'
    })}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Jatuh Tempo:</span>
                        <span class="value"><strong>${dueDate.toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric'
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
                <span class="section-icon">🚗</span>
                Detail Barang Lelang
            </div>
            <div class="auction-details">
                <div class="info-item">
                    <span class="label">ID Lelang:</span>
                    <span class="value"><strong>#${auction.id.toString().padStart(6, '0')}</strong></span>
                </div>
                <div class="info-item">
                    <span class="label">Nama Barang:</span>
                    <span class="value"><strong>${auction.title}</strong></span>
                </div>
                <div class="info-item">
                    <span class="label">Deskripsi:</span>
                    <span class="value">${auction.description || 'Tidak ada deskripsi'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Kondisi:</span>
                    <span class="value">${auction.condition || 'Tidak disebutkan'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Lokasi Barang:</span>
                    <span class="value">${auction.location || 'Tidak disebutkan'}</span>
                </div>
                ${auction.productionYear ? `
                <div class="info-item">
                    <span class="label">Tahun Produksi:</span>
                    <span class="value">${auction.productionYear}</span>
                </div>` : ''}
                ${auction.plateNumber ? `
                <div class="info-item">
                    <span class="label">No. Plat Kendaraan:</span>
                    <span class="value"><strong>${auction.plateNumber}</strong></span>
                </div>` : ''}
                ${auction.chassisNumber ? `
                <div class="info-item">
                    <span class="label">No. Rangka (Chassis):</span>
                    <span class="value">${auction.chassisNumber}</span>
                </div>` : ''}
                ${auction.engineNumber ? `
                <div class="info-item">
                    <span class="label">No. Mesin:</span>
                    <span class="value">${auction.engineNumber}</span>
                </div>` : ''}
                <div class="info-item">
                    <span class="label">Tanggal Lelang:</span>
                    <span class="value">${new Date(auction.startTime).toLocaleDateString('id-ID')} - ${new Date(auction.endTime).toLocaleDateString('id-ID')}</span>
                </div>
            </div>
        </div>

        <!-- Payment Amount -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">💰</span>
                Rincian Pembayaran
            </div>
            <div class="amount-section">
                <div class="amount-label">Total Yang Harus Dibayar</div>
                <div class="total-amount">Rp ${amount.toLocaleString('id-ID')}</div>
                <div class="amount-note">Sesuai dengan bid tertinggi yang Anda menangkan</div>
            </div>
        </div>

        <!-- Payment Information -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">🏦</span>
                Informasi Pembayaran
            </div>
            <div class="payment-section">
                <p style="margin-bottom: 15px; font-weight: bold; color: #047857; font-size: 14px;">
                    💳 TRANSFER KE REKENING BERIKUT:
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
                        <span class="transfer-amount">Rp ${amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Berita Transfer:</span>
                        <span class="value"><strong>${invoiceNumber}</strong></span>
                    </div>
                </div>

                <div class="instructions">
                    <div class="instructions-title">📋 PETUNJUK PEMBAYARAN:</div>
                    <ol>
                        ${paymentInstructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>
            </div>
        </div>

        <!-- Terms and Conditions -->
        <div class="section">
            <div class="section-title">
                <span class="section-icon">📜</span>
                Syarat dan Ketentuan
            </div>
            <div class="terms-section">
                <div class="terms-title">Ketentuan Pembayaran dan Pengambilan Barang:</div>
                <ol class="terms-list">
                    ${termsAndConditions.map(term => `<li>${term}</li>`).join('')}
                </ol>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-company">${companyInfo.name}</div>
            <div class="footer-contact">${companyInfo.address}</div>
            <div class="footer-contact">Telepon: ${companyInfo.phone} | Email: ${companyInfo.customerService}</div>
            <div style="margin-top: 15px; font-weight: bold; color: #1e40af;">
                ✨ Terima kasih telah menggunakan layanan 3D Auction! ✨
            </div>
            <div style="margin-top: 10px; font-size: 10px; color: #9ca3af;">
                Invoice ini digenerate otomatis oleh sistem pada ${invoiceDate.toLocaleString('id-ID')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}

export const storage = new DatabaseStorage();