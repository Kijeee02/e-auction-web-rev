import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAuctionSchema, insertBidSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import express, { Request, Response } from "express";
import { db } from "./db";
import { auctions } from "@shared/schema";


const router = express.Router();
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

  app.put("/api/categories/:id", async (req, res) => {
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

  app.delete("/api/categories/:id", async (req, res) => {
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

  // Auctions routes
  app.get("/api/auctions", async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        search: req.query.search as string,
      };

      const auctions = await storage.getAuctions(filters);
      res.json(auctions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  });

  app.get("/api/auctions/archived", async (req, res) => {
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
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const auctionData = insertAuctionSchema.parse(req.body);
      const auction = await storage.createAuction(auctionData);
      res.status(201).json(auction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid auction data", errors: error.errors });
      }
      res.status(500).json({
        message: "Failed to create auction",
        error: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error)
      });
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
      if (!auction || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
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

      res.status(200).json({
        message: "Auction ended successfully",
        auction,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to end auction" });
    }
  });

  app.post("/api/auctions/:id/archive", async (req, res) => {
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
        auction,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to archive auction" });
    }
  });

  app.post("/api/auctions/:id/unarchive", async (req, res) => {
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
        auction,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to unarchive auction" });
    }
  });

  // Bids routes

  app.get("/api/auctions/:id/bids", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const bids = await storage.getBidsForAuction(auctionId);
      res.json(bids);
    } catch (error) {
      console.error("Failed to fetch bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.post("/api/auctions/:id/bids", async (req, res) => {
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

      if (new Date() >= new Date(auction.endTime)) {
        return res.status(400).json({ message: "Auction has ended" });
      }

      // DEBUG: Log body yang diterima
      console.log("POST /bids req.body:", req.body);

      let bidData;
      try {
        // PATCH: Pastikan amount number, createdAt boleh undefined (storage akan isi otomatis)
        bidData = insertBidSchema.parse({
          ...req.body,
          auctionId,
          amount: Number(req.body.amount),
        });
      } catch (err) {
        console.error("Zod error in bidData:", err);
        return res.status(400).json({
          message: "Invalid bid data",
          errors: err instanceof z.ZodError ? err.errors : (typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : String(err))
        });
      }

      // Validate bid amount
      const minimumBid = Number(auction.currentPrice) + Number(auction.minimumIncrement);
      if (Number(bidData.amount) < minimumBid) {
        return res.status(400).json({
          message: `Bid must be at least Rp ${minimumBid.toLocaleString("id-ID")}`,
        });
      }

      // Simpan bid ke DB
      let bid;
      try {
        bid = await storage.placeBid({
          ...bidData,
          bidderId: req.user.id,
        });
        // Log hasil simpan bid
        console.log("Bid created:", bid);
      } catch (err) {
        // PATCH: Log full error dari storage
        console.error("Error from storage.placeBid:", err);
        return res.status(500).json({ message: "Failed to save bid", error: typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : String(err) });
      }

      // Pastikan tidak undefined/null
      if (!bid) {
        console.error("Bid result undefined/null!");
        return res.status(500).json({ message: "Bid was not created." });
      }

      res.status(201).json(bid);

    } catch (error) {
      console.error("Failed to place bid:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid data", errors: error.errors });
      }
      res.status(500).json({
        message: "Failed to place bid",
        error: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error)
      });
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

  app.get("/api/user/won-auctions", async (req, res) => {
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

  // Check and end expired auctions
  app.post("/api/admin/check-expired", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.checkAndEndExpiredAuctions();
      res.json({ message: "Expired auctions checked and processed" });
    } catch (error) {
      console.error("Error checking expired auctions:", error);
      res.status(500).json({ message: "Failed to check expired auctions" });
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
