import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { fetchYouTubeVideoInfo } from "./services/youtube";
import { insertVideoSchema, insertCategorySchema, insertMentorSchema } from "@shared/schema";
import { sendMentorInvitationEmail } from "./services/email";
import { nanoid } from "nanoid";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  app.use('/uploads', express.static(uploadsDir));

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

  // LMS Routes - Assignments
  app.get("/api/assignments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const assignments = await storage.getAssignments(req.user!.id);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).send("Failed to fetch assignments");
    }
  });

  app.get("/api/assignments/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const stats = await storage.getAssignmentStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching assignment stats:", error);
      res.status(500).send("Failed to fetch assignment stats");
    }
  });

  // LMS Routes - Advanced Dashboard
  app.get("/api/dashboard/advanced", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const dashboardData = await storage.getAdvancedDashboardData(req.user!.id);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching advanced dashboard data:", error);
      res.status(500).send("Failed to fetch dashboard data");
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

  // Mentor management endpoints (admin only)
  app.get("/api/admin/mentors", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const mentors = await storage.getMentors();
      res.json(mentors);
    } catch (error) {
      console.error("Get mentors error:", error);
      res.status(500).json({ message: "Failed to fetch mentors" });
    }
  });

  app.post("/api/admin/mentors", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const parsed = insertMentorSchema.parse(req.body);
      
      // Check if mentor with this email already exists
      const existingMentor = await storage.getMentorByEmail(parsed.email);
      if (existingMentor) {
        return res.status(400).json({ message: "Mentor with this email already exists" });
      }

      // Create mentor
      const mentor = await storage.createMentor(parsed);

      // Generate invitation token
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation
      await storage.createMentorInvitation({
        mentorId: mentor.id,
        token,
        expiresAt,
      });

      // Send invitation email
      await sendMentorInvitationEmail(mentor.email, mentor.name, token);

      res.status(201).json({ 
        message: "Mentor created and invitation sent successfully",
        mentor 
      });
    } catch (error) {
      console.error("Create mentor error:", error);
      res.status(500).json({ message: "Failed to create mentor" });
    }
  });

  app.put("/api/admin/mentors/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const mentorId = parseInt(req.params.id);
      const updateData = insertMentorSchema.partial().parse(req.body);

      const mentor = await storage.updateMentor(mentorId, updateData);
      res.json(mentor);
    } catch (error) {
      console.error("Update mentor error:", error);
      res.status(500).json({ message: "Failed to update mentor" });
    }
  });

  app.delete("/api/admin/mentors/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const mentorId = parseInt(req.params.id);
      await storage.deleteMentor(mentorId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Delete mentor error:", error);
      res.status(500).json({ message: "Failed to delete mentor" });
    }
  });

  app.post("/api/admin/mentors/:id/resend-invitation", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const mentorId = parseInt(req.params.id);
      const mentor = await storage.getMentor(mentorId);
      
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }

      if (mentor.isActive) {
        return res.status(400).json({ message: "Mentor is already active" });
      }

      // Generate new invitation token
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create new invitation
      await storage.createMentorInvitation({
        mentorId: mentor.id,
        token,
        expiresAt,
      });

      // Send invitation email
      await sendMentorInvitationEmail(mentor.email, mentor.name, token);

      res.json({ message: "Invitation resent successfully" });
    } catch (error) {
      console.error("Resend invitation error:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });

  // Mentor setup endpoint (public)
  app.get("/api/mentor/invitation/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getMentorInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      const mentor = await storage.getMentor(invitation.mentorId);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }

      res.json({
        mentorName: mentor.name,
        mentorEmail: mentor.email,
        valid: true
      });
    } catch (error) {
      console.error("Get invitation error:", error);
      res.status(500).json({ message: "Failed to validate invitation" });
    }
  });

  app.post("/api/mentor/setup", async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;
      
      if (!password || !confirmPassword) {
        return res.status(400).json({ message: "Password and confirmation are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const invitation = await storage.getMentorInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      const mentor = await storage.getMentor(invitation.mentorId);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }

      // Check if mentor already has credentials
      const existingCredentials = await storage.getMentorCredentials(mentor.id);
      if (existingCredentials) {
        return res.status(400).json({ message: "Mentor account is already set up" });
      }

      // Hash password and create credentials
      const hashedPassword = await hashPassword(password);
      await storage.createMentorCredentials({
        mentorId: mentor.id,
        password: hashedPassword,
      });

      // Activate mentor and mark invitation as used
      await storage.activateMentor(mentor.id);
      await storage.markInvitationAsUsed(invitation.id);

      res.json({ 
        message: "Mentor account setup completed successfully",
        mentor: {
          name: mentor.name,
          email: mentor.email,
          profession: mentor.profession
        }
      });
    } catch (error) {
      console.error("Mentor setup error:", error);
      res.status(500).json({ message: "Failed to setup mentor account" });
    }
  });

  // Video progress tracking endpoints
  app.get("/api/progress/:videoId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const videoId = parseInt(req.params.videoId);
      const progress = await storage.getVideoProgress(req.user.id, videoId);
      res.json(progress || null);
    } catch (error) {
      console.error("Error fetching video progress:", error);
      res.status(500).send("Failed to fetch video progress");
    }
  });

  app.post("/api/progress/:videoId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const videoId = parseInt(req.params.videoId);
      const progressData = {
        currentTimeSeconds: req.body.currentTimeSeconds,
        durationSeconds: req.body.durationSeconds,
        isCompleted: req.body.isCompleted,
        completedAt: req.body.isCompleted ? new Date() : undefined,
      };

      const progress = await storage.updateVideoProgress(req.user.id, videoId, progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating video progress:", error);
      res.status(500).send("Failed to update video progress");
    }
  });

  app.get("/api/user/progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const progress = await storage.getUserVideoProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).send("Failed to fetch user progress");
    }
  });

  app.get("/api/user/progress/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const stats = await storage.getVideoProgressStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching progress stats:", error);
      res.status(500).send("Failed to fetch progress stats");
    }
  });

  // Video bookmarks endpoints
  app.get("/api/bookmarks/:videoId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const videoId = parseInt(req.params.videoId);
      const bookmarks = await storage.getVideoBookmarks(req.user.id, videoId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching video bookmarks:", error);
      res.status(500).send("Failed to fetch video bookmarks");
    }
  });

  app.post("/api/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const bookmarkData = {
        userId: req.user.id,
        videoId: req.body.videoId,
        timestampSeconds: req.body.timestampSeconds,
        note: req.body.note,
      };

      const bookmark = await storage.createVideoBookmark(bookmarkData);
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).send("Failed to create bookmark");
    }
  });

  app.delete("/api/bookmarks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteVideoBookmark(id);
      res.status(200).json({ message: "Bookmark deleted successfully" });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).send("Failed to delete bookmark");
    }
  });

  app.get("/api/user/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const bookmarks = await storage.getUserBookmarks(req.user.id);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching user bookmarks:", error);
      res.status(500).send("Failed to fetch user bookmarks");
    }
  });

  // Watchlist endpoints
  app.get("/api/watchlist", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const watchlist = await storage.getUserWatchlist(req.user.id);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).send("Failed to fetch watchlist");
    }
  });

  app.post("/api/watchlist/:videoId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const videoId = parseInt(req.params.videoId);
      const watchlistItem = await storage.addToWatchlist(req.user.id, videoId);
      res.json(watchlistItem);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).send("Failed to add to watchlist");
    }
  });

  app.delete("/api/watchlist/:videoId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const videoId = parseInt(req.params.videoId);
      await storage.removeFromWatchlist(req.user.id, videoId);
      res.status(200).json({ message: "Removed from watchlist" });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).send("Failed to remove from watchlist");
    }
  });

  app.get("/api/watchlist/:videoId/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const videoId = parseInt(req.params.videoId);
      const isInWatchlist = await storage.isInWatchlist(req.user.id, videoId);
      res.json({ isInWatchlist });
    } catch (error) {
      console.error("Error checking watchlist status:", error);
      res.status(500).send("Failed to check watchlist status");
    }
  });

  // Mentor profile endpoint
  app.get("/api/mentor/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      // First check if the authenticated user is a mentor (has isMentor flag)
      if (req.user.isMentor) {
        const mentor = await storage.getMentorByEmail(req.user.email);
        if (!mentor) {
          return res.status(404).json({ message: "Mentor profile not found" });
        }

        res.json({
          ...mentor,
          hasCredentials: true,
        });
        return;
      }

      // Check if there's a mentor with the same email as the logged-in user
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (mentor) {
        res.json({
          ...mentor,
          hasCredentials: true,
        });
        return;
      }

      // Finally, check if regular user has mentor credentials
      const mentorCredentials = await storage.getMentorCredentials(req.user.id);
      if (!mentorCredentials) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }

      // Get mentor details
      const mentorDetails = await storage.getMentor(mentorCredentials.mentorId);
      if (!mentorDetails) {
        return res.status(404).json({ message: "Mentor not found" });
      }

      res.json({
        ...mentorDetails,
        hasCredentials: true,
      });
    } catch (error) {
      console.error("Error fetching mentor profile:", error);
      res.status(500).send("Failed to fetch mentor profile");
    }
  });

  // Photo upload endpoints for mentors
  app.post("/api/mentor/upload-photo", upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check if user is a mentor
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        // Clean up uploaded file if not a mentor
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Mentor profile not found" });
      }

      // Generate the URL path for the uploaded file
      const photoUrl = `/uploads/${req.file.filename}`;

      // Update mentor profile with new photo
      const updatedMentor = await storage.updateMentor(mentor.id, { photo: photoUrl });

      res.json({
        message: "Photo uploaded successfully",
        photoUrl: photoUrl,
        mentor: updatedMentor
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      // Clean up file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }
      res.status(500).send("Failed to upload photo");
    }
  });

  app.post("/api/mentor/upload-background", upload.single('background'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check if user is a mentor
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        // Clean up uploaded file if not a mentor
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Mentor profile not found" });
      }

      // Generate the URL path for the uploaded file
      const backgroundUrl = `/uploads/${req.file.filename}`;

      // Update mentor profile with new background image
      const updatedMentor = await storage.updateMentor(mentor.id, { backgroundImage: backgroundUrl });

      res.json({
        message: "Background image uploaded successfully",
        backgroundUrl: backgroundUrl,
        mentor: updatedMentor
      });
    } catch (error) {
      console.error("Error uploading background image:", error);
      // Clean up file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }
      res.status(500).send("Failed to upload background image");
    }
  });

  // Delete photo endpoints
  app.delete("/api/mentor/delete-photo", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }

      // Delete old photo file if it exists
      if (mentor.photo && mentor.photo.startsWith('/uploads/')) {
        const filePath = path.join(uploadsDir, mentor.photo.replace('/uploads/', ''));
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error("Error deleting old photo file:", deleteError);
        }
      }

      // Update mentor profile to remove photo
      const updatedMentor = await storage.updateMentor(mentor.id, { photo: null });

      res.json({
        message: "Photo deleted successfully",
        mentor: updatedMentor
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).send("Failed to delete photo");
    }
  });

  app.delete("/api/mentor/delete-background", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }

      // Delete old background image file if it exists
      if (mentor.backgroundImage && mentor.backgroundImage.startsWith('/uploads/')) {
        const filePath = path.join(uploadsDir, mentor.backgroundImage.replace('/uploads/', ''));
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error("Error deleting old background file:", deleteError);
        }
      }

      // Update mentor profile to remove background image
      const updatedMentor = await storage.updateMentor(mentor.id, { backgroundImage: null });

      res.json({
        message: "Background image deleted successfully",
        mentor: updatedMentor
      });
    } catch (error) {
      console.error("Error deleting background image:", error);
      res.status(500).send("Failed to delete background image");
    }
  });

  // Update mentor profile
  app.put("/api/mentor/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }
      
      const updatedMentor = await storage.updateMentorProfile(mentor.id, req.body);
      res.json(updatedMentor);
    } catch (error) {
      console.error("Error updating mentor profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mentor sections
  app.get("/api/mentor/sections", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }
      
      const sections = await storage.getMentorSections(mentor.id);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching mentor sections:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/mentor/sections", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }
      
      const section = await storage.createMentorSection({
        ...req.body,
        mentorId: mentor.id
      });
      res.json(section);
    } catch (error) {
      console.error("Error creating mentor section:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/mentor/sections/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const section = await storage.updateMentorSection(parseInt(req.params.id), req.body);
      res.json(section);
    } catch (error) {
      console.error("Error updating mentor section:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/mentor/sections/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      await storage.deleteMentorSection(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting mentor section:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mentor resources
  app.get("/api/mentor/resources", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }
      
      const resources = await storage.getMentorResources(mentor.id);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching mentor resources:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/mentor/resources", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const mentor = await storage.getMentorByEmail(req.user.email);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }
      
      const resource = await storage.createMentorResource({
        ...req.body,
        mentorId: mentor.id
      });
      res.json(resource);
    } catch (error) {
      console.error("Error creating mentor resource:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/mentor/resources/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const resource = await storage.updateMentorResource(parseInt(req.params.id), req.body);
      res.json(resource);
    } catch (error) {
      console.error("Error updating mentor resource:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/mentor/resources/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      await storage.deleteMentorResource(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting mentor resource:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Student profile endpoints
  app.get("/api/student/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get additional student data
      const progressStats = await storage.getVideoProgressStats(req.user.id);
      
      res.json({
        ...user,
        completedVideos: progressStats.completedVideos,
        totalWatchTime: progressStats.totalWatchTime,
      });
    } catch (error) {
      console.error("Error fetching student profile:", error);
      res.status(500).send("Failed to fetch student profile");
    }
  });

  app.put("/api/student/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const updatedUser = await storage.updateUserProfile(req.user.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating student profile:", error);
      res.status(500).send("Failed to update student profile");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
