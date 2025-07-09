import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
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

export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  photo: text("photo"),
  backgroundImage: text("background_image"),
  profession: text("profession").notNull(),
  experience: text("experience").notNull(),
  bio: text("bio"),
  location: text("location"),
  skills: text("skills").array(),
  openToOpportunities: text("open_to_opportunities").array(),
  isActive: boolean("is_active").default(false).notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mentor profile sections
export const mentorSections = pgTable("mentor_sections", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => mentors.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // about, experience, education, certifications, projects
  title: text("title"),
  description: text("description"),
  company: text("company"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isCurrent: boolean("is_current").default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mentor resources
export const mentorResources = pgTable("mentor_resources", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => mentors.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // video, document, link, download
  url: text("url"),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  duration: text("duration"),
  category: text("category"), // learning, tools, external
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mentorCredentials = pgTable("mentor_credentials", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => mentors.id, { onDelete: "cascade" }),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mentorInvitations = pgTable("mentor_invitations", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => mentors.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videoProgress = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  currentTimeSeconds: integer("current_time_seconds").notNull().default(0), // in seconds
  durationSeconds: integer("duration_seconds").notNull().default(0), // in seconds
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  lastWatchedAt: timestamp("last_watched_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserVideo: unique("unique_user_video").on(table.userId, table.videoId),
}));

export const videoBookmarks = pgTable("video_bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  timestampSeconds: integer("timestamp_seconds").notNull().default(0), // in seconds
  note: text("note"), // optional user note for the bookmark
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserVideoTimestamp: unique("unique_user_video_timestamp").on(table.userId, table.videoId, table.timestampSeconds),
}));

export const userWatchlist = pgTable("user_watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserVideo: unique("unique_user_video_watchlist").on(table.userId, table.videoId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videoViews: many(videoViews),
  videoProgress: many(videoProgress),
  videoBookmarks: many(videoBookmarks),
  watchlist: many(userWatchlist),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  category: one(categories, {
    fields: [videos.categoryId],
    references: [categories.id],
  }),
  views: many(videoViews),
  progress: many(videoProgress),
  bookmarks: many(videoBookmarks),
  watchlistEntries: many(userWatchlist),
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

export const mentorsRelations = relations(mentors, ({ one, many }) => ({
  credentials: one(mentorCredentials),
  invitations: many(mentorInvitations),
  sections: many(mentorSections),
  resources: many(mentorResources),
}));

export const mentorSectionsRelations = relations(mentorSections, ({ one }) => ({
  mentor: one(mentors, { fields: [mentorSections.mentorId], references: [mentors.id] }),
}));

export const mentorResourcesRelations = relations(mentorResources, ({ one }) => ({
  mentor: one(mentors, { fields: [mentorResources.mentorId], references: [mentors.id] }),
}));

export const mentorCredentialsRelations = relations(mentorCredentials, ({ one }) => ({
  mentor: one(mentors, { fields: [mentorCredentials.mentorId], references: [mentors.id] }),
}));

export const mentorInvitationsRelations = relations(mentorInvitations, ({ one }) => ({
  mentor: one(mentors, { fields: [mentorInvitations.mentorId], references: [mentors.id] }),
}));

export const videoProgressRelations = relations(videoProgress, ({ one }) => ({
  user: one(users, {
    fields: [videoProgress.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [videoProgress.videoId],
    references: [videos.id],
  }),
}));

export const videoBookmarksRelations = relations(videoBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [videoBookmarks.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [videoBookmarks.videoId],
    references: [videos.id],
  }),
}));

export const userWatchlistRelations = relations(userWatchlist, ({ one }) => ({
  user: one(users, {
    fields: [userWatchlist.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [userWatchlist.videoId],
    references: [videos.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
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

export const insertMentorSchema = createInsertSchema(mentors).pick({
  name: true,
  email: true,
  photo: true,
  backgroundImage: true,
  profession: true,
  experience: true,
  bio: true,
  location: true,
  skills: true,
  openToOpportunities: true,
  isActive: true,
});

export const insertMentorSectionSchema = createInsertSchema(mentorSections).pick({
  mentorId: true,
  type: true,
  title: true,
  description: true,
  company: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  orderIndex: true,
});

export const insertMentorResourceSchema = createInsertSchema(mentorResources).pick({
  mentorId: true,
  title: true,
  description: true,
  type: true,
  url: true,
  filePath: true,
  fileSize: true,
  duration: true,
  category: true,
  isActive: true,
});

export const insertMentorCredentialsSchema = createInsertSchema(mentorCredentials).pick({
  mentorId: true,
  password: true,
});

export const insertMentorInvitationSchema = createInsertSchema(mentorInvitations).pick({
  mentorId: true,
  token: true,
  expiresAt: true,
});

export const insertVideoProgressSchema = createInsertSchema(videoProgress).pick({
  userId: true,
  videoId: true,
  currentTimeSeconds: true,
  durationSeconds: true,
  isCompleted: true,
  completedAt: true,
});

export const insertVideoBookmarkSchema = createInsertSchema(videoBookmarks).pick({
  userId: true,
  videoId: true,
  timestampSeconds: true,
  note: true,
});

export const insertUserWatchlistSchema = createInsertSchema(userWatchlist).pick({
  userId: true,
  videoId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type VideoView = typeof videoViews.$inferSelect;
export type InsertVideoView = z.infer<typeof insertVideoViewSchema>;
export type Mentor = typeof mentors.$inferSelect;
export type InsertMentor = z.infer<typeof insertMentorSchema>;
export type MentorCredentials = typeof mentorCredentials.$inferSelect;
export type InsertMentorCredentials = z.infer<typeof insertMentorCredentialsSchema>;
export type MentorInvitation = typeof mentorInvitations.$inferSelect;
export type InsertMentorInvitation = z.infer<typeof insertMentorInvitationSchema>;
export type MentorSection = typeof mentorSections.$inferSelect;
export type InsertMentorSection = z.infer<typeof insertMentorSectionSchema>;
export type MentorResource = typeof mentorResources.$inferSelect;
export type InsertMentorResource = z.infer<typeof insertMentorResourceSchema>;
export type VideoProgress = typeof videoProgress.$inferSelect;
export type InsertVideoProgress = z.infer<typeof insertVideoProgressSchema>;
export type VideoBookmark = typeof videoBookmarks.$inferSelect;
export type InsertVideoBookmark = z.infer<typeof insertVideoBookmarkSchema>;
export type UserWatchlist = typeof userWatchlist.$inferSelect;
export type InsertUserWatchlist = z.infer<typeof insertUserWatchlistSchema>;

// Extended types for API responses
export type VideoWithCategory = Video & {
  category: Category | null;
  viewCount: number;
};

export type MentorWithStats = Mentor & {
  hasCredentials: boolean;
  pendingInvitations: number;
};

export type AdminStats = {
  totalVideos: number;
  totalUsers: number;
  totalViews: number;
  totalMentors: number;
  activeMentors: number;
  totalWatchTime: string;
};
