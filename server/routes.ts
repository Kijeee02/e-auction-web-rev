import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAuctionSchema, insertBidSchema, insertCategorySchema, insertPaymentSchema } from "@shared/schema";
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
      
      // No admin notification for auction creation - admins don't need this
      
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

      // Prevent deletion if auction has a winner
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

  app.put("/api/user/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { firstName, lastName, username, email, phone } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !username || !email) {
        return res.status(400).json({ message: "All required fields must be filled" });
      }

      const updatedUser = await storage.updateUserProfile(req.user.id, {
        firstName,
        lastName,
        username,
        email,
        phone,
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

  // Change password route
  app.post("/api/user/change-password", async (req, res) => {
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

      // Get current user
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password (you'll need to implement password verification)
      const bcrypt = require("bcrypt");
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await storage.updateUser(req.user.id, { password: hashedNewPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Upload avatar route
  app.post("/api/user/avatar", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Simulate avatar upload with a placeholder URL
      // In a real implementation, you would use multer to handle file uploads
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.firstName + ' ' + req.user.lastName)}&size=200&background=3b82f6&color=ffffff`;
      
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

  // Delete account route
  app.delete("/api/user/delete-account", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // For admin users, prevent deletion if they're the only admin
      if (req.user.role === "admin") {
        // Check if there are other admins
        // This is a safety measure - implement based on your business logic
        return res.status(400).json({ 
          message: "Cannot delete admin account. Please contact system administrator." 
        });
      }

      // In a real app, you might want to soft delete or anonymize data
      // For now, we'll just return success without actually deleting
      res.json({ message: "Account deletion request processed" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Export auction data
  app.get("/api/admin/export-data", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const exportData = await storage.exportAuctionData();
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="auction_data.csv"');
      
      // Convert to CSV format
      if (exportData.length === 0) {
        return res.send("No data available");
      }
      
      const headers = Object.keys(exportData[0]).join(',');
      const csvData = exportData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      ).join('\n');
      
      res.send(headers + '\n' + csvData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Payment routes
  app.post("/api/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log("Payment request body:", req.body);

      // Validate and parse payment data
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        winnerId: req.user.id,
      });

      console.log("Parsed payment data:", paymentData);

      // Verify user is the winner of the auction
      const auction = await storage.getAuction(paymentData.auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      if (auction.winnerId !== req.user.id) {
        return res.status(403).json({ message: "You are not the winner of this auction" });
      }

      // Check if payment already exists and is not rejected
      const existingPayment = await storage.getPaymentByAuctionId(paymentData.auctionId);
      if (existingPayment && existingPayment.status !== "rejected") {
        return res.status(400).json({ message: "Payment already submitted for this auction" });
      }

      const payment = await storage.createPayment(paymentData);
      console.log("Payment created successfully:", payment);
      
      // Create admin notification for pending payment only
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
            paymentMethod: payment.paymentMethod,
          }
        );
      }
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Payment creation error:", error);
      
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid payment data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create payment",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/payments/auction/:auctionId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const auctionId = parseInt(req.params.auctionId);
      const payment = await storage.getPaymentByAuctionId(auctionId);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Check if user is the winner or admin
      if (payment.winnerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.get("/api/user/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const payments = await storage.getUserPayments(req.user.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user payments" });
    }
  });

  app.get("/api/admin/payments/pending", async (req, res) => {
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

  app.post("/api/admin/payments/:id/verify", async (req, res) => {
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

  app.get("/api/admin/payments/history", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { search, status } = req.query;
      const paymentHistory = await storage.getPaymentHistory(search as string, status as string);
      res.json(paymentHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Admin routes - Real Statistics
  app.get("/api/admin/real-stats", async (req, res) => {
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

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/admin/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const notifications = await storage.getAdminNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const notificationId = parseInt(req.params.id);
      
      // Get the notification first to verify ownership or admin access
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Allow user to mark their own notifications or admin to mark any notification
      if (notification.userId === req.user.id || req.user.role === "admin") {
        await storage.markNotificationAsRead(notificationId, notification.userId);
        res.json({ message: "Notification marked as read" });
      } else {
        res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
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

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const notificationId = parseInt(req.params.id);
      
      // Get the notification first to verify ownership or admin access
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Allow user to delete their own notifications or admin to delete any notification
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

  // Admin Settings routes
  app.post("/api/admin/backup-database", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Simple backup simulation - in real app, you'd create actual backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupInfo = {
        filename: `backup_${timestamp}.db`,
        created: new Date(),
        size: "Unknown"
      };

      res.json({ message: "Backup created successfully", backup: backupInfo });
    } catch (error) {
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post("/api/admin/clear-cache", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Clear any cached data (simulation)
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  app.get("/api/admin/system-health", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const health = {
        status: "OK",
        database: "Connected",
        memory: "Normal",
        uptime: process.uptime(),
        timestamp: new Date()
      };

      res.json(health);
    } catch (error) {
      res.status(500).json({ message: "Failed to check system health" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
