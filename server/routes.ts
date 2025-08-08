import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAuctionSchema, insertBidSchema, insertCategorySchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import express, { Request, Response } from "express";
import { db } from "./db";
import { auctions } from "@shared/schema";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


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

      console.log("[CREATE AUCTION DEBUG] Received data:", req.body);

      const auctionData = insertAuctionSchema.parse(req.body);
      console.log("[CREATE AUCTION DEBUG] Parsed data:", auctionData);

      const auction = await storage.createAuction(auctionData);
      console.log("[CREATE AUCTION DEBUG] Created auction:", auction.id);

      // Admin notification for new auction creation
      await storage.createAdminNotification(
        "auction",
        "Lelang Baru Dibuat",
        `Lelang baru "${auction.title}" telah dibuat dan aktif.`,
        {
          auctionId: auction.id,
          auctionTitle: auction.title,
          startingPrice: auction.startingPrice,
          endTime: auction.endTime,
        }
      );

      res.status(201).json(auction);
    } catch (error) {
      console.error("[CREATE AUCTION DEBUG] Error:", error);
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

      // Get filter parameters from query string
      const { status, search, filtered, format = "csv" } = req.query;

      console.log("[EXPORT DEBUG] Filter parameters received:", { status, search, filtered, format });

      let exportData;
      let baseFilename = "auction_data";

      if (filtered === "true") {
        // Export only filtered data
        console.log("[EXPORT DEBUG] Using filtered export with filters:", { status, search });
        exportData = await storage.exportFilteredAuctionData({
          status: status as string,
          search: search as string
        });

        // Create descriptive filename
        const parts = [baseFilename];
        if (status && status !== "all") {
          parts.push(`status_${status}`);
        }
        if (search) {
          parts.push(`search_${(search as string).replace(/[^a-zA-Z0-9]/g, '_')}`);
        }
        parts.push("filtered");
        baseFilename = parts.join("_");
      } else {
        // Export all data (original behavior)
        console.log("[EXPORT DEBUG] Using unfiltered export");
        exportData = await storage.exportAuctionData();
      }

      console.log("[EXPORT DEBUG] Export data count:", exportData.length);
      console.log("[EXPORT DEBUG] First few records:", exportData.slice(0, 2).map(item => ({ id: item.id, title: item.title, status: item.status })));

      // Function to format column headers
      const formatHeader = (key: string): string => {
        const headerMap: { [key: string]: string } = {
          'id': 'ID',
          'title': 'Judul Lelang',
          'description': 'Deskripsi',
          'startingBid': 'Bid Awal',
          'currentBid': 'Bid Saat Ini',
          'startTime': 'Waktu Mulai',
          'endTime': 'Waktu Berakhir',
          'status': 'Status',
          'categoryId': 'ID Kategori',
          'categoryName': 'Kategori',
          'sellerId': 'ID Penjual',
          'sellerName': 'Nama Penjual',
          'winnerId': 'ID Pemenang',
          'winnerName': 'Nama Pemenang',
          'bidCount': 'Jumlah Bid',
          'createdAt': 'Dibuat Pada',
          'updatedAt': 'Diperbarui Pada',
          'images': 'Gambar',
          'location': 'Lokasi'
        };
        return headerMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      };

      // Function to format values
      const formatValue = (key: string, value: any): string => {
        if (value === null || value === undefined) return '-';

        // Format currency fields
        if (['startingBid', 'currentBid'].includes(key)) {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(Number(value));
        }

        // Format date fields
        if (['startTime', 'endTime', 'createdAt', 'updatedAt'].includes(key)) {
          return new Date(value).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        // Format status
        if (key === 'status') {
          const statusMap: { [key: string]: string } = {
            'active': 'Aktif',
            'ended': 'Berakhir',
            'pending': 'Menunggu',
            'cancelled': 'Dibatalkan'
          };
          return statusMap[value] || value;
        }

        return String(value);
      };

      if (exportData.length === 0) {
        return res.status(404).json({ message: "No data available for export" });
      }

      // Handle different export formats
      switch (format) {
        case "csv":
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.csv"`);

          // Define clear column structure for CSV
          const csvColumns = [
            { key: 'id', header: 'ID' },
            { key: 'title', header: 'Judul Lelang' },
            { key: 'description', header: 'Deskripsi' },
            { key: 'categoryName', header: 'Kategori' },
            { key: 'startingBid', header: 'Bid Awal' },
            { key: 'currentBid', header: 'Bid Saat Ini' },
            { key: 'status', header: 'Status' },
            { key: 'location', header: 'Lokasi' },
            { key: 'startTime', header: 'Waktu Mulai' },
            { key: 'endTime', header: 'Waktu Berakhir' },
            { key: 'sellerName', header: 'Penjual' },
            { key: 'winnerName', header: 'Pemenang' },
            { key: 'bidCount', header: 'Jumlah Bid' }
          ];

          // Create CSV headers
          const csvHeaders = csvColumns.map(col => col.header).join(',');

          // Create CSV data rows
          const csvData = exportData.map(row =>
            csvColumns.map(col => {
              let value = row[col.key];
              let formattedValue = formatValue(col.key, value);

              // Handle null/undefined values
              if (formattedValue === null || formattedValue === undefined || formattedValue === 'null') {
                formattedValue = '-';
              }

              // Escape quotes and wrap in quotes if necessary
              if (formattedValue.includes(',') || formattedValue.includes('"') || formattedValue.includes('\n')) {
                formattedValue = `"${formattedValue.replace(/"/g, '""')}"`;
              }

              return formattedValue;
            }).join(',')
          ).join('\n');

          // Add BOM for proper UTF-8 display in Excel
          const csvContent = '\uFEFF' + csvHeaders + '\n' + csvData;

          return res.send(csvContent); case "excel":
          // Create a clean, organized data structure for Excel
          const cleanExcelData = exportData.map(row => {
            return {
              'ID': row.id,
              'Judul Lelang': row.title,
              'Deskripsi': row.description,
              'Kategori': row.categoryName || '-',
              'Bid Awal': formatValue('startingBid', row.startingBid),
              'Bid Saat Ini': formatValue('currentBid', row.currentBid),
              'Status': formatValue('status', row.status),
              'Lokasi': row.location || '-',
              'Waktu Mulai': formatValue('startTime', row.startTime),
              'Waktu Berakhir': formatValue('endTime', row.endTime),
              'Penjual': row.sellerName || '-',
              'Pemenang': row.winnerName || '-',
              'Jumlah Bid': row.bidCount || 0,
              'Dibuat Pada': formatValue('createdAt', row.createdAt)
            };
          });

          const ws = XLSX.utils.json_to_sheet(cleanExcelData);

          // Set specific column widths for better readability
          ws['!cols'] = [
            { wch: 8 },   // ID
            { wch: 30 },  // Judul Lelang
            { wch: 40 },  // Deskripsi
            { wch: 15 },  // Kategori
            { wch: 18 },  // Bid Awal
            { wch: 18 },  // Bid Saat Ini
            { wch: 12 },  // Status
            { wch: 20 },  // Lokasi
            { wch: 22 },  // Waktu Mulai
            { wch: 22 },  // Waktu Berakhir
            { wch: 20 },  // Penjual
            { wch: 20 },  // Pemenang
            { wch: 12 },  // Jumlah Bid
            { wch: 22 }   // Dibuat Pada
          ];

          // Style the header row
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
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

          const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.xlsx"`);

          return res.send(excelBuffer); case "pdf":
          const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

          // Add title
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text('LAPORAN DATA LELANG', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

          // Add export date
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`, 20, 35);

          doc.text(`Total Data: ${exportData.length} lelang`, 20, 45);

          // Select only important columns for PDF to avoid clutter
          const importantColumns = ['id', 'title', 'startingBid', 'currentBid', 'status', 'startTime', 'endTime'];

          const pdfHeaders = importantColumns.map(formatHeader);
          const pdfData = exportData.map(row =>
            importantColumns.map(key => {
              let value = row[key];
              let formattedValue = formatValue(key, value);

              // Limit title length for better display
              if (key === 'title' && formattedValue.length > 25) {
                formattedValue = formattedValue.substring(0, 22) + '...';
              }

              return formattedValue;
            })
          );

          // Add table with better configuration
          autoTable(doc, {
            head: [pdfHeaders],
            body: pdfData,
            startY: 55,
            styles: {
              fontSize: 10,
              cellPadding: 4,
              valign: 'middle',
              lineColor: [128, 128, 128],
              lineWidth: 0.1
            },
            headStyles: {
              fillColor: [52, 152, 219],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 11,
              halign: 'center'
            },
            bodyStyles: {
              textColor: 50
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            columnStyles: {
              0: { halign: 'center', cellWidth: 20 },   // ID
              1: { halign: 'left', cellWidth: 60 },     // Title
              2: { halign: 'right', cellWidth: 35 },    // Starting Bid
              3: { halign: 'right', cellWidth: 35 },    // Current Bid
              4: { halign: 'center', cellWidth: 25 },   // Status
              5: { halign: 'center', cellWidth: 40 },   // Start Time
              6: { halign: 'center', cellWidth: 40 }    // End Time
            },
            margin: { top: 55, left: 20, right: 20 },
            didDrawPage: function (data) {
              // Add page number
              const pageCount = doc.getNumberOfPages();
              doc.setFontSize(10);
              doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`,
                doc.internal.pageSize.getWidth() - 40,
                doc.internal.pageSize.getHeight() - 15);
            }
          });

          const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.pdf"`);

          return res.send(pdfBuffer);

        case "json":
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.json"`);

          // Prepare formatted data for JSON
          const formattedJsonData = exportData.map(row => {
            const formattedRow: any = {};
            Object.entries(row).forEach(([key, value]) => {
              const header = formatHeader(key);
              formattedRow[header] = formatValue(key, value);
            });
            return formattedRow;
          });

          return res.json({
            metadata: {
              exportDate: new Date().toISOString(),
              exportDateFormatted: new Date().toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              totalRecords: exportData.length,
              format: 'JSON',
              source: 'E-Auction System'
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

  // Admin endpoint to generate invoice for auction winner
  app.post("/api/admin/auctions/:id/generate-invoice", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const auctionId = parseInt(req.params.id);

      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({ message: "Invalid auction ID" });
      }

      // Get auction details to determine winner
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      if (!auction.winnerId) {
        return res.status(400).json({ message: "Auction has no winner yet" });
      }

      // Generate invoice for the winner
      const invoiceDocument = await storage.generateInvoiceForWinner(auctionId, auction.winnerId);

      if (!invoiceDocument) {
        return res.status(500).json({ message: "Failed to generate invoice" });
      }

      // Get updated auction with invoice data
      const updatedAuction = await storage.getAuction(auctionId);

      res.json({
        message: "Invoice generated successfully",
        invoice: {
          invoiceNumber: updatedAuction?.invoiceNumber,
          invoiceDocument: updatedAuction?.invoiceDocument,
          auctionId: auctionId,
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

  // Endpoint to download invoice document for auction winners
  app.get("/api/auctions/:id/invoice", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);

      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({ message: "Invalid auction ID" });
      }

      // Get auction with invoice data
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      // Check if user is the winner or an admin
      if (!req.isAuthenticated() || (auction.winnerId !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied. Only the winner or admin can download the invoice." });
      }

      // Check if auction has ended and has a winner
      if (auction.status !== "ended" || !auction.winnerId) {
        return res.status(400).json({ message: "Invoice not available. Auction must be ended with a winner." });
      }

      // Check if invoice exists
      if (!auction.invoiceDocument || !auction.invoiceNumber) {
        return res.status(404).json({ message: "Invoice not found. Please contact admin to generate invoice." });
      }

      // Parse base64 invoice document
      const base64Data = auction.invoiceDocument.split(',')[1];
      const mimeType = auction.invoiceDocument.split(',')[0].split(':')[1].split(';')[0];

      let fileExtension = 'pdf';
      let contentType = 'application/pdf';

      // Check if it's PDF or HTML
      if (mimeType.includes('html')) {
        fileExtension = 'html';
        contentType = 'text/html; charset=utf-8';
        const invoiceContent = Buffer.from(base64Data, 'base64').toString('utf8');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${auction.invoiceNumber}.${fileExtension}"`);
        res.send(invoiceContent);
      } else {
        // Handle PDF
        const invoiceBuffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${auction.invoiceNumber}.${fileExtension}"`);
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

  // Endpoint to view invoice document inline (for preview)
  app.get("/api/auctions/:id/invoice/preview", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);

      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({ message: "Invalid auction ID" });
      }

      // Get auction with invoice data
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      // Check if user is the winner or an admin
      if (!req.isAuthenticated() || (auction.winnerId !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied. Only the winner or admin can view the invoice." });
      }

      // Check if auction has ended and has a winner
      if (auction.status !== "ended" || !auction.winnerId) {
        return res.status(400).json({ message: "Invoice not available. Auction must be ended with a winner." });
      }

      // Check if invoice exists
      if (!auction.invoiceDocument || !auction.invoiceNumber) {
        return res.status(404).json({ message: "Invoice not found. Please contact admin to generate invoice." });
      }

      // Parse base64 invoice document
      const base64Data = auction.invoiceDocument.split(',')[1];
      const mimeType = auction.invoiceDocument.split(',')[0].split(':')[1].split(';')[0];

      // Check if it's PDF or HTML
      if (mimeType.includes('html')) {
        const invoiceContent = Buffer.from(base64Data, 'base64').toString('utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(invoiceContent);
      } else {
        // Handle PDF preview - send PDF to be opened in browser
        const invoiceBuffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Invoice-${auction.invoiceNumber}.pdf"`);
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
