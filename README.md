# 🎓 School Project Platform by AZsubay.dev

A Netflix-style full-stack web application for browsing, managing, and showcasing school projects with advanced features like user authentication, admin dashboard, and project wishlist functionality.

## 🚀 Features

### 🎯 Core Features
- **Netflix-style Video Slider**: Auto-playing video advertisements and project intros
- **Project Showcase**: Grid layout with detailed project cards
- **User Authentication**: Secure login/registration system with JWT
- **Project Wishlist**: Add/remove projects from personal cart
- **Admin Dashboard**: Complete admin panel for managing users, projects, and ads
- **Responsive Design**: Mobile-first approach with Netflix-inspired dark theme

### 🔐 User System
- **Registration**: Advanced form validation with modern UI
- **Login**: Login with username or email
- **User Dashboard**: View saved projects and manage profile
- **Profile Management**: Update user details

### 👨‍💼 Admin System
- **Admin Login**: Secure admin authentication
- **User Management**: View, edit, and delete users
- **Project Management**: Add, edit, and delete projects
- **Advertisement Management**: Upload and manage video ads for slider
- **Activity Logs**: View site activity and user actions
- **Statistics Dashboard**: Real-time platform analytics

### 📂 Project Details
Each project includes:
- Project name and description
- Technology stack used
- Folder structure example
- GitHub repository link
- Preview images/videos
- Detailed project information modal

### 🛒 Cart/Wishlist System
- Add projects to personal wishlist
- View saved projects from dashboard
- One-click add/remove functionality
- Persistent storage across sessions

## 🎨 UI/UX Design

### Netflix-Inspired Theme
- **Dark Theme**: Professional black and red color scheme
- **Video Slider**: Auto-advancing with manual controls
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Modern Components**: Cards, modals, and interactive elements

### Key Design Elements
- **Primary Color**: Netflix-style red (#e50914)
- **Dark Background**: Professional black theme
- **Typography**: Clean, readable fonts
- **Icons**: Font Awesome integration
- **Images**: High-quality project previews

## ⚙️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with connection pooling
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet.js, CORS, bcrypt password hashing
- **Validation**: Express-validator
- **File Upload**: Multer (for future media uploads)

### Frontend
- **Languages**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Font Awesome 6.4.0
- **Architecture**: Component-based structure
- **API**: Fetch API with async/await
- **State Management**: LocalStorage for persistence

### Database Schema
- **users**: User authentication and roles
- **projects**: Project information and details
- **cart**: User wishlist functionality
- **ads**: Video advertisements for slider
- **activity_logs**: System activity tracking

## 📦 Project Structure

```
school-project-platform/
│── backend/
│   ├── server.js                 # Main server file
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── projects.js          # Project management routes
│   │   └── admin.js             # Admin panel routes
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   └── config/
│       └── db.js                # Database configuration
│
│── frontend/
│   ├── index.html               # Main landing page
│   ├── css/
│   │   └── style.css            # Main stylesheet
│   ├── js/
│   │   ├── api.js               # API service layer
│   │   ├── auth.js              # Authentication handler
│   │   └── main.js              # Main application logic
│   ├── pict/                    # Project images
│   └── Social-icons/            # Social media icons
│
│── database/
│   └── schema.sql              # Database schema
│
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies
└── README.md                   # This file
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- Git (for version control)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AZsubay/school-project-platform.git
   cd school-project-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database named `school_project_platform`
   - Import the database schema:
     ```bash
     mysql -u root -p school_project_platform < database/schema.sql
     ```

4. **Environment Configuration**
   - Copy the environment template:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your database credentials:
     ```
     DB_HOST=localhost
     DB_USER=your_mysql_user
     DB_PASSWORD=your_mysql_password
     DB_NAME=school_project_platform
     PORT=5000
     JWT_SECRET=your-super-secret-jwt-key
     ```

5. **Start the Application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the Application**
   - Open your browser and go to: `http://localhost:5000`
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`

## 📊 Default Data

The database schema includes sample data:
- **Admin User**: `admin` / `admin123`
- **Sample Projects**: 6 educational projects with various tech stacks
- **Sample Ads**: 3 video advertisements for the slider

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects/:id/cart` - Add project to cart
- `DELETE /api/projects/:id/cart` - Remove from cart
- `GET /api/projects/cart/my` - Get user's cart

### Admin (Protected)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/ads` - Get all ads
- `POST /api/admin/ads` - Create new ad
- `PUT /api/admin/ads/:id` - Update ad
- `DELETE /api/admin/ads/:id` - Delete ad
- `GET /api/admin/logs` - Get activity logs
- `GET /api/admin/stats` - Get dashboard statistics

### Public
- `GET /api/ads/active` - Get active ads for slider

## 🎯 Usage Guide

### For Users
1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Projects**: View featured projects in the grid layout
3. **Watch Videos**: Enjoy the Netflix-style video slider
4. **Save Projects**: Click the heart icon to add projects to your wishlist
5. **View Details**: Click "View Details" for comprehensive project information
6. **Access Dashboard**: View your saved projects and profile

### For Admins
1. **Admin Login**: Use admin credentials to access the admin panel
2. **Manage Users**: View, edit, or delete user accounts
3. **Manage Projects**: Add new projects or edit existing ones
4. **Manage Ads**: Upload and manage video advertisements
5. **View Analytics**: Monitor platform activity and statistics
6. **Activity Logs**: Track user actions and system events

## 🛠️ Development Workflow

### Git Workflow
```bash
# Create new feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request for review
```

### Feature Branches
- `feature/auth-system` - Authentication implementation
- `feature/admin-dashboard` - Admin panel development
- `feature/video-slider` - Netflix-style slider
- `feature/project-management` - Project CRUD operations
- `feature/cart-system` - Wishlist functionality

## 🚀 Deployment

### Local Development
1. Follow the setup instructions above
2. Run `npm run dev` for development with auto-restart
3. Access at `http://localhost:5000`

### Production Deployment
1. **Environment Setup**: Configure production environment variables
2. **Database**: Use production MySQL database
3. **Build**: Optimize assets for production
4. **Deploy**: Use platforms like Heroku, Vercel, or Render

### Environment Variables for Production
```env
DB_HOST=production-db-host
DB_USER=production-db-user
DB_PASSWORD=production-db-password
DB_NAME=school_project_platform
PORT=5000
FRONTEND_URL=https://your-domain.com
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (User/Admin)
- Protected routes with middleware
- Session management

### Data Validation
- Input validation on all forms
- SQL injection prevention
- XSS protection
- CSRF protection

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy
- X-Frame-Options

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: 767px and below

### Mobile Features
- Hamburger menu navigation
- Touch-friendly buttons
- Optimized card layouts
- Responsive video slider

## 🎨 Customization

### Theme Customization
Edit CSS variables in `frontend/css/style.css`:
```css
:root {
    --primary-color: #e50914;    /* Change primary color */
    --secondary-color: #141414;  /* Change secondary color */
    --accent-color: #f5f5f1;     /* Change accent color */
}
```

### Logo and Branding
- Replace logo in navigation bar
- Update footer information
- Customize color scheme
- Add your own social media links

## 🐛 Known Issues

### Current Limitations
- Video slider uses sample videos (replace with your own)
- Project images are placeholders (add your own project images)
- Some features show "coming soon" messages
- Email verification not implemented
- Password reset functionality not included

### Future Enhancements
- Email verification system
- Password reset functionality
- Project rating and reviews
- Advanced search and filtering
- Project categories and tags
- User profiles and portfolios
- Real-time notifications
- Chat system for users

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Follow coding standards and best practices
4. **Test**: Ensure all functionality works correctly
5. **Commit**: `git commit -m 'Add your feature'`
6. **Push**: `git push origin feature/your-feature`
7. **Pull Request**: Create detailed PR for review

### Coding Standards
- Use ES6+ JavaScript features
- Follow consistent naming conventions
- Write clean, commented code
- Ensure responsive design
- Test across different browsers

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Netflix Design**: Inspiration for the UI/UX design
- **Font Awesome**: For the amazing icon library
- **MySQL**: For the robust database system
- **Node.js**: For the powerful runtime environment
- **Express.js**: For the minimalist web framework

## 📞 Support

For support and questions:
- **GitHub Issues**: Create an issue for bugs or feature requests
- **Email**: contact@azsubay.dev
- **Website**: https://azsubay.dev

---

**Built with ❤️ by AZsubay.dev for the educational community**

*Empowering students with quality educational projects and resources since 2025*
