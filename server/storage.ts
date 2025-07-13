import { users, videos, categories, courses, otpCodes, type User, type InsertUser, type Video, type InsertVideo, type Category, type InsertCategory, type Course, type InsertCourse, type OtpCode, type InsertOtp, type CategoryWithCourses, type CourseWithVideos } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike, count, sum, asc, avg, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(email: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // OTP management
  createOtp(otp: InsertOtp): Promise<OtpCode>;
  getValidOtp(email: string, code: string): Promise<OtpCode | undefined>;
  markOtpAsUsed(id: number): Promise<void>;

  // Category management
  getCategories(): Promise<CategoryWithCourses[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Course management
  getCoursesByCategory(categoryId: number): Promise<CourseWithVideos[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  deleteCourse(id: number): Promise<void>;

  // Video management
  getVideosByCourse(courseId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  deleteVideo(id: number): Promise<void>;

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

  async getCategories(): Promise<CategoryWithCourses[]> {
    const results = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        createdAt: categories.createdAt,
        courses: sql<Course[]>`JSON_AGG(
          CASE 
            WHEN ${courses.id} IS NOT NULL 
            THEN JSON_BUILD_OBJECT(
              'id', ${courses.id},
              'title', ${courses.title},
              'description', ${courses.description},
              'categoryId', ${courses.categoryId},
              'createdAt', ${courses.createdAt}
            )
            ELSE NULL
          END
        )`.as('courses')
      })
      .from(categories)
      .leftJoin(courses, eq(categories.id, courses.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.name);

    return results.map(row => ({
      ...row,
      courses: row.courses?.filter(course => course !== null) || []
    }));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getCoursesByCategory(categoryId: number): Promise<CourseWithVideos[]> {
    const results = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        categoryId: courses.categoryId,
        createdAt: courses.createdAt,
        category: categories,
        videos: sql<Video[]>`JSON_AGG(
          CASE 
            WHEN ${videos.id} IS NOT NULL 
            THEN JSON_BUILD_OBJECT(
              'id', ${videos.id},
              'title', ${videos.title},
              'description', ${videos.description},
              'youtubeId', ${videos.youtubeId},
              'courseId', ${videos.courseId},
              'orderIndex', ${videos.orderIndex},
              'createdAt', ${videos.createdAt}
            )
            ELSE NULL
          END
          ORDER BY ${videos.orderIndex}
        )`.as('videos')
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(videos, eq(courses.id, videos.courseId))
      .where(eq(courses.categoryId, categoryId))
      .groupBy(courses.id, categories.id)
      .orderBy(courses.title);

    return results.map(row => ({
      ...row,
      videos: row.videos?.filter(video => video !== null) || []
    }));
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getVideosByCourse(courseId: number): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.courseId, courseId))
      .orderBy(videos.orderIndex);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values(insertVideo)
      .returning();
    return video;
  }

  async deleteVideo(id: number): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }
}

export const storage = new DatabaseStorage();