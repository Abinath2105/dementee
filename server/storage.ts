import { users, publicUsers, videos, categories, otpCodes, videoViews, appSettings, userInvitations, userCategoryAccess, videoCompletions, videoBookmarks, watchHistory, userSessions, videoRatings, videoComments, type User, type InsertUser, type PublicUser, type InsertPublicUser, type Video, type InsertVideo, type Category, type InsertCategory, type OtpCode, type InsertOtp, type VideoWithCategory, type AdminStats, type AppSettings, type InsertAppSettings, type UserInvitation, type InsertUserInvitation, type UserCategoryAccess, type InsertUserCategoryAccess, type VideoCompletion, type InsertVideoCompletion, type VideoBookmark, type InsertVideoBookmark, type WatchHistory, type InsertWatchHistory, type UserSession, type InsertUserSession, type VideoRating, type InsertVideoRating, type VideoComment, type InsertVideoComment, type UserLearningStats } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike, isNotNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import crypto from "crypto";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(email: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User>;
  deleteUser(userId: number): Promise<void>;
  setUserPassword(userId: number, password: string): Promise<User>;

  // Public user management
  getPublicUser(id: number): Promise<PublicUser | undefined>;
  getPublicUserByEmail(email: string): Promise<PublicUser | undefined>;
  createPublicUser(user: InsertPublicUser): Promise<PublicUser>;
  verifyPublicUser(email: string): Promise<void>;
  getAllPublicUsers(): Promise<PublicUser[]>;
  deletePublicUser(id: number): Promise<void>;

  // User invitation management
  createUserInvitation(invitation: InsertUserInvitation & { invitedBy: number }): Promise<UserInvitation>;
  getUserInvitation(token: string): Promise<UserInvitation | undefined>;
  acceptUserInvitation(token: string, userData: { username: string; fullName: string; password: string }): Promise<User>;
  getAllInvitations(): Promise<UserInvitation[]>;
  deleteInvitation(id: number): Promise<void>;

  // OTP management
  createOtp(otp: InsertOtp): Promise<OtpCode>;
  getValidOtp(email: string, code: string): Promise<OtpCode | undefined>;
  markOtpAsUsed(id: number): Promise<void>;

  // Category management
  getCategories(userId?: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // User category access management
  assignUserToCategory(userId: number, categoryId: number, assignedBy: number): Promise<UserCategoryAccess>;
  removeUserFromCategory(userId: number, categoryId: number): Promise<void>;
  getUserCategoryAccess(userId: number): Promise<UserCategoryAccess[]>;
  getCategoryUsers(categoryId: number): Promise<User[]>;

  // Video management
  getVideos(search?: string, categoryId?: number, userId?: number): Promise<VideoWithCategory[]>;
  getVideo(id: number): Promise<VideoWithCategory | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video>;
  deleteVideo(id: number): Promise<void>;
  incrementVideoViews(videoId: number, userId?: number, ipAddress?: string): Promise<void>;

  // Video completion tracking
  markVideoComplete(userId: number, videoId: number, watchTime: number): Promise<VideoCompletion>;
  markVideoIncomplete(userId: number, videoId: number): Promise<void>;
  getUserVideoCompletions(userId: number): Promise<VideoCompletion[]>;
  getCategoryProgress(userId: number, categoryId: number): Promise<{ completed: number; total: number }>;

  // Video bookmark management
  bookmarkVideo(userId: number, videoId: number): Promise<VideoBookmark>;
  removeBookmark(userId: number, videoId: number): Promise<void>;
  getUserBookmarks(userId: number): Promise<VideoBookmark[]>;

  // Watch history tracking
  recordWatchHistory(watchData: InsertWatchHistory): Promise<WatchHistory>;
  getUserWatchHistory(userId: number, limit?: number): Promise<WatchHistory[]>;
  
  // User session management
  startUserSession(sessionData: InsertUserSession): Promise<UserSession>;
  endUserSession(sessionId: number, totalWatchTime: number): Promise<void>;
  getUserSessions(userId: number): Promise<UserSession[]>;

  // User learning analytics
  getUserLearningStats(userId: number): Promise<UserLearningStats>;

  // App settings management
  getAppSettings(): Promise<AppSettings>;
  updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings>;

  // Admin stats
  getAdminStats(): Promise<AdminStats>;

  // Video rating management
  rateVideo(userId: number, videoId: number, rating: number, review?: string): Promise<VideoRating>;
  getUserVideoRating(userId: number, videoId: number): Promise<VideoRating | undefined>;

  // Video comment management
  getVideoComments(videoId: number): Promise<any[]>;
  createVideoComment(userId: number, videoId: number, content: string, parentId?: number): Promise<VideoComment>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async verifyUser(email: string): Promise<void> {
    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.email, email));
  }

  // Public user management
  async getPublicUser(id: number): Promise<PublicUser | undefined> {
    const [user] = await db.select().from(publicUsers).where(eq(publicUsers.id, id));
    return user || undefined;
  }

  async getPublicUserByEmail(email: string): Promise<PublicUser | undefined> {
    const [user] = await db.select().from(publicUsers).where(eq(publicUsers.email, email));
    return user || undefined;
  }

  async createPublicUser(insertUser: InsertPublicUser): Promise<PublicUser> {
    const [user] = await db
      .insert(publicUsers)
      .values(insertUser)
      .returning();
    return user;
  }

  async verifyPublicUser(email: string): Promise<void> {
    await db.update(publicUsers).set({ isVerified: true }).where(eq(publicUsers.email, email));
  }

  async getAllPublicUsers(): Promise<PublicUser[]> {
    return await db.select().from(publicUsers).orderBy(publicUsers.email);
  }

  async deletePublicUser(id: number): Promise<void> {
    await db.delete(publicUsers).where(eq(publicUsers.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.email);
  }

  async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async createOtp(insertOtp: InsertOtp): Promise<OtpCode> {
    const [otp] = await db
      .insert(otpCodes)
      .values(insertOtp)
      .returning();
    return otp;
  }

  async getValidOtp(email: string, code: string): Promise<OtpCode | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, code),
          eq(otpCodes.used, false),
          sql`${otpCodes.expiresAt} > NOW()`
        )
      );
    return otp || undefined;
  }

  async markOtpAsUsed(id: number): Promise<void> {
    await db
      .update(otpCodes)
      .set({ used: true })
      .where(eq(otpCodes.id, id));
  }

  async getCategories(userId?: number): Promise<Category[]> {
    if (!userId) {
      // Admin view - return all categories
      return await db.select().from(categories).orderBy(categories.name);
    }

    // Check if user is admin
    const user = await this.getUser(userId);
    if (user?.isAdmin) {
      return await db.select().from(categories).orderBy(categories.name);
    }

    // Check if user is a public user (only has access to "Other" category)
    const publicUser = await this.getPublicUser(userId);
    if (publicUser) {
      // Public users can only access "Other" category
      return await db.select().from(categories).where(eq(categories.slug, 'other')).orderBy(categories.name);
    }

    // Regular admin user - return assigned categories PLUS "Other" category
    const userCategories = await db
      .select({ category: categories })
      .from(categories)
      .innerJoin(userCategoryAccess, eq(categories.id, userCategoryAccess.categoryId))
      .where(eq(userCategoryAccess.userId, userId))
      .orderBy(categories.name);
    
    // Get the "Other" category
    const otherCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'other'))
      .limit(1);
    
    const assignedCategories = userCategories.map(row => row.category);
    
    // Add "Other" category if it exists and isn't already in assigned categories
    if (otherCategory.length > 0) {
      const otherCat = otherCategory[0];
      const alreadyAssigned = assignedCategories.some(cat => cat.id === otherCat.id);
      if (!alreadyAssigned) {
        assignedCategories.push(otherCat);
      }
    }
    
    return assignedCategories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updateData as any)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async getVideos(search?: string, categoryId?: number, userId?: number): Promise<VideoWithCategory[]> {
    // Get basic video data with category info
    let baseQuery = db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        youtubeId: videos.youtubeId,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
        categoryId: videos.categoryId,
        tags: videos.tags,
        views: videos.views,
        isPublic: videos.isPublic,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        category: categories,
      })
      .from(videos)
      .leftJoin(categories, eq(videos.categoryId, categories.id));

    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(videos.title, `%${search}%`),
          ilike(videos.description, `%${search}%`),
          sql`${videos.tags}::text ILIKE ${'%' + search + '%'}`
        )
      );
    }

    if (categoryId) {
      conditions.push(eq(videos.categoryId, categoryId));
    }

    // Add category access control for non-admin users
    if (userId) {
      const user = await this.getUser(userId);
      const publicUser = await this.getPublicUser(userId);
      
      if (publicUser) {
        // Public users can only access "Other" category videos
        const otherCategory = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, 'other'))
          .limit(1);
        
        if (otherCategory.length > 0) {
          conditions.push(eq(videos.categoryId, otherCategory[0].id));
        } else {
          // If no "Other" category exists, show no videos
          conditions.push(sql`FALSE`);
        }
      } else if (user && !user.isAdmin) {
        // Regular admin users - get assigned categories
        const userCategories = await db
          .select({ categoryId: userCategoryAccess.categoryId })
          .from(userCategoryAccess)
          .where(eq(userCategoryAccess.userId, userId));
        
        // Get "Other" category ID
        const otherCategory = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, 'other'))
          .limit(1);
        
        const allowedCategoryIds = userCategories.map(row => row.categoryId);
        if (otherCategory.length > 0) {
          allowedCategoryIds.push(otherCategory[0].id);
        }
        
        // Only show videos from allowed categories
        if (allowedCategoryIds.length > 0) {
          conditions.push(
            or(...allowedCategoryIds.map(id => eq(videos.categoryId, id)))
          );
        } else {
          // If no categories assigned, only show "Other" category videos
          if (otherCategory.length > 0) {
            conditions.push(eq(videos.categoryId, otherCategory[0].id));
          } else {
            // If no "Other" category exists, show no videos
            conditions.push(sql`FALSE`);
          }
        }
      }
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }

    const baseResult = await baseQuery.orderBy(desc(videos.createdAt));
    
    // Add basic stats for now - will enhance with rating/comment data later
    return baseResult.map(video => ({
      ...video,
      viewCount: 0,
      isCompleted: false,
      averageRating: 4.5, // Mock data for now
      totalRatings: 10, // Mock data for now
      userRating: undefined,
      commentsCount: 3, // Mock data for now
    }));
  }

  async getVideo(id: number): Promise<VideoWithCategory | undefined> {
    const [result] = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        youtubeId: videos.youtubeId,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
        categoryId: videos.categoryId,
        tags: videos.tags,
        views: videos.views,
        isPublic: videos.isPublic,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        category: categories,
        viewCount: sql<number>`COUNT(${videoViews.id})::int`.as('viewCount'),
      })
      .from(videos)
      .leftJoin(categories, eq(videos.categoryId, categories.id))
      .leftJoin(videoViews, eq(videos.id, videoViews.videoId))
      .where(eq(videos.id, id))
      .groupBy(videos.id, categories.id);

    if (!result) return undefined;

    return {
      ...result,
      viewCount: result.viewCount || 0,
    };
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values(insertVideo as any)
      .returning();
    return video;
  }

  async updateVideo(id: number, updateData: Partial<InsertVideo>): Promise<Video> {
    const [video] = await db
      .update(videos)
      .set({ ...updateData, updatedAt: sql`NOW()` } as any)
      .where(eq(videos.id, id))
      .returning();
    return video;
  }

  async deleteVideo(id: number): Promise<void> {
    // Delete all related records first to avoid foreign key constraint violations
    await db.delete(videoBookmarks).where(eq(videoBookmarks.videoId, id));
    await db.delete(videoCompletions).where(eq(videoCompletions.videoId, id));
    await db.delete(videoViews).where(eq(videoViews.videoId, id));
    await db.delete(watchHistory).where(eq(watchHistory.videoId, id));
    await db.delete(videoRatings).where(eq(videoRatings.videoId, id));
    await db.delete(videoComments).where(eq(videoComments.videoId, id));
    
    // Now delete the video itself
    await db.delete(videos).where(eq(videos.id, id));
  }

  async deleteCategory(id: number): Promise<void> {
    // First remove all user access assignments for this category
    await db.delete(userCategoryAccess).where(eq(userCategoryAccess.categoryId, id));
    // Then delete the category
    await db.delete(categories).where(eq(categories.id, id));
  }

  // User category access management methods
  async assignUserToCategory(userId: number, categoryId: number, assignedBy: number): Promise<UserCategoryAccess> {
    // Check if assignment already exists
    const [existing] = await db
      .select()
      .from(userCategoryAccess)
      .where(and(
        eq(userCategoryAccess.userId, userId),
        eq(userCategoryAccess.categoryId, categoryId)
      ));

    if (existing) {
      return existing;
    }

    const [access] = await db
      .insert(userCategoryAccess)
      .values({
        userId,
        categoryId,
        assignedBy,
      })
      .returning();
    return access;
  }

  async removeUserFromCategory(userId: number, categoryId: number): Promise<void> {
    await db
      .delete(userCategoryAccess)
      .where(and(
        eq(userCategoryAccess.userId, userId),
        eq(userCategoryAccess.categoryId, categoryId)
      ));
  }

  async getUserCategoryAccess(userId: number): Promise<UserCategoryAccess[]> {
    return await db
      .select()
      .from(userCategoryAccess)
      .where(eq(userCategoryAccess.userId, userId))
      .orderBy(userCategoryAccess.createdAt);
  }

  async getCategoryUsers(categoryId: number): Promise<User[]> {
    const categoryUsers = await db
      .select({ user: users })
      .from(users)
      .innerJoin(userCategoryAccess, eq(users.id, userCategoryAccess.userId))
      .where(eq(userCategoryAccess.categoryId, categoryId))
      .orderBy(users.username);
    
    return categoryUsers.map(row => row.user);
  }

  async incrementVideoViews(videoId: number, userId?: number, ipAddress?: string): Promise<void> {
    // Insert view record
    await db.insert(videoViews).values({
      videoId,
      userId,
      ipAddress,
    });

    // Update video views counter
    await db
      .update(videos)
      .set({
        views: sql`${videos.views} + 1`,
      })
      .where(eq(videos.id, videoId));
  }

  async setUserPassword(userId: number, password: string): Promise<User> {
    // Hash the password before storing
    const { hashPassword } = await import("./auth");
    const hashedPassword = await hashPassword(password);
    
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createUserInvitation(invitation: InsertUserInvitation & { invitedBy: number }): Promise<UserInvitation> {
    const [inv] = await db
      .insert(userInvitations)
      .values({
        ...invitation,
        inviteToken: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .returning();
    return inv;
  }

  async getUserInvitation(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(and(
        eq(userInvitations.inviteToken, token),
        sql`${userInvitations.expiresAt} > NOW()`,
        sql`${userInvitations.acceptedAt} IS NULL`
      ));
    return invitation || undefined;
  }

  async acceptUserInvitation(token: string, userData: { username: string; fullName: string; password: string }): Promise<User> {
    const invitation = await this.getUserInvitation(token);
    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    // Hash the password before storing
    const { hashPassword } = await import("./auth");
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        email: invitation.email,
        password: hashedPassword,
        fullName: userData.fullName,
        role: invitation.role,
        isAdmin: invitation.role === 'admin',
        isVerified: true,
        invitedBy: invitation.invitedBy,
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.id, invitation.id));

    return user;
  }

  async getAllInvitations(): Promise<UserInvitation[]> {
    // Only return pending invitations (not accepted and not expired)
    return await db
      .select()
      .from(userInvitations)
      .where(and(
        sql`${userInvitations.acceptedAt} IS NULL`,
        sql`${userInvitations.expiresAt} > NOW()`
      ))
      .orderBy(desc(userInvitations.createdAt));
  }

  async getAllInvitationsHistory(): Promise<UserInvitation[]> {
    // Return all invitations for admin history view
    return await db
      .select()
      .from(userInvitations)
      .orderBy(desc(userInvitations.createdAt));
  }

  async deleteInvitation(id: number): Promise<void> {
    await db.delete(userInvitations).where(eq(userInvitations.id, id));
  }

  async getAppSettings(): Promise<AppSettings> {
    const [settings] = await db.select().from(appSettings).limit(1);
    if (!settings) {
      // Create default settings
      const [defaultSettings] = await db
        .insert(appSettings)
        .values({
          appName: "Zmartclass",
          primaryColor: "#3b82f6",
          secondaryColor: "#1f2937",
          bannerImages: [],
          heroTitle: "Transform Your Learning Journey",
          heroSubtitle: "Join thousands of students advancing their careers with our expert-led courses",
          heroButtonText: "Get Started Today",
          statsTitle: "Trusted by Students Worldwide",
          stat1Label: "Active Students",
          stat1Value: "10,000+",
          stat2Label: "Courses",
          stat2Value: "50+",
          stat3Label: "Video Lessons",
          stat3Value: "500+",
          stat4Label: "Success Rate",
          stat4Value: "95%",
          aboutTitle: "About Zmartclass",
          aboutDescription: "We're dedicated to making quality education accessible to everyone. Our platform combines cutting-edge technology with expert instruction to deliver exceptional learning experiences.",
          featuresTitle: "Why Choose Zmartclass?",
          feature1Title: "Expert-Led Courses",
          feature1Description: "Learn from industry professionals with real-world experience",
          feature2Title: "Practical Learning",
          feature2Description: "Hands-on projects and real case studies to build your portfolio",
          feature3Title: "Fast-Track Progress",
          feature3Description: "Accelerated learning paths designed for busy professionals",
          contactTitle: "Get In Touch",
          contactDescription: "Ready to start your learning journey? Contact us today!",
          contactEmail: "info@zmartclass.com",
          contactPhone: "+1 (555) 123-4567",
        })
        .returning();
      return defaultSettings;
    }
    return settings;
  }

  async updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings> {
    const [updated] = await db
      .update(appSettings)
      .set({ ...settings, updatedAt: new Date() })
      .returning();
    return updated;
  }

  async getAdminStats(): Promise<AdminStats> {
    const [videoStats] = await db
      .select({
        totalVideos: sql<number>`COUNT(*)::int`,
      })
      .from(videos);

    const [userStats] = await db
      .select({
        totalUsers: sql<number>`COUNT(*)::int`,
      })
      .from(users)
      .where(eq(users.isVerified, true));

    const [viewStats] = await db
      .select({
        totalViews: sql<number>`COUNT(*)::int`,
      })
      .from(videoViews);

    // Get active user counts
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Since watchHistory might be empty initially, provide default values
    const dailyActiveUsers = [{ count: 0 }];
    const weeklyActiveUsers = [{ count: 0 }];
    const monthlyActiveUsers = [{ count: 0 }];
    const popularDevices: Array<{ deviceInfo: string; count: number }> = [];
    
    const recentSignups = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(users)
      .where(sql`${users.createdAt} >= ${monthAgo}`);

    return {
      totalVideos: videoStats?.totalVideos || 0,
      totalUsers: userStats?.totalUsers || 0,
      totalViews: viewStats?.totalViews || 0,
      totalWatchTime: "0h", 
      dailyActiveUsers: dailyActiveUsers[0]?.count || 0,
      weeklyActiveUsers: weeklyActiveUsers[0]?.count || 0,
      monthlyActiveUsers: monthlyActiveUsers[0]?.count || 0,
      popularDevices: popularDevices,
      recentSignups: recentSignups[0]?.count || 0,
    };
  }

  // Video completion tracking methods
  async markVideoComplete(userId: number, videoId: number, watchTime: number): Promise<VideoCompletion> {
    const [completion] = await db
      .insert(videoCompletions)
      .values({ userId, videoId, watchTime })
      .onConflictDoUpdate({
        target: [videoCompletions.userId, videoCompletions.videoId],
        set: {
          completedAt: sql`NOW()`,
          watchTime: watchTime,
        },
      })
      .returning();
    return completion;
  }

  async markVideoIncomplete(userId: number, videoId: number): Promise<void> {
    await db
      .delete(videoCompletions)
      .where(and(eq(videoCompletions.userId, userId), eq(videoCompletions.videoId, videoId)));
  }

  async getUserVideoCompletions(userId: number): Promise<VideoCompletion[]> {
    return await db
      .select({
        id: videoCompletions.id,
        userId: videoCompletions.userId,
        videoId: videoCompletions.videoId,
        completedAt: videoCompletions.completedAt,
        watchTime: videoCompletions.watchTime,
        video: {
          id: videos.id,
          title: videos.title,
          description: videos.description,
          thumbnailUrl: videos.thumbnailUrl,
          youtubeId: videos.youtubeId,
          duration: videos.duration,
          categoryId: videos.categoryId,
          isPublic: videos.isPublic,
          createdAt: videos.createdAt,
        },
      })
      .from(videoCompletions)
      .innerJoin(videos, eq(videoCompletions.videoId, videos.id))
      .where(eq(videoCompletions.userId, userId))
      .orderBy(desc(videoCompletions.completedAt));
  }

  async getCategoryProgress(userId: number, categoryId: number): Promise<{ completed: number; total: number }> {
    const totalVideos = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(videos)
      .where(eq(videos.categoryId, categoryId));

    const completedVideos = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(videos)
      .innerJoin(videoCompletions, eq(videos.id, videoCompletions.videoId))
      .where(and(eq(videos.categoryId, categoryId), eq(videoCompletions.userId, userId)));

    return {
      total: totalVideos[0]?.count || 0,
      completed: completedVideos[0]?.count || 0,
    };
  }

  // Video bookmark management methods
  async bookmarkVideo(userId: number, videoId: number): Promise<VideoBookmark> {
    const [bookmark] = await db
      .insert(videoBookmarks)
      .values({ userId, videoId })
      .onConflictDoNothing()
      .returning();
    return bookmark;
  }

  async removeBookmark(userId: number, videoId: number): Promise<void> {
    await db
      .delete(videoBookmarks)
      .where(and(eq(videoBookmarks.userId, userId), eq(videoBookmarks.videoId, videoId)));
  }

  async getUserBookmarks(userId: number): Promise<VideoBookmark[]> {
    return await db
      .select({
        id: videoBookmarks.id,
        userId: videoBookmarks.userId,
        videoId: videoBookmarks.videoId,
        bookmarkedAt: videoBookmarks.bookmarkedAt,
        video: {
          id: videos.id,
          title: videos.title,
          description: videos.description,
          thumbnailUrl: videos.thumbnailUrl,
          youtubeId: videos.youtubeId,
          duration: videos.duration,
          categoryId: videos.categoryId,
          isPublic: videos.isPublic,
          createdAt: videos.createdAt,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
        },
      })
      .from(videoBookmarks)
      .innerJoin(videos, eq(videoBookmarks.videoId, videos.id))
      .leftJoin(categories, eq(videos.categoryId, categories.id))
      .where(eq(videoBookmarks.userId, userId))
      .orderBy(desc(videoBookmarks.bookmarkedAt));
  }

  // Watch history tracking methods
  async recordWatchHistory(watchData: InsertWatchHistory): Promise<WatchHistory> {
    const [history] = await db
      .insert(watchHistory)
      .values(watchData)
      .returning();
    return history;
  }

  async getUserWatchHistory(userId: number, limit: number = 50): Promise<WatchHistory[]> {
    return await db
      .select({
        id: watchHistory.id,
        userId: watchHistory.userId,
        videoId: watchHistory.videoId,
        watchDuration: watchHistory.watchDuration,
        progressPercentage: watchHistory.progressPercentage,
        deviceInfo: watchHistory.deviceInfo,
        ipAddress: watchHistory.ipAddress,
        watchedAt: watchHistory.watchedAt,
        video: {
          id: videos.id,
          title: videos.title,
          description: videos.description,
          thumbnailUrl: videos.thumbnailUrl,
          youtubeId: videos.youtubeId,
          duration: videos.duration,
          categoryId: videos.categoryId,
          isPublic: videos.isPublic,
          createdAt: videos.createdAt,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            description: categories.description,
            coverImage: categories.coverImage,
            createdAt: categories.createdAt,
          },
        },
      })
      .from(watchHistory)
      .innerJoin(videos, eq(watchHistory.videoId, videos.id))
      .leftJoin(categories, eq(videos.categoryId, categories.id))
      .where(eq(watchHistory.userId, userId))
      .orderBy(desc(watchHistory.watchedAt))
      .limit(limit) as any;
  }

  // User session management methods
  async startUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async endUserSession(sessionId: number, totalWatchTime: number): Promise<void> {
    await db
      .update(userSessions)
      .set({ 
        sessionEnd: new Date(),
        totalWatchTime 
      })
      .where(eq(userSessions.id, sessionId));
  }

  async getUserSessions(userId: number): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.sessionStart));
  }

  // User learning analytics method
  async getUserLearningStats(userId: number): Promise<UserLearningStats> {
    // Get total videos watched (unique videos from watch history)
    const uniqueVideosWatched = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${watchHistory.videoId})::int` })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));

    // Get total watch time
    const totalWatchTimeQuery = await db
      .select({ total: sql<number>`COALESCE(SUM(${watchHistory.watchDuration}), 0)::int` })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));

    // Get completed videos count
    const completedVideosCount = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(videoCompletions)
      .where(eq(videoCompletions.userId, userId));

    // Get bookmarked videos count
    const bookmarkedVideosCount = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(videoBookmarks)
      .where(eq(videoBookmarks.userId, userId));

    // Get last active date
    const lastActiveQuery = await db
      .select({ lastActive: sql<Date>`MAX(${watchHistory.watchedAt})` })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));

    // Get category progress
    const categoryProgressQuery = await db
      .select({
        categoryId: videos.categoryId,
        categoryName: categories.name,
        totalVideos: sql<number>`COUNT(DISTINCT ${videos.id})::int`,
        completedVideos: sql<number>`COUNT(DISTINCT ${videoCompletions.videoId})::int`,
      })
      .from(videos)
      .leftJoin(categories, eq(videos.categoryId, categories.id))
      .leftJoin(videoCompletions, and(
        eq(videos.id, videoCompletions.videoId),
        eq(videoCompletions.userId, userId)
      ))
      .where(isNotNull(videos.categoryId))
      .groupBy(videos.categoryId, categories.name);

    return {
      totalVideosWatched: uniqueVideosWatched[0]?.count || 0,
      totalWatchTime: totalWatchTimeQuery[0]?.total || 0,
      completedVideos: completedVideosCount[0]?.count || 0,
      bookmarkedVideos: bookmarkedVideosCount[0]?.count || 0,
      currentStreak: 0, // TODO: Implement streak calculation
      lastActiveDate: lastActiveQuery[0]?.lastActive || null,
      preferredDevice: null, // TODO: Implement based on session data
      categoriesProgress: categoryProgressQuery.map(row => ({
        categoryId: row.categoryId!,
        categoryName: row.categoryName || 'Unknown',
        completed: row.completedVideos,
        total: row.totalVideos,
        percentage: row.totalVideos > 0 ? Math.round((row.completedVideos / row.totalVideos) * 100) : 0,
      })),
    };
  }
  async rateVideo(userId: number, videoId: number, rating: number, review?: string): Promise<VideoRating> {
    const [existingRating] = await db
      .select()
      .from(videoRatings)
      .where(and(eq(videoRatings.userId, userId), eq(videoRatings.videoId, videoId)));

    if (existingRating) {
      const [updatedRating] = await db
        .update(videoRatings)
        .set({ rating, review, updatedAt: new Date() })
        .where(and(eq(videoRatings.userId, userId), eq(videoRatings.videoId, videoId)))
        .returning();
      return updatedRating;
    } else {
      const [newRating] = await db
        .insert(videoRatings)
        .values({ userId, videoId, rating, review })
        .returning();
      return newRating;
    }
  }

  async getUserVideoRating(userId: number, videoId: number): Promise<VideoRating | undefined> {
    const [rating] = await db
      .select()
      .from(videoRatings)
      .where(and(eq(videoRatings.userId, userId), eq(videoRatings.videoId, videoId)));
    return rating || undefined;
  }

  async getVideoComments(videoId: number): Promise<any[]> {
    const comments = await db
      .select({
        id: videoComments.id,
        content: videoComments.content,
        createdAt: videoComments.createdAt,
        parentId: videoComments.parentId,
        user: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
        },
      })
      .from(videoComments)
      .innerJoin(users, eq(videoComments.userId, users.id))
      .where(eq(videoComments.videoId, videoId))
      .orderBy(desc(videoComments.createdAt));

    // Organize comments with replies
    const commentMap = new Map();
    const rootComments = [];

    for (const comment of comments) {
      comment.replies = [];
      commentMap.set(comment.id, comment);
      
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    }

    return rootComments;
  }

  async createVideoComment(userId: number, videoId: number, content: string, parentId?: number): Promise<VideoComment> {
    const [comment] = await db
      .insert(videoComments)
      .values({ userId, videoId, content, parentId })
      .returning();
    return comment;
  }
}

export const storage = new DatabaseStorage();
