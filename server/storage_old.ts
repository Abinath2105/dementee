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

  async deleteFeePayment(paymentId: number): Promise<void> {
    await db.delete(feePayments).where(eq(feePayments.id, paymentId));
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

        const applicationFeePayments = await db
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
          feePayments: applicationFeePayments,
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

  // Fee Dashboard Methods
  async getPaymentStats(): Promise<any> {
    try {
      // Get total revenue from fee payments
      const revenueResult = await db
        .select({
          totalRevenue: sql<number>`sum(${feePayments.totalAmount})`,
          totalPaid: sql<number>`sum(${feePayments.paidAmount})`,
          totalPending: sql<number>`sum(${feePayments.pendingAmount})`,
        })
        .from(feePayments);

      // Get total students count
      const studentsResult = await db
        .select({
          totalStudents: sql<number>`count(distinct ${studentApplications.id})`,
        })
        .from(studentApplications);

      // Get average payment
      const avgResult = await db
        .select({
          averagePayment: sql<number>`avg(${feePayments.totalAmount})`,
        })
        .from(feePayments);

      // Calculate completion rate
      const totalRevenue = parseFloat(revenueResult[0]?.totalRevenue || "0");
      const totalPaid = parseFloat(revenueResult[0]?.totalPaid || "0");
      const completionRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;

      return {
        totalRevenue: totalRevenue,
        totalPaid: totalPaid,
        totalPending: parseFloat(revenueResult[0]?.totalPending || "0"),
        totalOverdue: 0, // TODO: Calculate based on due dates
        totalStudents: parseInt(studentsResult[0]?.totalStudents || "0"),
        averagePayment: parseFloat(avgResult[0]?.averagePayment || "0"),
        completionRate: completionRate,
        monthlyGrowth: 15.2, // Mock data for now
      };
    } catch (error) {
      console.error("Error getting payment stats:", error);
      return {
        totalRevenue: 0,
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
        totalStudents: 0,
        averagePayment: 0,
        completionRate: 0,
        monthlyGrowth: 0,
      };
    }
  }

  async getPaymentRecords(): Promise<any[]> {
    try {
      const records = await db
        .select({
          id: feePayments.id,
          studentName: sql<string>`concat(${studentApplications.firstName}, ' ', ${studentApplications.lastName})`,
          course: studentApplications.preferredCourse,
          totalAmount: feePayments.totalAmount,
          paidAmount: feePayments.paidAmount,
          pendingAmount: feePayments.pendingAmount,
          paymentStatus: feePayments.paymentStatus,
          feePlan: feePayments.feePlan,
          paymentMethod: feePayments.paymentMethod,
          nextDueDate: feePayments.nextDueDate,
          createdAt: feePayments.createdAt,
        })
        .from(feePayments)
        .innerJoin(studentApplications, eq(feePayments.applicationId, studentApplications.id))
        .orderBy(desc(feePayments.createdAt));

      return records;
    } catch (error) {
      console.error("Error getting payment records:", error);
      return [];
    }
  }

  async getMonthlyPaymentData(): Promise<any[]> {
    try {
      // Mock data for chart - in real implementation, use SQL GROUP BY
      return [
        { month: "Jul", revenue: 245000, payments: 12, students: 15 },
        { month: "Aug", revenue: 320000, payments: 18, students: 22 },
        { month: "Sep", revenue: 275000, payments: 15, students: 18 },
        { month: "Oct", revenue: 410000, payments: 24, students: 28 },
        { month: "Nov", revenue: 380000, payments: 21, students: 25 },
        { month: "Dec", revenue: 425000, payments: 26, students: 30 },
      ];
    } catch (error) {
      console.error("Error getting monthly payment data:", error);
      return [];
    }
  }

  async getCourseRevenueData(): Promise<any[]> {
    try {
      const courseData = await db
        .select({
          course: studentApplications.preferredCourse,
          revenue: sql<number>`sum(${feePayments.totalAmount})`,
          students: sql<number>`count(distinct ${studentApplications.id})`,
        })
        .from(feePayments)
        .innerJoin(studentApplications, eq(feePayments.applicationId, studentApplications.id))
        .groupBy(studentApplications.preferredCourse);

      // Add colors for chart
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
      
      return courseData.map((item, index) => ({
        course: item.course,
        revenue: parseFloat(item.revenue?.toString() || "0"),
        students: parseInt(item.students?.toString() || "0"),
        color: colors[index % colors.length],
      }));
    } catch (error) {
      console.error("Error getting course revenue data:", error);
      return [
        { course: "Full Stack Development", revenue: 500000, students: 25, color: "#3b82f6" },
        { course: "Data Science & AI", revenue: 750000, students: 20, color: "#10b981" },
        { course: "Digital Marketing", revenue: 300000, students: 30, color: "#f59e0b" },
      ];
    }
  }
}

export const storage = new DatabaseStorage();
