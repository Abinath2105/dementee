import { users, videos, categories, otpCodes, videoViews, type User, type InsertUser, type Video, type InsertVideo, type Category, type InsertCategory, type OtpCode, type InsertOtp, type VideoWithCategory, type AdminStats } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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

  // OTP management
  createOtp(otp: InsertOtp): Promise<OtpCode>;
  getValidOtp(email: string, code: string): Promise<OtpCode | undefined>;
  markOtpAsUsed(id: number): Promise<void>;

  // Category management
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  // Video management
  getVideos(search?: string, categoryId?: number): Promise<VideoWithCategory[]>;
  getVideo(id: number): Promise<VideoWithCategory | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video>;
  deleteVideo(id: number): Promise<void>;
  incrementVideoViews(videoId: number, userId?: number, ipAddress?: string): Promise<void>;

  // Admin stats
  getAdminStats(): Promise<AdminStats>;

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

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
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

  async getVideos(search?: string, categoryId?: number): Promise<VideoWithCategory[]> {
    let query = db
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
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        category: categories,
        viewCount: sql<number>`COUNT(${videoViews.id})::int`.as('viewCount'),
      })
      .from(videos)
      .leftJoin(categories, eq(videos.categoryId, categories.id))
      .leftJoin(videoViews, eq(videos.id, videoViews.videoId))
      .groupBy(videos.id, categories.id);

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

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query.orderBy(desc(videos.createdAt));
    
    return result.map(row => ({
      ...row,
      viewCount: row.viewCount || 0,
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
    await db.delete(videos).where(eq(videos.id, id));
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

    return {
      totalVideos: videoStats?.totalVideos || 0,
      totalUsers: userStats?.totalUsers || 0,
      totalViews: viewStats?.totalViews || 0,
      totalWatchTime: "0h", // This would require duration calculation
    };
  }
}

export const storage = new DatabaseStorage();
