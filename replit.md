# Restaurant Management System

## Overview

This is a full-stack restaurant management system built with modern web technologies. The application provides a comprehensive solution for managing restaurant operations including menu management, order processing, table QR codes, sales tracking, and expense management. The system features both an admin dashboard for restaurant staff and a customer-facing menu interface accessible via QR codes.

## System Architecture

The application follows a monorepo structure with a clear separation between client-side and server-side code:

- **Frontend**: React-based single-page application with TypeScript
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **Build System**: Vite for development and production builds
- **Styling**: TailwindCSS with shadcn/ui component library

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL via Neon serverless with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Session Management**: PostgreSQL session store

### Database Schema
The system includes the following main entities:
- **Users**: Admin authentication and role management
- **Categories**: Product categorization
- **Products**: Menu items with pricing and availability
- **Tables**: Restaurant tables with QR code integration
- **Orders**: Customer orders with status tracking
- **Order Items**: Individual items within orders
- **Sales**: Sales transaction records
- **Expenses**: Business expense tracking

## Data Flow

1. **Customer Flow**: Customers scan QR codes → Access table-specific menu → Place orders → Payment processing
2. **Admin Flow**: Staff login → Manage products/categories → Process orders → Track sales/expenses
3. **Order Processing**: Order creation → Status updates (pending → preparing → ready → completed)
4. **Analytics**: Real-time dashboard with sales metrics and business insights

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe ORM
- **@tanstack/react-query**: Server state management
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **qrcode**: QR code generation
- **date-fns**: Date manipulation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variants
- **react-hook-form**: Form management
- **zod**: Schema validation

## Deployment Strategy

The application is designed for deployment on Replit with the following configuration:

1. **Development**: 
   - Vite dev server with HMR
   - Express server with middleware
   - PostgreSQL database via Neon

2. **Production Build**:
   - Vite builds the frontend to `dist/public`
   - esbuild bundles the backend to `dist/index.js`
   - Static file serving in production mode

3. **Database Management**:
   - Drizzle Kit for schema migrations
   - Environment-based database URL configuration
   - Automatic schema synchronization

The system supports both development and production environments with proper environment variable configuration for database connections and JWT secrets.

## Deployment and Updates Strategy

### Update Mechanisms
1. **Replit Deployment**: Direct GitHub integration for continuous deployment
2. **Database Migrations**: Drizzle Kit for safe schema updates
3. **Configuration Updates**: Environment variables for settings changes
4. **Super Admin System**: Complete system reset and transfer capabilities

### Update Types
- **Feature Updates**: New functionalities through code deployment
- **Database Schema**: Automated migrations with Drizzle
- **Configuration**: Payment methods, currency, business settings
- **Security**: Authentication updates and permission changes

## Changelog
```
Changelog:
- July 07, 2025. Initial setup
- July 07, 2025. Integrated CFA franc (FCFA) as currency throughout the application
- July 07, 2025. Fixed validation schemas for products, expenses, and sales
- July 07, 2025. Added manual sales entry functionality
- July 07, 2025. Resolved authentication and form submission issues
- July 07, 2025. Added detailed order items display in orders section
- July 07, 2025. Implemented intelligent product archiving system
- July 07, 2025. Added expenses card to dashboard with 5-column layout
- July 07, 2025. Created PDF receipt generation system with jsPDF
- July 07, 2025. Fixed token expiration handling and order validation errors
- July 07, 2025. Added Mobile Money provider options (Orange Money, MTN MoMo, Moov, Wave)
- July 07, 2025. Added sales deletion functionality with confirmation dialog
- July 07, 2025. Implemented comprehensive payment configuration system
- July 07, 2025. Added environment variables configuration for Mobile Money providers
- July 07, 2025. Created payment service infrastructure with API endpoints
- July 07, 2025. Added configuration page for testing payment methods
- July 07, 2025. Implemented user management system with roles and permissions
- July 07, 2025. Added user creation, editing, and role assignment functionality
- July 07, 2025. Created granular permission system for fine-grained access control
- July 07, 2025. Fixed QR code order display issue with authentication system
- July 07, 2025. Added real-time notification system for client order status updates
- July 07, 2025. Created automatic admin user creation and improved error handling
- July 07, 2025. Optimized notification system to prevent DOM manipulation errors
- July 07, 2025. Enhanced notification messages with more engaging and friendly customer language
- July 07, 2025. Updated notification message for "preparing" status to mention "transmise au comptoir"
- July 07, 2025. Added comprehensive order tracking system for customers with real-time status updates
- July 07, 2025. Implemented automatic order tracking modal opening after order placement
- July 07, 2025. Added order tracking button in customer menu header for easy access
- July 07, 2025. Updated "ready" status message to indicate table service instead of counter pickup
- July 07, 2025. Fixed order tracking to show only orders for specific customer instead of all table orders
- July 08, 2025. Created comprehensive Super Admin system with separate authentication portal
- July 08, 2025. Added system reset functionality for complete data wipe and restaurant transfer
- July 08, 2025. Fixed API request methods in super admin portal for proper authentication
- July 08, 2025. Implemented dynamic application name system with super admin settings management
- July 08, 2025. Added systemSettings table for flexible key-value configuration storage
- July 08, 2025. Created comprehensive system settings CRUD operations and API endpoints
- July 08, 2025. Fixed JWT authentication issues by adding proper security configuration
- July 08, 2025. Enhanced SystemConfig component with application name customization interface
- July 08, 2025. Fixed DOM manipulation errors in notification system by improving cleanup logic and error handling
- July 08, 2025. Optimized notification polling frequency from 5 to 8 seconds to reduce system load
- July 08, 2025. Added automatic notification cleanup and limited maximum notifications to prevent UI clutter
- July 08, 2025. Fixed real-time order tracking synchronization between admin dashboard and customer interface
- July 08, 2025. Improved cache invalidation to sync all menu endpoints when order status changes
- July 08, 2025. Optimized order tracking refresh rate to 2 seconds for better responsiveness
- July 08, 2025. Converted all CSV export functionality to PDF export in sales and expenses pages
- July 08, 2025. Enhanced real-time notification system with cache busting and improved status change detection
- July 08, 2025. Updated notification message for "pending" status to "Nous préparons tous..." instead of "votre délicieux repas"
- July 08, 2025. Fixed automatic sales creation when orders are completed - now automatically marks payment as paid and creates sales records
- July 08, 2025. Verified complete order-to-sales-to-dashboard workflow integration with automatic FCFA amount calculation
- July 08, 2025. Fixed user creation validation errors for email and phone fields - now accepts empty strings and null values
- July 08, 2025. Implemented automatic assignment of role-based default permissions during user creation
- July 08, 2025. Corrected all existing users to have proper permissions according to their roles
- July 08, 2025. Created comprehensive super admin data management system with individual item deletion capabilities
- July 08, 2025. Added API endpoints for deleting products, orders, sales, expenses, tables, and users from super admin portal
- July 08, 2025. Built tabbed interface for viewing and managing all system data with confirmation dialogs for safe deletion
- July 08, 2025. Enhanced super admin dashboard with direct navigation to data management portal
- July 08, 2025. Implemented unified super admin layout with horizontal navigation bar and intelligent back buttons
- July 08, 2025. Created seamless navigation between dashboard, data management, and system configuration pages
- July 08, 2025. Finalized all super admin portal features with consistent UI/UX across all pages
- July 08, 2025. System ready for production deployment with complete functionality
- July 08, 2025. Fixed super admin login issue by replacing apiRequest with native fetch for reliable authentication
- July 08, 2025. Added deployment update guide for applying fixes to already deployed systems
- July 09, 2025. **CRITICAL QR CODE ROUTING FIX** - Resolved issue where scanning table 8 QR code displayed table 4 menu
- July 09, 2025. Updated QR code generation to use `/table/:tableNumber` format instead of `/menu/:tableNumber` for proper routing
- July 09, 2025. Added frontend route `/table/:tableNumber` that redirects to `/menu/:tableNumber` for consistent user experience
- July 09, 2025. Created API endpoint `/api/admin/fix-qr-codes` to automatically correct existing QR codes with wrong format
- July 09, 2025. Applied QR code fix to all future table generations - all new tables will have correct `/table/` format
- July 09, 2025. **CRITICAL MANAGER INTERFACE FIX** - Resolved table display confusion where manager saw database IDs instead of table numbers
- July 09, 2025. Fixed OrderItem component to display actual table numbers (1, 2, 3...) instead of internal database IDs (10, 14, 18...)
- July 09, 2025. Updated order search functionality to work with display table numbers for intuitive staff filtering
- July 09, 2025. Corrected receipt generation to use proper table numbers for customer documentation
- July 09, 2025. Added API endpoint `/api/admin/regenerate-qr-codes` for global QR code management and updates
- July 09, 2025. Enhanced QR code management interface with bulk regeneration capabilities for all existing tables
- July 11, 2025. **CRITICAL DASHBOARD UPDATE FIX** - Resolved issue where "tables occupées" status didn't update in real-time
- July 11, 2025. Implemented automatic table status management: "available" → "occupied" when orders created, "available" when completed  
- July 11, 2025. Added real-time dashboard refresh (3-5 seconds) with double calculation system for occupied tables accuracy
- July 11, 2025. Created intelligent table status updates considering multiple orders per table scenarios
- July 11, 2025. **NEW FEATURE: Order Notification System** - Added red notification bubble on "Commandes" tab in sidebar
- July 11, 2025. Implemented real-time notification counter showing pending orders count with bounce animation
- July 11, 2025. Added automatic notification dismissal when staff clicks on orders tab or when orders are processed
- July 11, 2025. Enhanced staff workflow with visual alerts for incoming orders requiring counter attention
- August 04, 2025. **RAILWAY DEPLOYMENT PREPARATION** - Configured complete Railway deployment setup
- August 04, 2025. Added railway.json, nixpacks.toml, Procfile for Railway platform compatibility
- August 04, 2025. Created health check endpoint /api/health for Railway monitoring
- August 04, 2025. Prepared comprehensive deployment guide with step-by-step Railway instructions
- August 04, 2025. Configured build scripts for production deployment with esbuild optimization
- August 04, 2025. Added environment variable templates and deployment checklist
- August 04, 2025. System ready for Railway production deployment with PostgreSQL integration
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```