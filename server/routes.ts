import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAuctionSchema, insertBidSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import express, { Request, Response } from "express";
import db from "./db";

const router = express.Router();
router.post("/api/auctions", async (req: Request, res: Response) => {
  const { title, starting_price, end_time } = req.body;

  if (!title || !starting_price || !end_time) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  try {
    const stmt = db.prepare(
      `INSERT INTO auctions (title, starting_price, current_price, end_time, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const result = stmt.run(
      title,
      starting_price,
      starting_price,
      end_time,
      "active",
      Date.now()
    );

    res.status(201).json({ message: "Lelang berhasil ditambahkan", id: result.lastInsertRowid });
  } catch (err) {
    console.error("Gagal menyimpan lelang:", err);
    res.status(500).json({ message: "Gagal menyimpan lelang" });
  }
});
export default router;

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Auctions routes
  app.get("/api/auctions", async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        sellerId: req.query.sellerId ? parseInt(req.query.sellerId as string) : undefined,
        search: req.query.search as string,
      };

      const auctions = await storage.getAuctions(filters);
      res.json(auctions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  });

  app.get("/api/auctions/:id", async (req, res) => {
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

  app.post("/api/auctions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const auctionData = insertAuctionSchema.parse(req.body);
      const auction = await storage.createAuction(auctionData, req.user.id);
      res.status(201).json(auction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid auction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create auction" });
    }
  });

  app.put("/api/auctions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const auction = await storage.getAuction(id);

      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      // Check if user owns the auction or is admin
      if (auction.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = req.body;
      const updatedAuction = await storage.updateAuction(id, updates);
      res.json(updatedAuction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update auction" });
    }
  });

  app.delete("/api/auctions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const auction = await storage.getAuction(id);

      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      // Check if user owns the auction or is admin
      if (auction.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteAuction(id);
      if (deleted) {
        res.json({ message: "Auction deleted successfully" });
      } else {
        res.status(404).json({ message: "Auction not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete auction" });
    }
  });

  app.post("/api/auctions/:id/end", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const auction = await storage.endAuction(id);

      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      res.json(auction);
    } catch (error) {
      res.status(500).json({ message: "Failed to end auction" });
    }
  });

  // Bids routes
  app.get("/api/auctions/:id/bids", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const bids = await storage.getBidsForAuction(auctionId);
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.post("/api/auctions/:id/bids", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
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

      if (new Date() >= new Date(auction.endTime)) {
        return res.status(400).json({ message: "Auction has ended" });
      }

      if (auction.sellerId === req.user.id) {
        return res.status(400).json({ message: "Cannot bid on your own auction" });
      }

      const bidData = insertBidSchema.parse({ ...req.body, auctionId });

      // Validate bid amount
      const minimumBid =
        Number(auction.currentPrice) + Number(auction.minimumIncrement);
      if (parseFloat(bidData.amount.toString()) < minimumBid) {
        return res.status(400).json({
          message: `Bid must be at least Rp ${minimumBid.toLocaleString("id-ID")}`
        });
      }


      const bid = await storage.placeBid({ ...bidData, bidderId: req.user.id });
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to place bid" });
    }
  });

  // User routes
  app.get("/api/user/stats", async (req, res) => {
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

  app.get("/api/user/bids", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const bids = await storage.getUserBids(req.user.id);
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user bids" });
    }
  });

  app.get("/api/user/watchlist", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const watchlist = await storage.getUserWatchlist(req.user.id);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/user/watchlist/:auctionId", async (req, res) => {
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

  app.delete("/api/user/watchlist/:auctionId", async (req, res) => {
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

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Mock admin stats - in real implementation, you'd query the database
      const stats = {
        totalUsers: 1247,
        activeAuctions: 245,
        completedTransactions: 1892,
        monthlyRevenue: "850000000"
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
