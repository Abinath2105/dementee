CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_name" text DEFAULT 'Zmartclass' NOT NULL,
	"app_logo" text,
	"primary_color" text DEFAULT '#3b82f6' NOT NULL,
	"secondary_color" text DEFAULT '#1f2937' NOT NULL,
	"banner_images" jsonb DEFAULT '[]'::jsonb,
	"footer_text" text,
	"hero_title" text DEFAULT 'Transform Your Learning Journey',
	"hero_subtitle" text DEFAULT 'Join thousands of students advancing their careers with our expert-led courses',
	"hero_button_text" text DEFAULT 'Get Started Today',
	"stats_title" text DEFAULT 'Trusted by Students Worldwide',
	"stat1_label" text DEFAULT 'Active Students',
	"stat1_value" text DEFAULT '10,000+',
	"stat2_label" text DEFAULT 'Courses',
	"stat2_value" text DEFAULT '50+',
	"stat3_label" text DEFAULT 'Video Lessons',
	"stat3_value" text DEFAULT '500+',
	"stat4_label" text DEFAULT 'Success Rate',
	"stat4_value" text DEFAULT '95%',
	"about_title" text DEFAULT 'About Zmartclass',
	"about_description" text DEFAULT 'We''re dedicated to making quality education accessible to everyone. Our platform combines cutting-edge technology with expert instruction to deliver exceptional learning experiences.',
	"features_title" text DEFAULT 'Why Choose Zmartclass?',
	"feature1_title" text DEFAULT 'Expert-Led Courses',
	"feature1_description" text DEFAULT 'Learn from industry professionals with real-world experience',
	"feature2_title" text DEFAULT 'Practical Learning',
	"feature2_description" text DEFAULT 'Hands-on projects and real case studies to build your portfolio',
	"feature3_title" text DEFAULT 'Fast-Track Progress',
	"feature3_description" text DEFAULT 'Accelerated learning paths designed for busy professionals',
	"contact_title" text DEFAULT 'Get In Touch',
	"contact_description" text DEFAULT 'Ready to start your learning journey? Contact us today!',
	"contact_email" text DEFAULT 'info@zmartclass.com',
	"contact_phone" text DEFAULT '+1 (555) 123-4567',
	"allow_public_registration" boolean DEFAULT true NOT NULL,
	"public_user_access_categories" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"cover_image" text,
	"author" text NOT NULL,
	"author_email" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"category_id" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"view_count" integer DEFAULT 0,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "broadcast_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"video_id" integer,
	"video_url" text,
	"target_audience" text DEFAULT 'all' NOT NULL,
	"category_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"scheduled_for" timestamp,
	"expires_at" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"mentor_name" text,
	"description" text,
	"cover_image" text,
	"background_image" text,
	"background_color" text DEFAULT '#f3f4f6',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer,
	"public_user_id" integer,
	"registration_email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone_number" text,
	"status" text DEFAULT 'registered' NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"notes" text,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"cancelled_at" timestamp,
	CONSTRAINT "event_registrations_event_id_user_id_unique" UNIQUE("event_id","user_id"),
	CONSTRAINT "event_registrations_event_id_public_user_id_unique" UNIQUE("event_id","public_user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"category_id" integer,
	"instructor_name" text,
	"instructor_email" text,
	"max_participants" integer,
	"current_participants" integer DEFAULT 0,
	"price" text,
	"meeting_link" text,
	"meeting_password" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"duration" text,
	"location" text,
	"cover_image" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"registration_deadline" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_category_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"assigned_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"invite_token" text NOT NULL,
	"invited_by" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_invitations_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "user_notification_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"notification_id" integer NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_clicked" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_notification_status_user_id_notification_id_unique" UNIQUE("user_id","notification_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"public_user_id" integer,
	"first_name" text,
	"last_name" text,
	"phone_number" text,
	"date_of_birth" timestamp,
	"gender" text,
	"occupation" text,
	"company" text,
	"bio" text,
	"website" text,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"zip_code" text,
	"timezone" text,
	"language" text DEFAULT 'en',
	"marketing_opt_in" boolean DEFAULT false,
	"notification_preferences" jsonb DEFAULT '{}'::jsonb,
	"profile_picture" text,
	"cover_image" text,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_public_user_id_unique" UNIQUE("public_user_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_start" timestamp DEFAULT now() NOT NULL,
	"session_end" timestamp,
	"device_info" text,
	"device_type" text,
	"browser" text,
	"os" text,
	"ip_address" text,
	"country" text,
	"city" text,
	"timezone" text,
	"screen_resolution" text,
	"total_watch_time" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"invited_by" integer,
	"invite_token" text,
	"invite_expiry" timestamp,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "video_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	"bookmarked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_bookmarks_user_id_video_id_unique" UNIQUE("user_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "video_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_categories_video_id_category_id_unique" UNIQUE("video_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "video_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	"content" text NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"watch_time" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "video_completions_user_id_video_id_unique" UNIQUE("user_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "video_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_ratings_user_id_video_id_unique" UNIQUE("user_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "video_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"user_id" integer,
	"ip_address" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"youtube_id" text NOT NULL,
	"thumbnail_url" text,
	"duration" text,
	"category_id" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"views" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	"watched_at" timestamp DEFAULT now() NOT NULL,
	"watch_duration" integer DEFAULT 0 NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"device_info" text,
	"device_type" text,
	"browser" text,
	"os" text,
	"ip_address" text,
	"country" text,
	"city" text
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_notifications" ADD CONSTRAINT "broadcast_notifications_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_notifications" ADD CONSTRAINT "broadcast_notifications_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_notifications" ADD CONSTRAINT "broadcast_notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_public_user_id_public_users_id_fk" FOREIGN KEY ("public_user_id") REFERENCES "public"."public_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_category_access" ADD CONSTRAINT "user_category_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_category_access" ADD CONSTRAINT "user_category_access_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_category_access" ADD CONSTRAINT "user_category_access_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_status" ADD CONSTRAINT "user_notification_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_status" ADD CONSTRAINT "user_notification_status_notification_id_broadcast_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."broadcast_notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_public_user_id_public_users_id_fk" FOREIGN KEY ("public_user_id") REFERENCES "public"."public_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_bookmarks" ADD CONSTRAINT "video_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_bookmarks" ADD CONSTRAINT "video_bookmarks_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_categories" ADD CONSTRAINT "video_categories_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_categories" ADD CONSTRAINT "video_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_parent_id_video_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."video_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_completions" ADD CONSTRAINT "video_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_completions" ADD CONSTRAINT "video_completions_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_ratings" ADD CONSTRAINT "video_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_ratings" ADD CONSTRAINT "video_ratings_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;