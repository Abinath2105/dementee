import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { fetchYouTubeVideoInfo } from "./services/youtube";
import { insertVideoSchema, insertCategorySchema, insertCourseSchema } from "@shared/schema";
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

  // Video Comments and Ratings Routes
  app.get("/api/videos/:videoId/comments", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const comments = await storage.getVideoComments(videoId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/videos/:videoId/comments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const videoId = parseInt(req.params.videoId);
      const { content, parentId } = req.body;
      
      const comment = await storage.createComment({
        videoId,
        userId: req.user!.id,
        content,
        parentId: parentId || undefined,
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/comments/:commentId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const commentId = parseInt(req.params.commentId);
      const { content } = req.body;
      
      const comment = await storage.updateComment(commentId, content);
      res.json(comment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:commentId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const commentId = parseInt(req.params.commentId);
      await storage.deleteComment(commentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.post("/api/comments/:commentId/like", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const commentId = parseInt(req.params.commentId);
      const result = await storage.toggleCommentLike(commentId, req.user!.id);
      res.json(result);
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Video Ratings Routes
  app.get("/api/videos/:videoId/rating", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const videoId = parseInt(req.params.videoId);
      const rating = await storage.getVideoRating(videoId, req.user!.id);
      res.json(rating);
    } catch (error) {
      console.error("Error fetching user rating:", error);
      res.status(500).json({ message: "Failed to fetch rating" });
    }
  });

  app.post("/api/videos/:videoId/rating", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const videoId = parseInt(req.params.videoId);
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      const videoRating = await storage.createOrUpdateRating({
        videoId,
        userId: req.user!.id,
        rating,
      });
      
      res.json(videoRating);
    } catch (error) {
      console.error("Error creating/updating rating:", error);
      res.status(500).json({ message: "Failed to create/update rating" });
    }
  });

  app.delete("/api/videos/:videoId/rating", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const videoId = parseInt(req.params.videoId);
      await storage.deleteRating(videoId, req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting rating:", error);
      res.status(500).json({ message: "Failed to delete rating" });
    }
  });

  app.get("/api/videos/:videoId/rating-stats", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const stats = await storage.getVideoRatingStats(videoId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching rating stats:", error);
      res.status(500).json({ message: "Failed to fetch rating stats" });
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

  // Platform settings endpoints
  app.get("/api/platform/settings", async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error getting platform settings:", error);
      res.status(500).json({ error: "Failed to get platform settings" });
    }
  });

  app.put("/api/platform/settings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const settings = await storage.updatePlatformSettings({
        ...req.body,
        updatedBy: req.user.id,
      });
      res.json(settings);
    } catch (error) {
      console.error("Error updating platform settings:", error);
      res.status(500).json({ error: "Failed to update platform settings" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Student Admission API Routes
  app.get("/api/admin/student-applications", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const applications = await storage.getStudentApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching student applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.post("/api/admin/student-applications", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const application = await storage.createStudentApplication(req.body);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating student application:", error);
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  app.put("/api/admin/student-applications/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body;
      const application = await storage.updateApplicationStatus(applicationId, status);
      res.json(application);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ error: "Failed to update application status" });
    }
  });

  app.post("/api/admin/student-applications/:id/generate-student-id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.generateStudentId(applicationId);
      res.json(application);
    } catch (error) {
      console.error("Error generating student ID:", error);
      res.status(500).json({ error: "Failed to generate student ID" });
    }
  });

  // Delete fee payment endpoint
  app.delete("/api/admin/fee-payments/:paymentId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const paymentId = parseInt(req.params.paymentId);
      await storage.deleteFeePayment(paymentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting fee payment:", error);
      res.status(500).json({ error: "Failed to delete fee payment" });
    }
  });

  app.post("/api/admin/student-applications/:id/send-welcome-email", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const applicationId = parseInt(req.params.id);
      // TODO: Implement welcome email sending
      res.json({ success: true, message: "Welcome email sent successfully" });
    } catch (error) {
      console.error("Error sending welcome email:", error);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  app.get("/api/admin/student-batches", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const batches = await storage.getStudentBatches();
      res.json(batches);
    } catch (error) {
      console.error("Error fetching student batches:", error);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  app.post("/api/admin/student-batches", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const batch = await storage.createStudentBatch(req.body);
      res.status(201).json(batch);
    } catch (error) {
      console.error("Error creating student batch:", error);
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.get("/api/admin/fee-structures", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const feeStructures = await storage.getFeeStructures();
      res.json(feeStructures);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      res.status(500).json({ error: "Failed to fetch fee structures" });
    }
  });

  app.post("/api/admin/fee-structures", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const feeStructure = await storage.createFeeStructure(req.body);
      res.status(201).json(feeStructure);
    } catch (error) {
      console.error("Error creating fee structure:", error);
      res.status(500).json({ error: "Failed to create fee structure" });
    }
  });

  // Receipt download endpoint
  app.get("/api/admin/fee-payments/:applicationId/receipt", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const applicationId = parseInt(req.params.applicationId);
      
      // Generate a simple receipt (in a real app, you'd use a PDF library)
      const application = await storage.getStudentApplications();
      const app = application.find(a => a.id === applicationId);
      
      if (!app) {
        return res.status(404).json({ error: "Application not found" });
      }

      const receiptContent = `
PAYMENT RECEIPT
===============

Application ID: ${app.id}
Student Name: ${app.firstName} ${app.lastName}
Email: ${app.email}
Date: ${new Date().toDateString()}

Payment Details:
- Course: ${app.preferredCourse}
- Amount: ₹${app.feeStructure?.totalAmount || 'N/A'}

Thank you for your payment!

De mentee Academy
      `;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="receipt_${applicationId}.txt"`);
      res.send(receiptContent);
    } catch (error) {
      console.error("Error generating receipt:", error);
      res.status(500).json({ error: "Failed to generate receipt" });
    }
  });

  // Configure multer for receipt uploads
  const receiptUpload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for receipts
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files and PDFs are allowed'));
      }
    },
  });

  app.post("/api/admin/fee-payments", receiptUpload.single('receipt'), async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const paymentData = {
        applicationId: parseInt(req.body.applicationId),
        feePlan: req.body.feePlan,
        totalAmount: parseFloat(req.body.totalAmount),
        paidAmount: parseFloat(req.body.paidAmount),
        pendingAmount: parseFloat(req.body.pendingAmount),
        paymentMethod: req.body.paymentMethod,
        paymentDate: new Date(req.body.paymentDate + 'T00:00:00.000Z'), // Convert date string to Date object
        paymentStatus: req.body.paymentStatus,
        receiptUrl: req.file ? `/uploads/${req.file.filename}` : null,
        emiDates: req.body.emiDates ? JSON.parse(req.body.emiDates) : null,
      };

      const payment = await storage.createFeePayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating fee payment:", error);
      res.status(500).json({ error: "Failed to create fee payment" });
    }
  });

  app.get("/api/admin/orientation-sessions", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const sessions = await storage.getOrientationSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching orientation sessions:", error);
      res.status(500).json({ error: "Failed to fetch orientation sessions" });
    }
  });

  // Fee Dashboard API endpoints
  app.get("/api/admin/payment-stats", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const stats = await storage.getPaymentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ error: "Failed to fetch payment statistics" });
    }
  });

  app.get("/api/admin/payment-records", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const records = await storage.getPaymentRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching payment records:", error);
      res.status(500).json({ error: "Failed to fetch payment records" });
    }
  });

  app.get("/api/admin/monthly-payment-data", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const data = await storage.getMonthlyPaymentData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching monthly payment data:", error);
      res.status(500).json({ error: "Failed to fetch monthly payment data" });
    }
  });

  app.get("/api/admin/course-revenue", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const data = await storage.getCourseRevenueData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching course revenue data:", error);
      res.status(500).json({ error: "Failed to fetch course revenue data" });
    }
  });

  app.post("/api/admin/orientation-sessions", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const session = await storage.createOrientationSession(req.body);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating orientation session:", error);
      res.status(500).json({ error: "Failed to create orientation session" });
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
