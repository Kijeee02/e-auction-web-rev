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
  type UserStats,
  type InsertAuction,
  type InsertBid,
  type InsertCategory,
  type InsertPayment,
  type InsertNotification,
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

    // Create notifications
    if (auction) {
      if (winnerId) {
        // Notify winner
        await this.createNotification({
          userId: winnerId,
          type: "auction",
          title: "Selamat! Anda Menang",
          message: `Anda memenangkan lelang ${auction.title}. Silakan lakukan pembayaran.`,
          data: JSON.stringify({
            auctionId: id,
            auctionTitle: auction.title,
            winningBid: highestBid?.amount,
            action: "view_auction",
          }),
        });

        // Notify other bidders that they lost
        const allBids = await this.getBidsForAuction(id);
        const otherBidders = allBids
          .filter(bid => bid.bidderId !== winnerId)
          .map(bid => bid.bidderId);

        const uniqueBidders = [...new Set(otherBidders)];

        for (const bidderId of uniqueBidders) {
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
        auction: result.auction,
      }));
    }

    async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
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

        // Notify user about payment submission
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
    }

    async getPaymentByAuctionId(auctionId: number): Promise<Payment | undefined> {
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
        auction: result.auction,
        winner: result.winner,
      }));
    }

    async verifyPayment(paymentId: number, verifiedBy: number, status: string, notes?: string, documents?: any): Promise<Payment> {
    try {
      console.log(`[Storage] Verifying payment ${paymentId} with status ${status}`);

      const updateData: any = {
        status,
        verifiedAt: new Date(),
        verifiedBy,
        notes: notes || null,
      };

      // Add documents if provided and status is verified
      if (status === "verified" && documents) {
        updateData.invoiceDocument = documents.invoiceDocument || null;
        updateData.releaseLetterDocument = documents.releaseLetterDocument || null;
        updateData.handoverDocument = documents.handoverDocument || null;
      }

      const [updatedPayment] = await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, paymentId))
        .returning();

      // Get auction and user details for notification
      const auction = await this.getAuction(updatedPayment.auctionId);

      if (auction && updatedPayment.winnerId) {
        if (status === "verified") {
          // Notify user about payment approval
          await this.createNotification({
            userId: updatedPayment.winnerId,
            type: "payment",
            title: "✅ Pembayaran Disetujui",
            message: `Pembayaran Anda untuk lelang "${auction.title}" telah disetujui. Silakan cek detail lelang untuk informasi lebih lanjut.`,
            data: JSON.stringify({
              auctionId: updatedPayment.auctionId,
              auctionTitle: auction.title,
              amount: updatedPayment.amount,
              paymentId: updatedPayment.id,
              action: "view_auction",
            }),
          });

          // Notify admins about payment completion
          await this.createAdminNotification(
            "payment",
            "Pembayaran Telah Diverifikasi",
            `Pembayaran untuk lelang "${auction.title}" telah berhasil diverifikasi dan disetujui.`,
            {
              auctionId: updatedPayment.auctionId,
              auctionTitle: auction.title,
              amount: updatedPayment.amount,
              paymentId: updatedPayment.id,
            }
          );
        } else if (status === "rejected") {
          // Notify user about payment rejection
          await this.createNotification({
            userId: updatedPayment.winnerId,
            type: "payment",
            title: "❌ Pembayaran Ditolak",
            message: `Pembayaran Anda untuk lelang "${auction.title}" ditolak. ${notes ? `Alasan: ${notes}` : ''} Klik untuk melihat detail dan mengajukan pembayaran ulang.`,
            data: JSON.stringify({
              auctionId: updatedPayment.auctionId,
              auctionTitle: auction.title,
              amount: updatedPayment.amount,
              paymentId: updatedPayment.id,
              action: "view_auction",
              reason: notes,
            }),
          });
        }
      }

      console.log(`[Storage] Payment verification successful:`, updatedPayment);
      return updatedPayment;
    } catch (error) {
      console.error(`[Storage] Payment verification error:`, error);
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
          auction: result.auction,
          winner: result.winner,
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

  async getRealAdminStats() {
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
        .orderBy(desc(auctions.createdAt));

      return results.map(result => ({
        id: result.auction.id,
        title: result.auction.title,
        description: result.auction.description,
        category: result.category.name,
        startingPrice: result.auction.startingPrice,
        currentPrice: result.auction.currentPrice,
        condition: result.auction.condition,
        location: result.auction.location,
        status: result.auction.status,
        startTime: result.auction.startTime,
        endTime: result.auction.endTime,
        winnerId: result.auction.winnerId,
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
}

export const storage = new DatabaseStorage();