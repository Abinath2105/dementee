import { users, videos, categories, otpCodes, videoViews, mentors, mentorCredentials, mentorInvitations, videoProgress, videoBookmarks, userWatchlist, mentorSections, mentorResources, videoComments, videoRatings, commentLikes, platformSettings, studentApplications, applicationDocuments, feeStructures, feePayments, studentBatches, studentBatchAssignments, orientationSessions, orientationRegistrations, type User, type InsertUser, type Video, type InsertVideo, type Category, type InsertCategory, type OtpCode, type InsertOtp, type VideoWithCategory, type AdminStats, type Mentor, type InsertMentor, type MentorWithStats, type MentorCredentials, type InsertMentorCredentials, type MentorInvitation, type InsertMentorInvitation, type VideoProgress, type InsertVideoProgress, type VideoBookmark, type InsertVideoBookmark, type UserWatchlist, type InsertUserWatchlist, type MentorSection, type InsertMentorSection, type MentorResource, type InsertMentorResource, type VideoComment, type InsertVideoComment, type VideoRating, type InsertVideoRating, type CommentLike, type InsertCommentLike, type VideoCommentWithUser, type PlatformSettings, type InsertPlatformSettings, type StudentApplication, type InsertStudentApplication, type StudentApplicationWithDocuments, type ApplicationDocument, type InsertApplicationDocument, type FeeStructure, type InsertFeeStructure, type FeePayment, type InsertFeePayment, type StudentBatch, type InsertStudentBatch, type StudentBatchAssignment, type StudentBatchWithMentor, type OrientationSession, type InsertOrientationSession, type OrientationRegistration } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike, count, sum, asc, avg, isNull } from "drizzle-orm";
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
  updateUserProfile(userId: number, profileData: Partial<User>): Promise<User>;

  // Video progress tracking
  getVideoProgress(userId: number, videoId: number): Promise<VideoProgress | undefined>;
  updateVideoProgress(userId: number, videoId: number, progress: Partial<InsertVideoProgress>): Promise<VideoProgress>;
  getUserVideoProgress(userId: number): Promise<VideoProgress[]>;
  getVideoProgressStats(userId: number): Promise<{
    totalVideos: number;
    completedVideos: number;
    totalWatchTime: number;
  }>;

  // Video bookmarks
  getVideoBookmarks(userId: number, videoId: number): Promise<VideoBookmark[]>;
  createVideoBookmark(bookmark: InsertVideoBookmark): Promise<VideoBookmark>;
  deleteVideoBookmark(id: number): Promise<void>;
  getUserBookmarks(userId: number): Promise<VideoBookmark[]>;

  // User watchlist
  getUserWatchlist(userId: number): Promise<UserWatchlist[]>;
  addToWatchlist(userId: number, videoId: number): Promise<UserWatchlist>;
  removeFromWatchlist(userId: number, videoId: number): Promise<void>;
  isInWatchlist(userId: number, videoId: number): Promise<boolean>;

  // Video comments and ratings
  getVideoComments(videoId: number): Promise<VideoCommentWithUser[]>;
  createComment(comment: InsertVideoComment): Promise<VideoComment>;
  updateComment(id: number, content: string): Promise<VideoComment>;
  deleteComment(id: number): Promise<void>;
  getVideoRating(videoId: number, userId: number): Promise<VideoRating | undefined>;
  createOrUpdateRating(rating: InsertVideoRating): Promise<VideoRating>;
  deleteRating(videoId: number, userId: number): Promise<void>;
  getVideoRatingStats(videoId: number): Promise<{ averageRating: number; totalRatings: number }>;
  toggleCommentLike(commentId: number, userId: number): Promise<{ liked: boolean; likeCount: number }>;

  // OTP management
  createOtp(otp: InsertOtp): Promise<OtpCode>;
  getValidOtp(email: string, code: string): Promise<OtpCode | undefined>;
  markOtpAsUsed(id: number): Promise<void>;

  // Category management
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;

  // Video management
  getVideos(search?: string, categoryId?: number): Promise<VideoWithCategory[]>;
  getVideo(id: number): Promise<VideoWithCategory | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video>;
  deleteVideo(id: number): Promise<void>;
  incrementVideoViews(videoId: number, userId?: number, ipAddress?: string): Promise<void>;

  // Admin stats
  getAdminStats(): Promise<AdminStats>;

  // Mentor management
  getMentors(): Promise<MentorWithStats[]>;
  getMentor(id: number): Promise<Mentor | undefined>;
  getMentorByEmail(email: string): Promise<Mentor | undefined>;
  createMentor(mentor: InsertMentor): Promise<Mentor>;
  updateMentor(id: number, mentor: Partial<InsertMentor>): Promise<Mentor>;
  deleteMentor(id: number): Promise<void>;
  activateMentor(id: number): Promise<void>;
  
  // Mentor credentials
  createMentorCredentials(credentials: InsertMentorCredentials): Promise<MentorCredentials>;
  getMentorCredentials(mentorId: number): Promise<MentorCredentials | undefined>;
  
  // Mentor invitations
  createMentorInvitation(invitation: InsertMentorInvitation): Promise<MentorInvitation>;
  getMentorInvitationByToken(token: string): Promise<MentorInvitation | undefined>;
  markInvitationAsUsed(id: number): Promise<void>;

  // Mentor profile sections
  getMentorSections(mentorId: number): Promise<MentorSection[]>;
  createMentorSection(section: InsertMentorSection): Promise<MentorSection>;
  updateMentorSection(id: number, section: Partial<InsertMentorSection>): Promise<MentorSection>;
  deleteMentorSection(id: number): Promise<void>;

  // Mentor resources
  getMentorResources(mentorId: number): Promise<MentorResource[]>;
  createMentorResource(resource: InsertMentorResource): Promise<MentorResource>;
  updateMentorResource(id: number, resource: Partial<InsertMentorResource>): Promise<MentorResource>;
  deleteMentorResource(id: number): Promise<void>;

  // Mentor profile data
  updateMentorProfile(mentorId: number, data: Partial<InsertMentor>): Promise<Mentor>;

  sessionStore: any;

  // Platform settings
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(settings: Partial<InsertPlatformSettings>): Promise<PlatformSettings>;

  // Student Admission methods
  getStudentApplications(): Promise<StudentApplicationWithDocuments[]>;
  createStudentApplication(application: InsertStudentApplication): Promise<StudentApplication>;
  updateApplicationStatus(id: number, status: string): Promise<StudentApplication>;
  generateStudentId(applicationId: number): Promise<StudentApplication>;
  createApplicationDocument(document: InsertApplicationDocument): Promise<ApplicationDocument>;
  getFeeStructures(): Promise<FeeStructure[]>;
  createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure>;
  createFeePayment(payment: InsertFeePayment): Promise<FeePayment>;
  getStudentBatches(): Promise<StudentBatchWithMentor[]>;
  createStudentBatch(batch: InsertStudentBatch): Promise<StudentBatch>;
  assignStudentToBatch(applicationId: number, batchId: number): Promise<StudentBatchAssignment>;
  getOrientationSessions(): Promise<OrientationSession[]>;
  createOrientationSession(session: InsertOrientationSession): Promise<OrientationSession>;
  registerStudentForOrientation(orientationId: number, applicationId: number): Promise<OrientationRegistration>;

  // LMS Methods
  getAssignments(userId: number): Promise<any[]>;
  getAssignmentStats(userId: number): Promise<any>;
  getAdvancedDashboardData(userId: number): Promise<any>;
  startAssignment(assignmentId: number, userId: number): Promise<any>;
  getAssignmentQuestions(assignmentId: number): Promise<any[]>;
  submitAssignment(assignmentId: number, userId: number, answers: any): Promise<any>;
  getLearningPaths(userId: number): Promise<any[]>;
  enrollInLearningPath(pathId: number, userId: number): Promise<any>;
  getUserAchievements(userId: number): Promise<any[]>;
  createStudySession(sessionData: any): Promise<any>;
  getUserNotifications(userId: number): Promise<any[]>;
  markNotificationAsRead(notificationId: number, userId: number): Promise<void>;
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

  async updateUserProfile(userId: number, profileData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(profileData)
      .where(eq(users.id, userId))
      .returning();
    return user;
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

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
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

    const [mentorStats] = await db
      .select({
        totalMentors: sql<number>`COUNT(*)::int`,
        activeMentors: sql<number>`COUNT(*) FILTER (WHERE is_active = true)::int`,
      })
      .from(mentors);

    return {
      totalVideos: videoStats?.totalVideos || 0,
      totalUsers: userStats?.totalUsers || 0,
      totalViews: viewStats?.totalViews || 0,
      totalMentors: mentorStats?.totalMentors || 0,
      activeMentors: mentorStats?.activeMentors || 0,
      totalWatchTime: "0h", // This would require duration calculation
    };
  }

  // Mentor management methods
  async getMentors(): Promise<MentorWithStats[]> {
    const mentorList = await db.select().from(mentors).orderBy(desc(mentors.createdAt));
    
    const mentorsWithStats = await Promise.all(
      mentorList.map(async (mentor) => {
        const [credentialsCheck, invitationsCount] = await Promise.all([
          db.select({ count: sql<number>`count(*)` })
            .from(mentorCredentials)
            .where(eq(mentorCredentials.mentorId, mentor.id)),
          db.select({ count: sql<number>`count(*)` })
            .from(mentorInvitations)
            .where(and(
              eq(mentorInvitations.mentorId, mentor.id),
              sql`used_at IS NULL`,
              sql`expires_at > NOW()`
            ))
        ]);

        return {
          ...mentor,
          hasCredentials: credentialsCheck[0].count > 0,
          pendingInvitations: invitationsCount[0].count,
        };
      })
    );

    return mentorsWithStats;
  }

  async getMentor(id: number): Promise<Mentor | undefined> {
    const [mentor] = await db.select().from(mentors).where(eq(mentors.id, id));
    return mentor || undefined;
  }

  async getMentorByEmail(email: string): Promise<Mentor | undefined> {
    const [mentor] = await db.select().from(mentors).where(eq(mentors.email, email));
    return mentor || undefined;
  }

  async createMentor(insertMentor: InsertMentor): Promise<Mentor> {
    const [mentor] = await db
      .insert(mentors)
      .values(insertMentor)
      .returning();
    return mentor;
  }

  async updateMentor(id: number, updateData: Partial<InsertMentor>): Promise<Mentor> {
    const [mentor] = await db
      .update(mentors)
      .set(updateData)
      .where(eq(mentors.id, id))
      .returning();
    return mentor;
  }

  async deleteMentor(id: number): Promise<void> {
    await db.delete(mentors).where(eq(mentors.id, id));
  }

  async activateMentor(id: number): Promise<void> {
    await db
      .update(mentors)
      .set({ isActive: true, activatedAt: new Date() })
      .where(eq(mentors.id, id));
  }

  // Mentor credentials methods
  async createMentorCredentials(credentials: InsertMentorCredentials): Promise<MentorCredentials> {
    const [cred] = await db
      .insert(mentorCredentials)
      .values(credentials)
      .returning();
    return cred;
  }

  async getMentorCredentials(mentorId: number): Promise<MentorCredentials | undefined> {
    const [credentials] = await db
      .select()
      .from(mentorCredentials)
      .where(eq(mentorCredentials.mentorId, mentorId));
    return credentials || undefined;
  }

  // Mentor invitation methods
  async createMentorInvitation(invitation: InsertMentorInvitation): Promise<MentorInvitation> {
    const [inv] = await db
      .insert(mentorInvitations)
      .values(invitation)
      .returning();
    return inv;
  }

  async getMentorInvitationByToken(token: string): Promise<MentorInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(mentorInvitations)
      .where(and(
        eq(mentorInvitations.token, token),
        sql`used_at IS NULL`,
        sql`expires_at > NOW()`
      ));
    return invitation || undefined;
  }

  async markInvitationAsUsed(id: number): Promise<void> {
    await db
      .update(mentorInvitations)
      .set({ usedAt: new Date() })
      .where(eq(mentorInvitations.id, id));
  }

  // Video progress tracking
  async getVideoProgress(userId: number, videoId: number): Promise<VideoProgress | undefined> {
    const [progress] = await db.select()
      .from(videoProgress)
      .where(and(eq(videoProgress.userId, userId), eq(videoProgress.videoId, videoId)));
    return progress || undefined;
  }

  async updateVideoProgress(userId: number, videoId: number, progress: Partial<InsertVideoProgress>): Promise<VideoProgress> {
    const existing = await this.getVideoProgress(userId, videoId);
    
    if (existing) {
      const [updated] = await db.update(videoProgress)
        .set({
          ...progress,
          updatedAt: sql`NOW()`,
          lastWatchedAt: sql`NOW()`
        })
        .where(and(eq(videoProgress.userId, userId), eq(videoProgress.videoId, videoId)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(videoProgress)
        .values({
          userId,
          videoId,
          ...progress,
        })
        .returning();
      return created;
    }
  }

  async getUserVideoProgress(userId: number): Promise<VideoProgress[]> {
    return await db.select()
      .from(videoProgress)
      .where(eq(videoProgress.userId, userId))
      .orderBy(desc(videoProgress.lastWatchedAt));
  }

  async getVideoProgressStats(userId: number): Promise<{
    totalVideos: number;
    completedVideos: number;
    totalWatchTime: number;
  }> {
    const [stats] = await db.select({
      totalVideos: count(videoProgress.id),
      completedVideos: count(sql`CASE WHEN ${videoProgress.isCompleted} THEN 1 END`),
      totalWatchTime: sum(videoProgress.currentTimeSeconds)
    })
    .from(videoProgress)
    .where(eq(videoProgress.userId, userId));

    return {
      totalVideos: stats.totalVideos || 0,
      completedVideos: stats.completedVideos || 0,
      totalWatchTime: stats.totalWatchTime || 0,
    };
  }

  // Video bookmarks
  async getVideoBookmarks(userId: number, videoId: number): Promise<VideoBookmark[]> {
    return await db.select()
      .from(videoBookmarks)
      .where(and(eq(videoBookmarks.userId, userId), eq(videoBookmarks.videoId, videoId)))
      .orderBy(videoBookmarks.timestampSeconds);
  }

  async createVideoBookmark(bookmark: InsertVideoBookmark): Promise<VideoBookmark> {
    const [created] = await db.insert(videoBookmarks)
      .values(bookmark)
      .returning();
    return created;
  }

  async deleteVideoBookmark(id: number): Promise<void> {
    await db.delete(videoBookmarks)
      .where(eq(videoBookmarks.id, id));
  }

  async getUserBookmarks(userId: number): Promise<VideoBookmark[]> {
    return await db.select()
      .from(videoBookmarks)
      .where(eq(videoBookmarks.userId, userId))
      .orderBy(desc(videoBookmarks.createdAt));
  }

  // User watchlist
  async getUserWatchlist(userId: number): Promise<UserWatchlist[]> {
    return await db.select()
      .from(userWatchlist)
      .where(eq(userWatchlist.userId, userId))
      .orderBy(desc(userWatchlist.addedAt));
  }

  async addToWatchlist(userId: number, videoId: number): Promise<UserWatchlist> {
    const [created] = await db.insert(userWatchlist)
      .values({ userId, videoId })
      .returning();
    return created;
  }

  async removeFromWatchlist(userId: number, videoId: number): Promise<void> {
    await db.delete(userWatchlist)
      .where(and(eq(userWatchlist.userId, userId), eq(userWatchlist.videoId, videoId)));
  }

  async isInWatchlist(userId: number, videoId: number): Promise<boolean> {
    const [exists] = await db.select()
      .from(userWatchlist)
      .where(and(eq(userWatchlist.userId, userId), eq(userWatchlist.videoId, videoId)))
      .limit(1);
    return !!exists;
  }

  // Mentor profile sections
  async getMentorSections(mentorId: number): Promise<MentorSection[]> {
    return await db
      .select()
      .from(mentorSections)
      .where(eq(mentorSections.mentorId, mentorId))
      .orderBy(asc(mentorSections.orderIndex));
  }

  async createMentorSection(section: InsertMentorSection): Promise<MentorSection> {
    const [newSection] = await db
      .insert(mentorSections)
      .values(section)
      .returning();
    return newSection;
  }

  async updateMentorSection(id: number, section: Partial<InsertMentorSection>): Promise<MentorSection> {
    const [updatedSection] = await db
      .update(mentorSections)
      .set(section)
      .where(eq(mentorSections.id, id))
      .returning();
    return updatedSection;
  }

  async deleteMentorSection(id: number): Promise<void> {
    await db.delete(mentorSections).where(eq(mentorSections.id, id));
  }

  // Mentor resources
  async getMentorResources(mentorId: number): Promise<MentorResource[]> {
    return await db
      .select()
      .from(mentorResources)
      .where(and(eq(mentorResources.mentorId, mentorId), eq(mentorResources.isActive, true)))
      .orderBy(asc(mentorResources.createdAt));
  }

  async createMentorResource(resource: InsertMentorResource): Promise<MentorResource> {
    const [newResource] = await db
      .insert(mentorResources)
      .values(resource)
      .returning();
    return newResource;
  }

  async updateMentorResource(id: number, resource: Partial<InsertMentorResource>): Promise<MentorResource> {
    const [updatedResource] = await db
      .update(mentorResources)
      .set(resource)
      .where(eq(mentorResources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteMentorResource(id: number): Promise<void> {
    await db.delete(mentorResources).where(eq(mentorResources.id, id));
  }

  // Mentor profile data
  async updateMentorProfile(mentorId: number, data: Partial<InsertMentor>): Promise<Mentor> {
    const [updatedMentor] = await db
      .update(mentors)
      .set(data)
      .where(eq(mentors.id, mentorId))
      .returning();
    return updatedMentor;
  }
  // LMS Implementation Methods
  async getAssignments(userId: number): Promise<any[]> {
    // Return empty array for now - this would normally fetch assignments with user progress
    return [];
  }

  async getAssignmentStats(userId: number): Promise<any> {
    // Return mock stats for now
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      totalPoints: 0
    };
  }

  async getAdvancedDashboardData(userId: number): Promise<any> {
    // Return comprehensive dashboard data
    return {
      totalPoints: 0,
      completedAssignments: 0,
      completedVideos: 0,
      studyTimeMinutes: 0,
      currentStreak: 0,
      level: 1,
      achievements: [],
      recentActivity: [],
      upcomingAssignments: [],
      learningPaths: [],
      weeklyProgress: [
        { day: 'Monday', studyMinutes: 0, pointsEarned: 0 },
        { day: 'Tuesday', studyMinutes: 0, pointsEarned: 0 },
        { day: 'Wednesday', studyMinutes: 0, pointsEarned: 0 },
        { day: 'Thursday', studyMinutes: 0, pointsEarned: 0 },
        { day: 'Friday', studyMinutes: 0, pointsEarned: 0 },
        { day: 'Saturday', studyMinutes: 0, pointsEarned: 0 },
        { day: 'Sunday', studyMinutes: 0, pointsEarned: 0 }
      ]
    };
  }

  async startAssignment(assignmentId: number, userId: number): Promise<any> {
    // This would create a new assignment submission
    return { id: 1, status: 'in_progress' };
  }

  async getAssignmentQuestions(assignmentId: number): Promise<any[]> {
    return [];
  }

  async submitAssignment(assignmentId: number, userId: number, answers: any): Promise<any> {
    return { id: 1, score: 0, maxScore: 100 };
  }

  async getLearningPaths(userId: number): Promise<any[]> {
    return [];
  }

  async enrollInLearningPath(pathId: number, userId: number): Promise<any> {
    return { id: 1, status: 'enrolled' };
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    return [];
  }

  async createStudySession(sessionData: any): Promise<any> {
    return { id: 1 };
  }

  async getUserNotifications(userId: number): Promise<any[]> {
    return [];
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    // Mark notification as read
  }

  // Video Comments and Ratings Implementation
  async getVideoComments(videoId: number): Promise<VideoCommentWithUser[]> {
    const comments = await db
      .select({
        id: videoComments.id,
        videoId: videoComments.videoId,
        userId: videoComments.userId,
        content: videoComments.content,
        parentId: videoComments.parentId,
        isEdited: videoComments.isEdited,
        likeCount: videoComments.likeCount,
        createdAt: videoComments.createdAt,
        updatedAt: videoComments.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          avatar: users.avatar,
        }
      })
      .from(videoComments)
      .innerJoin(users, eq(videoComments.userId, users.id))
      .where(and(eq(videoComments.videoId, videoId), isNull(videoComments.parentId)))
      .orderBy(desc(videoComments.createdAt));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await db
          .select({
            id: videoComments.id,
            videoId: videoComments.videoId,
            userId: videoComments.userId,
            content: videoComments.content,
            parentId: videoComments.parentId,
            isEdited: videoComments.isEdited,
            likeCount: videoComments.likeCount,
            createdAt: videoComments.createdAt,
            updatedAt: videoComments.updatedAt,
            user: {
              id: users.id,
              username: users.username,
              avatar: users.avatar,
            }
          })
          .from(videoComments)
          .innerJoin(users, eq(videoComments.userId, users.id))
          .where(eq(videoComments.parentId, comment.id))
          .orderBy(asc(videoComments.createdAt));

        return { ...comment, replies };
      })
    );

    return commentsWithReplies;
  }

  async createComment(insertComment: InsertVideoComment): Promise<VideoComment> {
    const [comment] = await db
      .insert(videoComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async updateComment(id: number, content: string): Promise<VideoComment> {
    const [comment] = await db
      .update(videoComments)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(eq(videoComments.id, id))
      .returning();
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(videoComments).where(eq(videoComments.id, id));
  }

  async getVideoRating(videoId: number, userId: number): Promise<VideoRating | undefined> {
    const [rating] = await db
      .select()
      .from(videoRatings)
      .where(and(eq(videoRatings.videoId, videoId), eq(videoRatings.userId, userId)));
    return rating;
  }

  async createOrUpdateRating(insertRating: InsertVideoRating): Promise<VideoRating> {
    const existingRating = await this.getVideoRating(insertRating.videoId, insertRating.userId);
    
    if (existingRating) {
      const [updatedRating] = await db
        .update(videoRatings)
        .set({ rating: insertRating.rating, updatedAt: new Date() })
        .where(and(eq(videoRatings.videoId, insertRating.videoId), eq(videoRatings.userId, insertRating.userId)))
        .returning();
      return updatedRating;
    } else {
      const [newRating] = await db
        .insert(videoRatings)
        .values(insertRating)
        .returning();
      return newRating;
    }
  }

  async deleteRating(videoId: number, userId: number): Promise<void> {
    await db
      .delete(videoRatings)
      .where(and(eq(videoRatings.videoId, videoId), eq(videoRatings.userId, userId)));
  }

  async getVideoRatingStats(videoId: number): Promise<{ averageRating: number; totalRatings: number }> {
    const result = await db
      .select({
        averageRating: avg(videoRatings.rating),
        totalRatings: count(videoRatings.id),
      })
      .from(videoRatings)
      .where(eq(videoRatings.videoId, videoId));

    const stats = result[0];
    return {
      averageRating: Number(stats.averageRating) || 0,
      totalRatings: Number(stats.totalRatings) || 0,
    };
  }

  async toggleCommentLike(commentId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));

    if (existingLike.length > 0) {
      // Remove like
      await db
        .delete(commentLikes)
        .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
      
      // Decrement like count
      await db
        .update(videoComments)
        .set({ likeCount: sql`${videoComments.likeCount} - 1` })
        .where(eq(videoComments.id, commentId));

      const [comment] = await db
        .select({ likeCount: videoComments.likeCount })
        .from(videoComments)
        .where(eq(videoComments.id, commentId));

      return { liked: false, likeCount: comment.likeCount };
    } else {
      // Add like
      await db
        .insert(commentLikes)
        .values({ commentId, userId });
      
      // Increment like count
      await db
        .update(videoComments)
        .set({ likeCount: sql`${videoComments.likeCount} + 1` })
        .where(eq(videoComments.id, commentId));

      const [comment] = await db
        .select({ likeCount: videoComments.likeCount })
        .from(videoComments)
        .where(eq(videoComments.id, commentId));

      return { liked: true, likeCount: comment.likeCount };
    }
  }

  async getPlatformSettings(): Promise<PlatformSettings> {
    const [settings] = await db.select().from(platformSettings).limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      const [defaultSettings] = await db
        .insert(platformSettings)
        .values({
          platformName: "De mentee Academy",
          description: "Transform Your Learning Journey",
          primaryColor: "#2563eb",
          secondaryColor: "#64748b",
        })
        .returning();
      return defaultSettings;
    }
    
    return settings;
  }

  async updatePlatformSettings(settings: Partial<InsertPlatformSettings>): Promise<PlatformSettings> {
    const existingSettings = await this.getPlatformSettings();
    
    const [updatedSettings] = await db
      .update(platformSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, existingSettings.id))
      .returning();
    
    return updatedSettings;
  }

  // Student Admission Methods
  async getStudentApplications(): Promise<StudentApplicationWithDocuments[]> {
    const applications = await db
      .select()
      .from(studentApplications)
      .orderBy(desc(studentApplications.createdAt));

    const applicationsWithDetails = await Promise.all(
      applications.map(async (application) => {
        const documents = await db
          .select()
          .from(applicationDocuments)
          .where(eq(applicationDocuments.applicationId, application.id));

        const feePayments = await db
          .select()
          .from(feePayments)
          .where(eq(feePayments.applicationId, application.id));

        const batchAssignment = await db
          .select({
            id: studentBatchAssignments.id,
            applicationId: studentBatchAssignments.applicationId,
            batchId: studentBatchAssignments.batchId,
            assignedAt: studentBatchAssignments.assignedAt,
            status: studentBatchAssignments.status,
            batch: {
              id: studentBatches.id,
              batchName: studentBatches.batchName,
              course: studentBatches.course,
              timing: studentBatches.timing,
              mode: studentBatches.mode,
            }
          })
          .from(studentBatchAssignments)
          .innerJoin(studentBatches, eq(studentBatchAssignments.batchId, studentBatches.id))
          .where(eq(studentBatchAssignments.applicationId, application.id))
          .limit(1);

        return {
          ...application,
          documents,
          feePayments,
          batchAssignment: batchAssignment[0] || undefined,
        };
      })
    );

    return applicationsWithDetails;
  }

  async createStudentApplication(application: InsertStudentApplication): Promise<StudentApplication> {
    const [newApplication] = await db
      .insert(studentApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  async updateApplicationStatus(id: number, status: string): Promise<StudentApplication> {
    const [updatedApplication] = await db
      .update(studentApplications)
      .set({ 
        applicationStatus: status,
        updatedAt: new Date()
      })
      .where(eq(studentApplications.id, id))
      .returning();
    return updatedApplication;
  }

  async generateStudentId(applicationId: number): Promise<StudentApplication> {
    // Generate unique student ID
    const studentId = `STU${Date.now().toString().slice(-6)}`;
    
    const [updatedApplication] = await db
      .update(studentApplications)
      .set({ 
        studentId,
        applicationStatus: "approved",
        updatedAt: new Date()
      })
      .where(eq(studentApplications.id, applicationId))
      .returning();

    return updatedApplication;
  }

  async createApplicationDocument(document: InsertApplicationDocument): Promise<ApplicationDocument> {
    const [newDocument] = await db
      .insert(applicationDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async getFeeStructures(): Promise<FeeStructure[]> {
    return await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.isActive, true))
      .orderBy(feeStructures.courseName);
  }

  async createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure> {
    const [newFeeStructure] = await db
      .insert(feeStructures)
      .values(feeStructure)
      .returning();
    return newFeeStructure;
  }

  async createFeePayment(payment: InsertFeePayment): Promise<FeePayment> {
    const [newPayment] = await db
      .insert(feePayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getStudentBatches(): Promise<StudentBatchWithMentor[]> {
    const batches = await db
      .select({
        id: studentBatches.id,
        batchName: studentBatches.batchName,
        course: studentBatches.course,
        timing: studentBatches.timing,
        mode: studentBatches.mode,
        mentorId: studentBatches.mentorId,
        maxStudents: studentBatches.maxStudents,
        currentStudents: studentBatches.currentStudents,
        startDate: studentBatches.startDate,
        endDate: studentBatches.endDate,
        isActive: studentBatches.isActive,
        createdAt: studentBatches.createdAt,
        updatedAt: studentBatches.updatedAt,
        mentor: mentors
      })
      .from(studentBatches)
      .leftJoin(mentors, eq(studentBatches.mentorId, mentors.id))
      .where(eq(studentBatches.isActive, true))
      .orderBy(studentBatches.batchName);

    const batchesWithAssignments = await Promise.all(
      batches.map(async (batch) => {
        const assignments = await db
          .select()
          .from(studentBatchAssignments)
          .where(eq(studentBatchAssignments.batchId, batch.id));

        return {
          ...batch,
          assignments,
        };
      })
    );

    return batchesWithAssignments;
  }

  async createStudentBatch(batch: InsertStudentBatch): Promise<StudentBatch> {
    const [newBatch] = await db
      .insert(studentBatches)
      .values(batch)
      .returning();
    return newBatch;
  }

  async assignStudentToBatch(applicationId: number, batchId: number): Promise<StudentBatchAssignment> {
    const [assignment] = await db
      .insert(studentBatchAssignments)
      .values({
        applicationId,
        batchId,
      })
      .returning();

    // Update batch current students count
    await db
      .update(studentBatches)
      .set({
        currentStudents: sql`${studentBatches.currentStudents} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(studentBatches.id, batchId));

    return assignment;
  }

  async getOrientationSessions(): Promise<OrientationSession[]> {
    return await db
      .select()
      .from(orientationSessions)
      .where(eq(orientationSessions.isActive, true))
      .orderBy(orientationSessions.sessionDate);
  }

  async createOrientationSession(session: InsertOrientationSession): Promise<OrientationSession> {
    const [newSession] = await db
      .insert(orientationSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async registerStudentForOrientation(orientationId: number, applicationId: number): Promise<OrientationRegistration> {
    const [registration] = await db
      .insert(orientationRegistrations)
      .values({
        orientationId,
        applicationId,
      })
      .returning();

    // Update session current participants count
    await db
      .update(orientationSessions)
      .set({
        currentParticipants: sql`${orientationSessions.currentParticipants} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(orientationSessions.id, orientationId));

    return registration;
  }
}

export const storage = new DatabaseStorage();
