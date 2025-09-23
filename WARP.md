# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Netflix-inspired full-stack school project platform built by AZsubay.dev. It allows students to browse, save, and manage educational projects with features like video advertisements, user authentication, and an admin dashboard.

## Architecture

### Tech Stack
- **Backend**: Node.js with Express.js framework
- **Database**: MySQL with connection pooling
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (no frameworks)
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet.js, CORS, express-validator

### Key Components
- **Server**: `backend/server.js` - Main Express server with middleware configuration
- **Database**: MySQL schema with users, projects, cart, orders, ads, and activity logs
- **Authentication**: JWT-based auth with role-based access control (user/admin)
- **API Layer**: RESTful API with modular route handlers
- **Frontend**: Component-based vanilla JavaScript architecture with separate handlers

### Database Schema
- `users` - User accounts with role-based access
- `projects` - School projects with tech stack, pricing, and media
- `cart` - User wishlist/cart functionality  
- `orders` & `order_items` - E-commerce order management
- `payments` - Payment processing records
- `ads` - Video advertisements for Netflix-style slider
- `activity_logs` - System activity tracking
- `contact_messages` - Contact form submissions

### Frontend Architecture
- **API Service** (`js/api.js`) - Centralized API communication layer
- **Auth Handler** (`js/auth.js`) - Authentication state management
- **App Handler** (`js/main.js`) - Main application logic and UI management
- **Component-based structure** - Modular JavaScript classes for different features

## Common Development Commands

### Setup and Installation
```bash
# Install dependencies
npm install

# Setup database (MySQL required)
mysql -u root -p school_project_platform < database/schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your database credentials
```

### Development
```bash
# Start development server with auto-reload
npm run dev

# Start production server  
npm start

# Run using nodemon for development
npx nodemon backend/server.js
```

### Database Operations
```bash
# Import/reset database schema
mysql -u root -p school_project_platform < database/schema.sql

# Access MySQL console
mysql -u root -p school_project_platform
```

### Testing and Debugging
```bash
# Check server health
curl http://localhost:5000/api/health

# View server logs
npm run dev # Logs appear in console

# Test API endpoints
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"login":"admin","password":"admin123"}'
```

## Development Workflow

### Environment Configuration
- Copy `.env` file and configure database credentials
- Default port is 5000, configurable via `PORT` environment variable
- JWT secret should be changed for production deployments
- Database connection uses connection pooling for performance

### Database Management
- Schema includes sample data with admin user (admin/admin123)
- Projects, ads, and users are pre-populated for testing
- Activity logging is automatic for user actions
- Foreign key constraints ensure data integrity

### Authentication Flow
- JWT tokens expire after 24 hours
- Role-based access: 'user' and 'admin' roles
- Admin middleware protects sensitive routes
- Token stored in localStorage on frontend

### API Development
- RESTful API design with proper HTTP status codes
- Input validation using express-validator
- Error handling middleware for consistent responses
- CORS configured for frontend/backend communication

## Key Development Areas

### Backend Development
- Route handlers in `backend/routes/` for auth, projects, admin, orders, contact
- Middleware in `backend/middleware/` for authentication and authorization
- Database queries use prepared statements via mysql2 connection pool
- Activity logging automatically tracks user actions

### Frontend Development  
- Vanilla JavaScript with class-based component architecture
- No build process - direct file serving
- API service layer abstracts HTTP communication
- Authentication state managed globally
- Modal-based UI for forms and detailed views

### Admin Features
- Full CRUD operations for users, projects, and ads
- Activity logging and statistics dashboard
- User role management and access control
- Video advertisement management for slider

### E-commerce Features
- Shopping cart/wishlist functionality
- Order processing with multiple payment methods
- Project pricing and licensing options
- Download links for purchased projects

## Important Files

### Configuration
- `backend/server.js` - Main server configuration and middleware
- `backend/config/db.js` - Database connection and query utilities
- `.env` - Environment variables (database, JWT secret)

### Authentication & Security
- `backend/middleware/auth.js` - JWT authentication and admin authorization
- `backend/routes/auth.js` - User registration, login, and profile management

### Database
- `database/schema.sql` - Complete database schema with sample data
- Includes foreign key relationships and proper indexing

### Frontend Core
- `frontend/index.html` - Main page with Netflix-style video slider
- `frontend/js/api.js` - Centralized API service layer
- `frontend/js/auth.js` - Authentication UI and state management
- `frontend/js/main.js` - Core application logic and UI management

### Admin Interface
- Admin dashboard with user/project/ad management
- Activity logging and platform statistics
- Role-based access control throughout

## Security Considerations

- JWT tokens for stateless authentication
- Bcrypt password hashing with salt rounds
- SQL injection prevention through prepared statements
- XSS protection via Helmet.js security headers
- CORS configuration for cross-origin requests
- Input validation on all user inputs
- Admin-only routes protected by middleware

## Default Credentials

- **Admin User**: username `admin`, password `admin123`
- **Database**: Default empty password for MySQL root user (development only)
- **JWT Secret**: Change `JWT_SECRET` in `.env` for production
