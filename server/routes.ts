import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { fetchYouTubeVideoInfo } from "./services/youtube";
import { insertVideoSchema, insertCategorySchema, insertUserInvitationSchema, insertAppSettingsSchema, insertUserCategoryAccessSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Configure multer for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
  });

  // Serve uploaded files statically
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
  app.use('/uploads', express.static(uploadsDir));

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const userId = req.user?.id;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get single category by slug
  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const userId = req.user?.id;
      
      const category = await storage.getCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check if user has access to this category (if not admin)
      if (userId && !req.user?.isAdmin) {
        const userAccess = await storage.getUserCategoryAccess(userId);
        const hasAccess = userAccess.some(access => access.categoryId === category.id) || category.slug === 'other';
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have access to this category" });
        }
      }

      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
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

  // Alias for admin-specific category creation
  app.post("/api/admin/categories", async (req, res) => {
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

  app.put("/api/categories/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryId = parseInt(req.params.id);
      const parsed = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(categoryId, parsed);
      res.json(category);
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const categoryId = parseInt(req.params.id);
      await storage.deleteCategory(categoryId);
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Videos
  app.get("/api/videos", async (req, res) => {
    try {
      const { search, categoryId } = req.query;
      const userId = req.user?.id;
      const videos = await storage.getVideos(
        search as string,
        categoryId ? parseInt(categoryId as string) : undefined,
        userId
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

      const { youtubeUrl, categoryId, description, tags, title, isPublic } = req.body;

      // Fetch YouTube video info
      const youtubeInfo = await fetchYouTubeVideoInfo(youtubeUrl);

      const videoData = {
        title: title || youtubeInfo.title,
        description: description || youtubeInfo.description,
        youtubeId: youtubeInfo.id,
        thumbnailUrl: youtubeInfo.thumbnailUrl,
        duration: youtubeInfo.duration,
        categoryId: categoryId || null,
        tags: tags || [],
        isPublic: isPublic !== undefined ? isPublic : true,
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

  // Video category management endpoints
  app.get("/api/videos/:id/categories", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const categories = await storage.getVideoCategories(videoId);
      res.json(categories);
    } catch (error) {
      console.error('Get video categories error:', error);
      res.status(500).json({ message: "Failed to fetch video categories" });
    }
  });

  app.put("/api/videos/:id/categories", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const videoId = parseInt(req.params.id);
      const { categoryIds, primaryCategoryId } = req.body;

      if (!Array.isArray(categoryIds) || !primaryCategoryId) {
        return res.status(400).json({ message: "categoryIds array and primaryCategoryId are required" });
      }

      if (!categoryIds.includes(primaryCategoryId)) {
        return res.status(400).json({ message: "Primary category must be included in categoryIds" });
      }

      await storage.updateVideoCategories(videoId, categoryIds, primaryCategoryId);
      const updatedCategories = await storage.getVideoCategories(videoId);
      res.json(updatedCategories);
    } catch (error) {
      console.error('Update video categories error:', error);
      res.status(500).json({ message: "Failed to update video categories" });
    }
  });

  app.post("/api/videos/:videoId/categories/:categoryId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const videoId = parseInt(req.params.videoId);
      const categoryId = parseInt(req.params.categoryId);
      const { isPrimary = false } = req.body;

      const videoCategory = await storage.assignVideoToCategory(videoId, categoryId, isPrimary);
      res.status(201).json(videoCategory);
    } catch (error) {
      console.error('Assign video to category error:', error);
      res.status(500).json({ message: "Failed to assign video to category" });
    }
  });

  app.delete("/api/videos/:videoId/categories/:categoryId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const videoId = parseInt(req.params.videoId);
      const categoryId = parseInt(req.params.categoryId);

      await storage.removeVideoFromCategory(videoId, categoryId);
      res.sendStatus(204);
    } catch (error) {
      console.error('Remove video from category error:', error);
      res.status(500).json({ message: "Failed to remove video from category" });
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

  // Video rating routes
  app.post("/api/videos/:id/rating", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const videoId = parseInt(req.params.id);
      const userId = req.user.id;
      const { rating, review } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const ratingData = await storage.rateVideo(userId, videoId, rating, review);
      res.json(ratingData);
    } catch (error) {
      console.error('Rate video error:', error);
      res.status(500).json({ message: "Failed to rate video" });
    }
  });

  app.get("/api/videos/:id/rating", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const videoId = parseInt(req.params.id);
      const userId = req.user.id;

      const rating = await storage.getUserVideoRating(userId, videoId);
      res.json(rating);
    } catch (error) {
      console.error('Get rating error:', error);
      res.status(500).json({ message: "Failed to get rating" });
    }
  });

  // Video comment routes
  app.get("/api/videos/:id/comments", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const comments = await storage.getVideoComments(videoId);
      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  app.post("/api/videos/:id/comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const videoId = parseInt(req.params.id);
      const userId = req.user.id;
      const { content, parentId } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const comment = await storage.createVideoComment(userId, videoId, content.trim(), parentId);
      res.json(comment);
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Video completion tracking endpoints
  app.post("/api/videos/:id/complete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { watchTime } = req.body;

      const completion = await storage.markVideoComplete(userId, videoId, watchTime || 0);
      res.json(completion);
    } catch (error) {
      console.error('Mark video complete error:', error);
      res.status(500).json({ message: "Failed to mark video as complete" });
    }
  });

  app.delete("/api/videos/:id/complete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;

      await storage.markVideoIncomplete(userId, videoId);
      res.sendStatus(200);
    } catch (error) {
      console.error('Mark video incomplete error:', error);
      res.status(500).json({ message: "Failed to mark video as incomplete" });
    }
  });

  // Video bookmark routes
  app.post("/api/videos/:id/bookmark", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;

      await storage.bookmarkVideo(userId, videoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error bookmarking video:", error);
      res.status(500).json({ error: "Failed to bookmark video" });
    }
  });

  app.delete("/api/videos/:id/bookmark", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;

      await storage.removeBookmark(userId, videoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ error: "Failed to remove bookmark" });
    }
  });

  // Watch history routes
  app.post("/api/watch-history", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { videoId, watchDuration, progressPercentage, deviceInfo } = req.body;
      const userId = req.user!.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      await storage.recordWatchHistory({
        userId,
        videoId,
        watchDuration,
        progressPercentage,
        deviceInfo,
        ipAddress,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording watch history:", error);
      res.status(500).json({ error: "Failed to record watch history" });
    }
  });

  app.get("/api/watch-history", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await storage.getUserWatchHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      res.status(500).json({ error: "Failed to fetch watch history" });
    }
  });

  // User learning analytics
  app.get("/api/user/learning-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user!.id;
      const stats = await storage.getUserLearningStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching learning stats:", error);
      res.status(500).json({ error: "Failed to fetch learning stats" });
    }
  });

  app.get("/api/categories/:categoryId/progress", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const categoryId = parseInt(req.params.categoryId);
      const userId = req.user!.id;

      const progress = await storage.getCategoryProgress(userId, categoryId);
      res.json(progress);
    } catch (error) {
      console.error('Get category progress error:', error);
      res.status(500).json({ message: "Failed to fetch category progress" });
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

  // User learning analytics routes
  app.get("/api/user/learning-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const stats = await storage.getUserLearningStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("User learning stats error:", error);
      res.status(500).json({ message: "Failed to get learning stats" });
    }
  });

  app.get("/api/user/bookmarks", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const bookmarks = await storage.getUserBookmarks(req.user.id);
      res.json(bookmarks);
    } catch (error) {
      console.error("User bookmarks error:", error);
      res.status(500).json({ message: "Failed to get bookmarks" });
    }
  });

  app.get("/api/user/watch-history", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const history = await storage.getUserWatchHistory(req.user.id);
      res.json(history);
    } catch (error) {
      console.error("User watch history error:", error);
      res.status(500).json({ message: "Failed to get watch history" });
    }
  });

  app.get("/api/user/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessions = await storage.getUserSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error("User sessions error:", error);
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  // Admin user analytics routes
  app.get("/api/admin/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Admin get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.get("/api/admin/users/:id/learning-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      const stats = await storage.getUserLearningStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Admin user learning stats error:", error);
      res.status(500).json({ message: "Failed to get user learning stats" });
    }
  });

  app.get("/api/admin/users/:id/bookmarks", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Admin user bookmarks error:", error);
      res.status(500).json({ message: "Failed to get user bookmarks" });
    }
  });

  app.get("/api/admin/users/:id/watch-history", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      const history = await storage.getUserWatchHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Admin user watch history error:", error);
      res.status(500).json({ message: "Failed to get user watch history" });
    }
  });

  app.get("/api/admin/users/:id/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      const sessions = await storage.getUserSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Admin user sessions error:", error);
      res.status(500).json({ message: "Failed to get user sessions" });
    }
  });

  app.get("/api/admin/users/:id/completions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      const completions = await storage.getUserVideoCompletions(userId);
      res.json(completions);
    } catch (error) {
      console.error("Admin user completions error:", error);
      res.status(500).json({ message: "Failed to get user completions" });
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

  // User management endpoints (admin only)
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const users = await storage.getAllUsers();
      // Remove password from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Public users management endpoint (admin only)
  app.get("/api/admin/public-users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const publicUsers = await storage.getAllPublicUsers();
      // Remove password from response
      const safeUsers = publicUsers.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Get public users error:", error);
      res.status(500).json({ message: "Failed to fetch public users" });
    }
  });

  // Delete public user endpoint (admin only)
  app.delete("/api/admin/public-users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.id);
      await storage.deletePublicUser(userId);
      res.json({ message: "Public user deleted successfully" });
    } catch (error) {
      console.error("Delete public user error:", error);
      res.status(500).json({ message: "Failed to delete public user" });
    }
  });

  // Convert public user to student with full access (admin only)
  app.post("/api/admin/convert-public-to-student", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { publicUserId, email, fullName } = req.body;
      
      // Get the public user first
      const publicUser = await storage.getPublicUser(publicUserId);
      if (!publicUser) {
        return res.status(404).json({ message: "Public user not found" });
      }
      
      // Check if a regular user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "A student user with this email already exists" });
      }

      // Generate a random password
      const crypto = await import("crypto");
      const tempPassword = crypto.randomBytes(8).toString('hex');
      
      // Hash the password
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(tempPassword);

      // Create student user with same credentials
      const newUser = await storage.createUser({
        username: email.split('@')[0], // Use email prefix as username
        email: email,
        password: hashedPassword,
        fullName: fullName,
        role: 'student',
        isAdmin: false,
        isVerified: true, // They already verified as public user
        invitedBy: req.user.id,
      });

      // Delete the public user record
      await storage.deletePublicUser(publicUserId);

      // Send credentials via email
      try {
        const { sendEmail } = await import("./services/email");
        const appSettings = await storage.getAppSettings();
        
        await sendEmail({
          to: email,
          subject: `Welcome to ${appSettings.appName} - Your Student Account`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3b82f6;">Welcome to ${appSettings.appName}!</h2>
              <p>Your account has been upgraded to a full student account with access to all course categories.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${tempPassword}</p>
              </div>
              
              <p>Please log in and change your password in your profile settings.</p>
              <p><a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app` : 'http://localhost:5000'}" style="color: #3b82f6;">Access your account here</a></p>
              
              <p>Best regards,<br>${appSettings.appName} Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send credentials email:", emailError);
        // Continue anyway - admin can manually share credentials
      }

      // Return success with user info and credentials for admin
      const { password, ...safeUser } = newUser;
      res.json({ 
        message: "Public user converted to student successfully",
        user: safeUser,
        credentials: {
          email: email,
          password: tempPassword
        }
      });
    } catch (error) {
      console.error("Convert public user to student error:", error);
      res.status(500).json({ message: "Failed to convert public user to student" });
    }
  });

  app.put("/api/admin/users/:id/admin", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.id);
      const { isAdmin } = req.body;

      // Prevent user from removing their own admin status
      if (userId === req.user.id && !isAdmin) {
        return res.status(400).json({ message: "Cannot remove your own admin permissions" });
      }

      const user = await storage.updateUserAdminStatus(userId, isAdmin);
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Update user admin status error:", error);
      res.status(500).json({ message: "Failed to update user admin status" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.id);

      // Prevent user from deleting their own account
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put("/api/admin/users/:id/password", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const user = await storage.setUserPassword(userId, newPassword);
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // User invitation routes (admin only)
  app.post("/api/admin/invitations", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const parsed = insertUserInvitationSchema.parse(req.body);
      const invitation = await storage.createUserInvitation({
        ...parsed,
        invitedBy: req.user.id,
      });
      
      // Send invitation email
      const { sendInvitationEmail } = await import("./services/email");
      await sendInvitationEmail(invitation.email, invitation.inviteToken, parsed.role);
      
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Create invitation error:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get("/api/admin/invitations", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const invitations = await storage.getAllInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Get invitations error:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.delete("/api/admin/invitations/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteInvitation(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Delete invitation error:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // User category access routes (admin only)
  app.post("/api/admin/users/:userId/categories/:categoryId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.userId);
      const categoryId = parseInt(req.params.categoryId);
      const access = await storage.assignUserToCategory(userId, categoryId, req.user.id);
      res.status(201).json(access);
    } catch (error) {
      console.error("Assign category error:", error);
      res.status(500).json({ message: "Failed to assign category to user" });
    }
  });

  app.delete("/api/admin/users/:userId/categories/:categoryId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.userId);
      const categoryId = parseInt(req.params.categoryId);
      await storage.removeUserFromCategory(userId, categoryId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Remove category access error:", error);
      res.status(500).json({ message: "Failed to remove category access" });
    }
  });

  app.get("/api/admin/users/:userId/categories", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.userId);
      const access = await storage.getUserCategoryAccess(userId);
      res.json(access);
    } catch (error) {
      console.error("Get user category access error:", error);
      res.status(500).json({ message: "Failed to fetch user category access" });
    }
  });

  app.get("/api/admin/categories/:categoryId/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const categoryId = parseInt(req.params.categoryId);
      const users = await storage.getCategoryUsers(categoryId);
      res.json(users);
    } catch (error) {
      console.error("Get category users error:", error);
      res.status(500).json({ message: "Failed to fetch category users" });
    }
  });

  // Public invitation acceptance route
  app.get("/api/invitation/:token", async (req, res) => {
    try {
      const invitation = await storage.getUserInvitation(req.params.token);
      if (!invitation) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }
      res.json({ email: invitation.email, role: invitation.role });
    } catch (error) {
      console.error("Get invitation error:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  app.post("/api/invitation/:token/accept", async (req, res) => {
    try {
      const { username, fullName, password } = req.body;
      const user = await storage.acceptUserInvitation(req.params.token, {
        username,
        fullName,
        password,
      });
      
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Accept invitation error:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // App settings routes (admin only)
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get app settings error:", error);
      res.status(500).json({ message: "Failed to fetch app settings" });
    }
  });

  app.put("/api/admin/settings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const parsed = insertAppSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateAppSettings(parsed);
      res.json(settings);
    } catch (error) {
      console.error("Update app settings error:", error);
      res.status(500).json({ message: "Failed to update app settings" });
    }
  });

  // File upload route for banners and logos (admin only)
  app.post("/api/admin/upload", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('File uploaded:', fileUrl);
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Image upload route for category covers (admin only)
  app.post("/api/upload/image", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('Category image uploaded:', fileUrl);
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Contact form submission endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required' });
      }

      // Send email to healthyemp@gmail.com
      const { sendEmail } = await import('./services/email.js');
      
      const emailSent = await sendEmail({
        to: 'healthyemp@gmail.com',
        from: email,
        subject: `New Contact Form Submission from ${name}`,
        text: `
Name: ${name}
Email: ${email}
Message: ${message}
        `,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      });

      if (emailSent) {
        res.json({ message: 'Message sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send message' });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
