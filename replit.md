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
- Video progress tracking with completion status and watch time
- Video bookmarks with timestamps and optional notes
- User watchlist for saving videos to watch later

### User Interface Components
- Responsive design with mobile-first approach
- Enhanced modal-based video player with YouTube embeds
- Real-time search and filtering
- Admin dashboard with statistics and management tools
- User dashboard with progress tracking and learning analytics
- Video bookmark creation and management interface
- Watchlist functionality with add/remove capabilities
- Progress bars and completion status indicators
- Toast notifications for user feedback

### Content Organization
- Categories for video classification
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
- July 09, 2025: YouTube Data API v3 integration completed successfully
- July 09, 2025: SMTP email verification system successfully configured with Gmail App Password
- July 09, 2025: YouTube video fallback system implemented for admin video management
- July 09, 2025: Test user accounts created for immediate testing access
- July 09, 2025: Default video categories created (Programming, Web Development, Data Science, etc.)
- July 09, 2025: Full video learning platform deployment ready
- July 09, 2025: Video progress tracking and bookmarks feature implemented with complete database schema
- July 09, 2025: Enhanced video player modal with progress tracking, bookmark creation, and watchlist functionality
- July 09, 2025: User dashboard created with progress statistics, bookmark management, and watchlist view
- July 09, 2025: Mentor profile page implemented with avatar display, personal details, and logout functionality
- July 09, 2025: Test mentor account created and integrated with authentication system
- July 09, 2025: Redesigned mentor profile page with LinkedIn-style professional layout and sections
- July 09, 2025: Added photo upload functionality for mentor profile photos and background images with multer integration
- July 09, 2025: Enhanced mentor profile banner layout with proper text spacing and prominent name display next to profile picture

## User Preferences

Preferred communication style: Simple, everyday language.