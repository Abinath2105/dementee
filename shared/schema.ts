import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique, varchar, date, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  platformName: text("platform_name").notNull().default("De mentee Academy"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default("#2563eb"),
  secondaryColor: text("secondary_color").default("#64748b"),
  description: text("description").default("Transform Your Learning Journey"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  // Student profile fields
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  avatar: text("avatar"),
  location: text("location"),
  website: text("website"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  twitterUrl: text("twitter_url"),
  skills: text("skills").array(),
  interests: text("interests").array(),
  learningGoals: text("learning_goals").array(),
  experienceLevel: text("experience_level").default("beginner"),
  preferredTopics: text("preferred_topics").array(),
  studySchedule: text("study_schedule"),
  timezone: text("timezone"),
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

// LMS Tables
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  type: text("type").notNull().default("quiz"),
  difficultyLevel: text("difficulty_level").default("beginner"),
  points: integer("points").default(100),
  timeLimit: integer("time_limit"),
  dueDate: timestamp("due_date"),
  categoryId: integer("category_id").references(() => categories.id),
  createdBy: integer("created_by").references(() => users.id),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assignmentQuestions = pgTable("assignment_questions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"),
  options: jsonb("options"),
  correctAnswer: text("correct_answer"),
  points: integer("points").default(10),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(),
  score: integer("score"),
  maxScore: integer("max_score"),
  status: text("status").default("in_progress"),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  gradedAt: timestamp("graded_at"),
  feedback: text("feedback"),
  timeSpent: integer("time_spent").default(0),
}, (table) => ({
  userAssignmentUnique: unique().on(table.assignmentId, table.userId),
}));

export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  difficultyLevel: text("difficulty_level").default("beginner"),
  estimatedDuration: text("estimated_duration"),
  coverImage: text("cover_image"),
  isPublished: boolean("is_published").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const learningPathItems = pgTable("learning_path_items", {
  id: serial("id").primaryKey(),
  learningPathId: integer("learning_path_id").references(() => learningPaths.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  orderIndex: integer("order_index").default(0),
  isRequired: boolean("is_required").default(true),
  unlockAfter: integer("unlock_after"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userLearningPaths = pgTable("user_learning_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  learningPathId: integer("learning_path_id").references(() => learningPaths.id, { onDelete: "cascade" }),
  status: text("status").default("enrolled"),
  progressPercentage: integer("progress_percentage").default(0),
  currentItemId: integer("current_item_id").references(() => learningPathItems.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userPathUnique: unique().on(table.userId, table.learningPathId),
}));

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  badgeIcon: text("badge_icon"),
  badgeColor: text("badge_color").default("#3B82F6"),
  criteria: jsonb("criteria").notNull(),
  points: integer("points").default(50),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").references(() => achievements.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => ({
  userAchievementUnique: unique().on(table.userId, table.achievementId),
}));

export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(),
  itemId: integer("item_id"),
  duration: integer("duration").notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumTopics = pgTable("forum_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  createdBy: integer("created_by").references(() => users.id),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").references(() => forumTopics.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isSolution: boolean("is_solution").default(false),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"),
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Video Comments and Rating System
export const videoComments = pgTable("video_comments", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id").references(() => videoComments.id, { onDelete: "cascade" }), // For replies
  isEdited: boolean("is_edited").default(false).notNull(),
  likeCount: integer("like_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoRatings = pgTable("video_ratings", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserVideo: unique().on(table.userId, table.videoId), // One rating per user per video
}));

export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => videoComments.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserComment: unique().on(table.userId, table.commentId), // One like per user per comment
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videoViews: many(videoViews),
  videoProgress: many(videoProgress),
  videoBookmarks: many(videoBookmarks),
  watchlist: many(userWatchlist),
  comments: many(videoComments),
  ratings: many(videoRatings),
  commentLikes: many(commentLikes),
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
  comments: many(videoComments),
  ratings: many(videoRatings),
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

export const videoCommentsRelations = relations(videoComments, ({ one, many }) => ({
  video: one(videos, {
    fields: [videoComments.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoComments.userId],
    references: [users.id],
  }),
  parent: one(videoComments, {
    fields: [videoComments.parentId],
    references: [videoComments.id],
  }),
  replies: many(videoComments),
  likes: many(commentLikes),
}));

export const videoRatingsRelations = relations(videoRatings, ({ one }) => ({
  video: one(videos, {
    fields: [videoRatings.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoRatings.userId],
    references: [users.id],
  }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(videoComments, {
    fields: [commentLikes.commentId],
    references: [videoComments.id],
  }),
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  bio: true,
  avatar: true,
  location: true,
  website: true,
  linkedinUrl: true,
  githubUrl: true,
  twitterUrl: true,
  skills: true,
  interests: true,
  learningGoals: true,
  experienceLevel: true,
  preferredTopics: true,
  studySchedule: true,
  timezone: true,
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

export const insertVideoCommentSchema = createInsertSchema(videoComments).pick({
  videoId: true,
  userId: true,
  content: true,
  parentId: true,
});

export const insertVideoRatingSchema = createInsertSchema(videoRatings).pick({
  videoId: true,
  userId: true,
  rating: true,
});

export const insertCommentLikeSchema = createInsertSchema(commentLikes).pick({
  commentId: true,
  userId: true,
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).pick({
  platformName: true,
  logoUrl: true,
  faviconUrl: true,
  primaryColor: true,
  secondaryColor: true,
  description: true,
  updatedBy: true,
});

// Types
export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
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
export type VideoComment = typeof videoComments.$inferSelect;
export type InsertVideoComment = z.infer<typeof insertVideoCommentSchema>;
export type VideoRating = typeof videoRatings.$inferSelect;
export type InsertVideoRating = z.infer<typeof insertVideoRatingSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;

// Extended types for API responses
export type VideoWithCategory = Video & {
  category: Category | null;
  viewCount: number;
  averageRating?: number;
  totalRatings?: number;
  commentsCount?: number;
};

export type VideoCommentWithUser = VideoComment & {
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  replies?: VideoCommentWithUser[];
  userLiked?: boolean;
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

// LMS Types
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;
export type AssignmentQuestion = typeof assignmentQuestions.$inferSelect;
export type InsertAssignmentQuestion = typeof assignmentQuestions.$inferInsert;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = typeof assignmentSubmissions.$inferInsert;
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = typeof learningPaths.$inferInsert;
export type LearningPathItem = typeof learningPathItems.$inferSelect;
export type InsertLearningPathItem = typeof learningPathItems.$inferInsert;
export type UserLearningPath = typeof userLearningPaths.$inferSelect;
export type InsertUserLearningPath = typeof userLearningPaths.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = typeof studySessions.$inferInsert;
export type ForumTopic = typeof forumTopics.$inferSelect;
export type InsertForumTopic = typeof forumTopics.$inferInsert;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Extended types with relations
export type AssignmentWithQuestions = Assignment & {
  questions: AssignmentQuestion[];
};

export type AssignmentSubmissionWithDetails = AssignmentSubmission & {
  assignment: Assignment;
  user: UserType;
};

export type LearningPathWithItems = LearningPath & {
  items: (LearningPathItem & { video?: Video; assignment?: Assignment })[];
  userProgress?: UserLearningPath;
};

export type ForumTopicWithPosts = ForumTopic & {
  posts: (ForumPost & { user: UserType })[];
  creator: UserType;
};

export type UserProgress = {
  totalPoints: number;
  completedAssignments: number;
  completedVideos: number;
  studyTimeMinutes: number;
  achievements: UserAchievement[];
  currentStreak: number;
  level: number;
};

// Student Admission System Tables
export const studentApplications = pgTable("student_applications", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  countryCode: varchar("country_code", { length: 5 }).notNull().default("+91"),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: varchar("gender", { length: 10 }).notNull(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  permanentAddress: text("permanent_address").notNull(),
  communicationAddress: text("communication_address"),
  preferredCourse: varchar("preferred_course", { length: 255 }).notNull(),
  preferredBatch: varchar("preferred_batch", { length: 50 }).notNull(), // Morning/Evening/Weekend
  preferredTime: varchar("preferred_time", { length: 100 }),
  learningMode: varchar("learning_mode", { length: 20 }).notNull(), // Online/Offline/Hybrid
  educationQualification: text("education_qualification").notNull(),
  hearAboutUs: varchar("hear_about_us", { length: 100 }).notNull(),
  applicationStatus: varchar("application_status", { length: 20 }).notNull().default("pending"), // pending/approved/rejected/documents_pending/payment_pending
  studentId: varchar("student_id", { length: 20 }),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applicationDocuments = pgTable("application_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => studentApplications.id, { onDelete: "cascade" }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(), // photo/id_proof/other
  documentName: varchar("document_name", { length: 255 }).notNull(),
  documentUrl: text("document_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  totalFee: decimal("total_fee", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feePayments = pgTable("fee_payments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => studentApplications.id, { onDelete: "cascade" }).notNull(),
  feeStructureId: integer("fee_structure_id").references(() => feeStructures.id),
  feePlan: varchar("fee_plan", { length: 20 }).notNull(), // one-time/installment/scholarship
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }),
  paymentMethod: varchar("payment_method", { length: 50 }), // UPI/Card/Bank Transfer
  paymentDate: timestamp("payment_date"),
  receiptUrl: text("receipt_url"),
  invoiceUrl: text("invoice_url"),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"), // pending/paid/partial/overdue
  nextDueDate: date("next_due_date"),
  emiBalance: decimal("emi_balance", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studentBatches = pgTable("student_batches", {
  id: serial("id").primaryKey(),
  batchName: varchar("batch_name", { length: 255 }).notNull(),
  course: varchar("course", { length: 255 }).notNull(),
  timing: varchar("timing", { length: 100 }).notNull(),
  mode: varchar("mode", { length: 20 }).notNull(), // Online/Offline/Hybrid
  mentorId: integer("mentor_id").references(() => mentors.id),
  maxStudents: integer("max_students").default(30),
  currentStudents: integer("current_students").default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studentBatchAssignments = pgTable("student_batch_assignments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => studentApplications.id, { onDelete: "cascade" }).notNull(),
  batchId: integer("batch_id").references(() => studentBatches.id, { onDelete: "cascade" }).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active/completed/dropped
});

export const orientationSessions = pgTable("orientation_sessions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sessionDate: timestamp("session_date").notNull(),
  duration: integer("duration_minutes").default(60),
  mode: varchar("mode", { length: 20 }).notNull(), // Online/Offline
  meetingLink: text("meeting_link"),
  venue: text("venue"),
  conductorName: varchar("conductor_name", { length: 255 }),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orientationRegistrations = pgTable("orientation_registrations", {
  id: serial("id").primaryKey(),
  orientationId: integer("orientation_id").references(() => orientationSessions.id, { onDelete: "cascade" }).notNull(),
  applicationId: integer("application_id").references(() => studentApplications.id, { onDelete: "cascade" }).notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  attended: boolean("attended").default(false),
  feedback: text("feedback"),
});

// Zod schemas for Student Admission
export const insertStudentApplicationSchema = createInsertSchema(studentApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationDocumentSchema = createInsertSchema(applicationDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeePaymentSchema = createInsertSchema(feePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentBatchSchema = createInsertSchema(studentBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrientationSessionSchema = createInsertSchema(orientationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Student Admission
export type StudentApplication = typeof studentApplications.$inferSelect;
export type InsertStudentApplication = z.infer<typeof insertStudentApplicationSchema>;
export type ApplicationDocument = typeof applicationDocuments.$inferSelect;
export type InsertApplicationDocument = z.infer<typeof insertApplicationDocumentSchema>;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;
export type FeePayment = typeof feePayments.$inferSelect;
export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;
export type StudentBatch = typeof studentBatches.$inferSelect;
export type InsertStudentBatch = z.infer<typeof insertStudentBatchSchema>;
export type StudentBatchAssignment = typeof studentBatchAssignments.$inferSelect;
export type OrientationSession = typeof orientationSessions.$inferSelect;
export type InsertOrientationSession = z.infer<typeof insertOrientationSessionSchema>;
export type OrientationRegistration = typeof orientationRegistrations.$inferSelect;

// Extended types for Student Admission
export type StudentApplicationWithDocuments = StudentApplication & {
  documents: ApplicationDocument[];
  feePayments: FeePayment[];
  batchAssignment?: StudentBatchAssignment & { batch: StudentBatch };
};

export type StudentBatchWithMentor = StudentBatch & {
  mentor?: Mentor;
  assignments: StudentBatchAssignment[];
};
