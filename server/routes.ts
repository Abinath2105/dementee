import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { fetchYouTubeVideoInfo } from "./services/youtube";
import { insertVideoSchema, insertCategorySchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const parsed = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(parsed);
      res.status(201).json(category);
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Videos
  app.get("/api/videos", async (req, res) => {
    try {
      const { search, categoryId } = req.query;
      const videos = await storage.getVideos(
        search as string,
        categoryId ? parseInt(categoryId as string) : undefined
      );
      res.json(videos);
    } catch (error) {
      console.error('Get videos error:', error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error('Get video error:', error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { youtubeUrl, categoryId, description, tags } = req.body;

      // Fetch YouTube video info
      const youtubeInfo = await fetchYouTubeVideoInfo(youtubeUrl);

      const videoData = {
        title: youtubeInfo.title,
        description: description || youtubeInfo.description,
        youtubeId: youtubeInfo.id,
        thumbnailUrl: youtubeInfo.thumbnailUrl,
        duration: youtubeInfo.duration,
        categoryId: categoryId || null,
        tags: tags || [],
      };

      const parsed = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(parsed);
      res.status(201).json(video);
    } catch (error) {
      console.error('Create video error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create video" });
    }
  });

  app.put("/api/videos/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const updateData = req.body;

      const video = await storage.updateVideo(id, updateData);
      res.json(video);
    } catch (error) {
      console.error('Update video error:', error);
      res.status(500).json({ message: "Failed to update video" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteVideo(id);
      res.sendStatus(204);
    } catch (error) {
      console.error('Delete video error:', error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  app.post("/api/videos/:id/view", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user?.id;
      const ipAddress = req.ip || req.connection.remoteAddress;

      await storage.incrementVideoViews(videoId, userId, ipAddress);
      res.sendStatus(200);
    } catch (error) {
      console.error('Record view error:', error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // Admin stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Test email endpoint (admin only)
  app.post("/api/test-email", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { testEmailConnection } = await import("./services/email");
      const isConnected = await testEmailConnection();
      
      if (isConnected) {
        res.json({ 
          success: true, 
          message: "Email server connection successful" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Email server connection failed. Check your SMTP credentials." 
        });
      }
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Email test failed: " + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
