import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
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
