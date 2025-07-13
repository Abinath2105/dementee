import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core user table - simplified
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// For email verification
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories for organizing courses
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Courses under categories
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// YouTube videos under courses
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeId: text("youtube_id").notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  // No additional relations for now
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  course: one(courses, {
    fields: [videos.courseId],
    references: [courses.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  fullName: true,
  email: true,
  password: true,
});

export const insertOtpSchema = createInsertSchema(otpCodes).pick({
  email: true,
  code: true,
  expiresAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  categoryId: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  youtubeId: true,
  courseId: true,
  orderIndex: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

// Extended types for API responses
export type CategoryWithCourses = Category & {
  courses: Course[];
};

export type CourseWithVideos = Course & {
  videos: Video[];
  category: Category;
};

export type VideoWithCourse = Video & {
  course: Course & {
    category: Category;
  };
};
