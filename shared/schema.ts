import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"), // 'admin', 'student'
  isAdmin: boolean("is_admin").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  invitedBy: integer("invited_by").references(() => users.id),
  inviteToken: text("invite_token"),
  inviteExpiry: timestamp("invite_expiry"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  mentorName: text("mentor_name"),
  description: text("description"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeId: text("youtube_id").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: text("duration"),
  categoryId: integer("category_id").references(() => categories.id),
  tags: jsonb("tags").$type<string[]>().default([]),
  views: integer("views").default(0).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoViews = pgTable("video_views", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// App settings for customization
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  appName: text("app_name").notNull().default("VideoLearn Pro"),
  appLogo: text("app_logo"),
  primaryColor: text("primary_color").notNull().default("#3b82f6"),
  secondaryColor: text("secondary_color").notNull().default("#1f2937"),
  bannerImages: jsonb("banner_images").$type<string[]>().default([]),
  footerText: text("footer_text"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User invitations
export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull().default("student"),
  inviteToken: text("invite_token").notNull().unique(),
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User category access control
export const userCategoryAccess = pgTable("user_category_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Video completion tracking for LMS functionality
export const videoCompletions = pgTable("video_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  watchTime: integer("watch_time").notNull().default(0), // in seconds
}, (table) => ({
  uniqueUserVideo: unique().on(table.userId, table.videoId),
}));

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  videoViews: many(videoViews),
  videoCompletions: many(videoCompletions),
  invitedUsers: many(userInvitations, { foreignKey: userInvitations.invitedBy }),
  categoryAccess: many(userCategoryAccess, { foreignKey: userCategoryAccess.userId }),
  invitedBy: one(users, {
    fields: [users.invitedBy],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  videos: many(videos),
  userAccess: many(userCategoryAccess, { foreignKey: userCategoryAccess.categoryId }),
}));

export const userCategoryAccessRelations = relations(userCategoryAccess, ({ one }) => ({
  user: one(users, {
    fields: [userCategoryAccess.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [userCategoryAccess.categoryId],
    references: [categories.id],
  }),
  assignedBy: one(users, {
    fields: [userCategoryAccess.assignedBy],
    references: [users.id],
  }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  category: one(categories, {
    fields: [videos.categoryId],
    references: [categories.id],
  }),
  views: many(videoViews),
  completions: many(videoCompletions),
}));

export const videoViewsRelations = relations(videoViews, ({ one }) => ({
  video: one(videos, {
    fields: [videoViews.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoViews.userId],
    references: [users.id],
  }),
}));

export const videoCompletionsRelations = relations(videoCompletions, ({ one }) => ({
  video: one(videos, {
    fields: [videoCompletions.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoCompletions.userId],
    references: [users.id],
  }),
}));

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  invitedBy: one(users, {
    fields: [userInvitations.invitedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
});

export const insertUserInvitationSchema = createInsertSchema(userInvitations).pick({
  email: true,
  role: true,
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).pick({
  appName: true,
  appLogo: true,
  primaryColor: true,
  secondaryColor: true,
  bannerImages: true,
  footerText: true,
});

export const insertOtpSchema = createInsertSchema(otpCodes).pick({
  email: true,
  code: true,
  expiresAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  mentorName: true,
  description: true,
  coverImage: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  youtubeId: true,
  thumbnailUrl: true,
  duration: true,
  categoryId: true,
  tags: true,
  isPublic: true,
});

export const insertVideoViewSchema = createInsertSchema(videoViews).pick({
  videoId: true,
  userId: true,
  ipAddress: true,
});

export const insertUserCategoryAccessSchema = createInsertSchema(userCategoryAccess).pick({
  userId: true,
  categoryId: true,
});

export const insertVideoCompletionSchema = createInsertSchema(videoCompletions).pick({
  userId: true,
  videoId: true,
  watchTime: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = User;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type VideoView = typeof videoViews.$inferSelect;
export type InsertVideoView = z.infer<typeof insertVideoViewSchema>;
export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;
export type UserCategoryAccess = typeof userCategoryAccess.$inferSelect;
export type InsertUserCategoryAccess = z.infer<typeof insertUserCategoryAccessSchema>;
export type VideoCompletion = typeof videoCompletions.$inferSelect;
export type InsertVideoCompletion = z.infer<typeof insertVideoCompletionSchema>;

// Extended types for API responses
export type VideoWithCategory = Video & {
  category: Category | null;
  viewCount: number;
  isCompleted?: boolean;
};

export type AdminStats = {
  totalVideos: number;
  totalUsers: number;
  totalViews: number;
  totalWatchTime: string;
};
