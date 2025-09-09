# VideoLearn Pro - Video Learning Management Platform

## Overview

VideoLearn Pro is a modern web application designed for video-based learning management. It enables users to browse, watch, and manage educational videos, featuring user authentication with email verification, categorized content organization, admin management capabilities, and YouTube video integration. The platform aims to provide a streamlined, efficient, and engaging video learning experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: Responsive and mobile-first approach using Tailwind CSS with shadcn/ui.
- **Components**: Utilizes Radix UI primitives for accessible components and Lucide React for iconography.
- **Interaction**: Features modal-based video player, real-time search and filtering, toast notifications, and comprehensive admin dashboards.
- **Branding**: Customizable branding (currently "Zmartclass by De mentee") with a logo upload feature (though currently disabled, relies on text-only branding).
- **Landing Page**: Modern, conversion-optimized landing page with hero section, login/registration, course showcase, and informational sections (About Us, Programs, Jobs, Contact).

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite for build, TanStack Query for state, Wouter for routing, and React Hook Form with Zod for forms.
- **Backend**: Node.js with Express.js (TypeScript, ES modules), Passport.js for authentication (local strategy, session management), and connect-pg-simple for PostgreSQL-backed sessions.
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM for type-safe operations and Drizzle Kit for schema management/migrations.
- **Authentication**: Email-based registration with OTP verification via Nodemailer, crypto.scrypt for password hashing, session-based auth with PostgreSQL storage, and role-based access control (admin/user/public).
- **Video Management**: YouTube Data API integration for metadata, multi-category organization (primary/secondary categories), search functionality, view tracking, and admin-only management (add/edit/delete).
- **Content Organization**: Categories for video classification, user-category assignment for restricted access, tag-based metadata, view counting, and analytics dashboards.
- **User Management**: Support for both admin-invited students and public self-registered users. Public users are initially restricted to a "Public Library" category but can be converted to students by admins.
- **Analytics**: Comprehensive device and location tracking (device type, browser, OS, country, city, timezone, screen resolution) for watch history and user sessions, viewable in student analytics dashboards.
- **File Uploads**: Handles image uploads (e.g., for category covers) with Multer, ensuring persistence across deployments using backup/restore scripts.
- **Email Service**: Uses Nodemailer for email delivery (e.g., OTP, invitations) with robust configuration and error handling.
- **Search**: Dynamic search with real-time filtering, debouncing, loading indicators, and local feedback.
- **Mobile Responsiveness**: Complete mobile-first responsive design across all pages and components, including collapsible sidebars and optimized table layouts.

### System Design Choices
- **Data Flow**: Structured flow for user registration, video discovery/consumption, admin management, and data persistence.
- **Modularity**: Separation of concerns between frontend, backend, and database layers.
- **Security**: Robust authentication with password hashing, session management, and role-based access control.
- **Error Handling**: Graceful error handling, particularly for server initialization and external service failures (e.g., SMTP, YouTube API).
- **Deployment**: Utilizes Vite for optimized builds, esbuild for server bundling, environment-based configuration, and Drizzle migrations for schema versioning. Includes specific health check endpoints for deployment platforms.

## External Dependencies

- **Frontend**: React, React DOM, React Query, Vite, Wouter, React Hook Form, Zod.
- **Styling/UI**: Tailwind CSS, shadcn/ui, Radix UI, Lucide React.
- **Backend**: Node.js, Express.js, Passport.js, connect-pg-simple.
- **Database**: Neon PostgreSQL, Drizzle ORM, Drizzle Kit.
- **Third-party APIs**: YouTube Data API.
- **Email**: Nodemailer.
- **Utilities**: date-fns, clsx, Multer (for file uploads).