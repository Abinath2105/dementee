# VideoLearn Pro - Video Learning Management Platform

## Overview

VideoLearn Pro is a modern web application designed for video-based learning management. The platform allows users to browse, watch, and manage educational videos with features including user authentication with email verification, categorized content organization, admin management capabilities, and YouTube video integration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Architecture
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon serverless driver with WebSocket support

## Key Components

### Authentication System
- Email-based registration with OTP verification via nodemailer
- Password hashing using Node.js crypto.scrypt
- Session-based authentication with PostgreSQL storage
- Role-based access control (admin/user permissions)
- Protected routes on both client and server sides

### Video Management
- YouTube video integration with metadata fetching
- Category-based organization system
- Search functionality across titles and descriptions
- View tracking and analytics
- Admin-only video management (add/edit/delete)

### User Interface Components
- Responsive design with mobile-first approach
- Modal-based video player with YouTube embeds
- Real-time search and filtering
- Admin dashboard with statistics and management tools
- Toast notifications for user feedback

### Content Organization
- Categories for video classification with role-based access control
- User-category assignment system for restricted access
- Tag-based metadata system
- View counting and popularity tracking
- Admin statistics dashboard

## Data Flow

1. **User Registration**: Email → OTP verification → Account activation
2. **Video Discovery**: Browse → Search/Filter → Category selection
3. **Video Consumption**: Video selection → Player modal → View tracking
4. **Admin Management**: Authentication check → Content management → Database updates
5. **Data Persistence**: All interactions stored in PostgreSQL with session management

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Query)
- Vite for build tooling and development server
- Express.js for backend API server

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible components
- Lucide React for consistent iconography

### Database and Authentication
- Neon PostgreSQL for serverless database hosting
- Drizzle ORM for database operations
- Passport.js for authentication middleware

### Third-party Integrations
- YouTube Data API for video metadata
- Nodemailer for email delivery
- Various utility libraries (date-fns, clsx, etc.)

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR (Hot Module Replacement)
- tsx for TypeScript execution in development
- Automatic code reloading and error overlay

### Production Build
- Vite build process generates optimized static assets
- esbuild bundles server code for Node.js deployment
- Static files served from Express server
- Environment-based configuration management

### Database Management
- Drizzle migrations for schema versioning
- Environment variable configuration for database connections
- Session store automatically creates required tables

## Recent Changes
- January 13, 2025: Simplified learning app architecture implemented successfully
- January 13, 2025: Removed 32+ complex LMS database tables for lightweight structure
- January 13, 2025: Rebuilt storage layer with basic category → course → video hierarchy
- January 13, 2025: Fixed navigation and authentication to work with simplified user schema
- January 13, 2025: Created clean homepage displaying categories and courses
- January 13, 2025: App running successfully with core admin/student functionality only
- January 13, 2025: Version marked as stable and live (commit: 6718dbd3d6284526d7d2112ca821afd7108c49a6)
- January 13, 2025: Enhanced category management with editable functionality and cover image uploads
- January 13, 2025: Implemented real file upload system using Multer for actual image handling
- January 13, 2025: Fixed homepage layout with categories displayed prominently above video library
- January 13, 2025: Replaced placeholder image system with proper file storage and serving
- January 13, 2025: Fixed invitation system domain URLs to use proper Replit domain instead of localhost
- January 13, 2025: Fixed critical password hashing bug in invitation acceptance (similar to Menor project fix)
- January 13, 2025: Added proper password hashing to setUserPassword method for security
- January 13, 2025: Implemented role-based category access control system
- January 13, 2025: Added user-category assignment functionality in admin panel
- January 13, 2025: Created userCategoryAccess junction table for permissions management
- January 13, 2025: Updated category fetching to respect user access permissions
- January 13, 2025: Created individual category pages with YouTube-style playlist layout
- January 13, 2025: Added `/category/:slug` routing for dedicated category pages
- January 13, 2025: Implemented category-specific video filtering and search functionality
- January 13, 2025: Fixed CategoryCard component to properly navigate to category pages
- January 13, 2025: Implemented comprehensive LMS features: category carousel, repositioned search, and video completion tracking
- January 13, 2025: Fixed invitation status bug - accepted invitations now properly filtered out from pending list in admin panel
- January 13, 2025: Applied Cloud Run deployment fixes - port configuration, environment validation, graceful shutdown handling
- January 13, 2025: Enhanced production readiness with proper NODE_ENV handling and missing environment variable warnings
- January 13, 2025: Added SMTP configuration validation with graceful degradation for email services
- January 13, 2025: Improved error handling for YouTube API with informative fallback behavior
- January 13, 2025: Fixed deployment health check endpoints - added lightweight `/health` and `/api/health` routes
- January 13, 2025: Implemented production-ready health check at root `/` route for Cloud Run deployment
- January 13, 2025: Health check endpoints return JSON with 200 status, registered early before middleware
- January 14, 2025: MAJOR UPDATE - Implemented complete mobile-first responsive design across entire application
- January 14, 2025: Replaced category carousel with responsive grid layout as requested
- January 14, 2025: Updated all pages for mobile-first approach: home, admin, category, authentication pages
- January 14, 2025: Enhanced VideoCard and CategoryCard components with mobile responsive breakpoints
- January 14, 2025: Improved navigation bars with mobile-optimized layouts and sticky positioning
- January 14, 2025: Updated admin dashboard with 2-column mobile grid and responsive stats cards
- January 14, 2025: Category pages now fully responsive with adaptive hero sections and video grids
- January 14, 2025: MAJOR FEATURE UPDATE - Fixed video completion badge UI overlap issues on category pages
- January 14, 2025: Fixed API request format for rating and comment submissions (method, url, data parameter order)
- January 14, 2025: Created comprehensive student dashboard (/dashboard) with progress tracking, bookmarks, watch history, and learning sessions
- January 14, 2025: Implemented detailed student analytics page (/admin/student/:id) for admin users with real-time monitoring capabilities
- January 14, 2025: Added new API routes for student analytics: /api/user/learning-stats, /api/user/bookmarks, /api/user/watch-history, /api/user/sessions
- January 14, 2025: Added admin-only API routes: /api/admin/users/:id/learning-stats, /api/admin/users/:id/bookmarks, /api/admin/users/:id/watch-history, /api/admin/users/:id/sessions, /api/admin/users/:id/completions
- January 14, 2025: Enhanced admin user management with eye icon button linking to individual student analytics pages
- January 14, 2025: Added Dashboard navigation button for non-admin users on homepage
- January 14, 2025: Implemented comprehensive learning analytics with category progress tracking, learning streaks, and device usage analytics
- January 14, 2025: MAJOR UI FIX - Fixed video completion badge overlapping issues on category pages by repositioning badges to prevent conflicts
- January 14, 2025: Moved completion badges to top-left corner stacked vertically below video numbers to eliminate overlap with duration badges
- January 14, 2025: Enhanced database queries to properly join video and category information for analytics pages
- January 14, 2025: Fixed critical undefined video property errors in student analytics by updating getUserWatchHistory method
- January 14, 2025: Applied consistent professional chip/tag-style completion indicators across all pages with minimal variant styling
- January 15, 2025: Fixed invitation email URLs to use proper live Replit domain instead of localhost
- January 15, 2025: Updated email service to construct URLs using REPL_SLUG and REPL_OWNER environment variables
- January 15, 2025: Invitation links now properly point to https://workspace-aurolakshmanan.replit.app for live access
- January 15, 2025: Implemented category-based access control for student users
- January 15, 2025: Created "Other" category for general videos accessible to all students
- January 15, 2025: Students now only see videos from assigned categories plus "Other" category
- January 15, 2025: Updated getCategories and getVideos methods to respect user category assignments
- January 15, 2025: Restored original VideoLearn Pro branding after deployment changes
- January 15, 2025: Fixed app settings to show proper branding (VideoLearn Pro instead of Zmartclass)
- January 15, 2025: Maintained all production data integrity during branding restoration

## User Preferences

Preferred communication style: Simple, everyday language.