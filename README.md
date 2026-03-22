# BrgyDesk - Barangay Service Portal

A production-ready, multi-tenant barangay portal system for digitizing government services. Built with Next.js, Express.js, and Supabase.

## 🚀 Features

### **Professional UI/UX**
- Modern, clean interface with professional color scheme
- Responsive design that works on all devices
- Loading skeletons and smooth animations
- Interactive notifications and user menus
- Persistent sidebar navigation with icons

### **Employee Management**
- Complete employee directory with data table
- Role-based access control (Admin/User)
- Employee status management (Active/Inactive/Suspended)
- Advanced search and filtering capabilities
- Bulk actions and individual employee management

### **Dashboard Analytics**
- Real-time metrics with trend indicators
- Employee statistics and activity monitoring
- System alerts and notifications
- Quick action buttons for common tasks

### **Security & Authentication**
- JWT-based authentication system
- Password hashing with bcrypt
- Role-based route protection
- Session management and auto-logout

### **System Features**
- Activity logging and audit trails
- System notifications and alerts
- Professional reporting system
- Settings and configuration management

## 🛠 Tech Stack

### **Frontend**
- **Next.js 14** - React framework with SSR
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Elegant notifications

### **Backend**
- **Node.js + Express.js** - Server framework
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Express Rate Limit** - API protection

### **Development Tools**
- **Nodemon** - Auto-restart development server
- **PM2** - Production process manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18+ installed
- MongoDB installed and running
- Git for version control

### **Quick Start**

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd admin-dashboard
   npm install
   ```

2. **Setup Database**
   ```bash
   # Start MongoDB service
   net start MongoDB
   
   # Seed the database with sample data
   cd backend
   node scripts/seedDatabase.js
   ```

3. **Start Development Servers**
   ```bash
   # Option 1: Use the convenient batch file
   start-dashboard.bat
   
   # Option 2: Manual start
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   ```

4. **Access the Dashboard**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### **Login Credentials**
```
Administrator:
Email: admin@example.com
Password: admin123

Employee:
Email: user@example.com  
Password: user123
```

## 🏗 Project Structure

```
admin-dashboard/
├── backend/                 # Express.js API server
│   ├── middleware/         # Authentication, validation, error handling
│   ├── models/            # MongoDB schemas (User, etc.)
│   ├── routes/            # API endpoints (auth, users, dashboard)
│   ├── scripts/           # Database seeding and utilities
│   └── server.js          # Main server file
├── frontend/               # Next.js application
│   ├── pages/             # Route pages (login, dashboard)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Layout/    # Header, Sidebar, Layout
│   │   │   └── UI/        # Buttons, Modals, Tables
│   │   ├── lib/           # Utilities and helpers
│   │   └── styles/        # Global CSS and Tailwind
│   └── public/            # Static assets
├── start-dashboard.bat     # Easy startup script
└── README.md              # This file
```

## 🎨 UI Components

### **Navigation**
- **Sidebar**: Persistent navigation with icons and descriptions
- **Header**: Search, notifications, user menu
- **Breadcrumbs**: Page navigation context

### **Data Display**
- **Metric Cards**: Statistics with trend indicators
- **Data Tables**: Sortable, filterable employee lists
- **Status Badges**: Color-coded role and status indicators
- **Loading States**: Skeleton screens for better UX

### **Interactive Elements**
- **Notifications**: Real-time system alerts
- **User Menu**: Profile access and settings
- **Action Buttons**: Quick access to common tasks
- **Search**: Global search functionality

## 🔧 Configuration

### **Environment Variables**

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/admin_dashboard
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### **Database Configuration**
- Database: `admin_dashboard`
- Collections: `users`
- Indexes: email, role, status, createdAt

## 🚀 Production Deployment

### **Using PM2 (Recommended)**
```bash
# Install PM2 globally
npm install -g pm2

# Start production servers
npm run start:prod

# Monitor processes
pm2 status
pm2 logs
```

### **Manual Production Setup**
```bash
# Build frontend
cd frontend && npm run build

# Start backend in production
cd backend && NODE_ENV=production node server.js

# Serve frontend (using PM2 or nginx)
pm2 start ecosystem.config.js
```

## 📊 Features Overview

### **Dashboard Page**
- Employee metrics with trend indicators
- System alerts and notifications  
- Employee directory table
- Quick action buttons

### **Employee Management**
- Complete CRUD operations
- Role assignment (Admin/User)
- Status management (Active/Inactive/Suspended)
- Bulk operations support

### **Security Features**
- JWT authentication
- Password hashing
- Role-based access control
- Session management
- Rate limiting

### **System Administration**
- Activity logging
- System notifications
- Performance monitoring
- Configuration management

## 🔍 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### **Users**
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### **Dashboard**
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity

## 🛡 Security Best Practices

- **Password Security**: bcrypt hashing with salt rounds
- **JWT Tokens**: Secure token generation and validation
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Proper cross-origin setup
- **Environment Variables**: Sensitive data protection

## 🎯 Business Context

This system is designed as a **Company Internal Management System** where:
- **Users** represent company employees
- **Roles** define access levels and permissions
- **Dashboard** provides real-time business insights
- **Reports** offer analytics for decision making

## 📱 Responsive Design

The dashboard is fully responsive and optimized for:
- **Desktop**: Full sidebar navigation and data tables
- **Tablet**: Collapsible sidebar with touch-friendly interface  
- **Mobile**: Hamburger menu and stacked layouts

## 🔄 Development Workflow

### **Adding New Features**
1. Create API endpoints in `backend/routes/`
2. Add database models in `backend/models/`
3. Build UI components in `frontend/src/components/`
4. Create pages in `frontend/pages/`
5. Update navigation in `Sidebar.js`

### **Styling Guidelines**
- Use Tailwind CSS utility classes
- Follow the established color scheme (primary blue)
- Maintain consistent spacing and typography
- Use the component library for common elements

## 📈 Performance Optimization

- **Frontend**: Next.js SSR and code splitting
- **Backend**: MongoDB indexing and query optimization
- **Caching**: JWT token caching and session management
- **Assets**: Optimized images and lazy loading

## 🧪 Testing

### **Manual Testing**
```bash
# Test login functionality
node test-frontend-login.js

# Check database users
cd backend && node check-users.js

# View user details
cd backend && node view-users.js
```

### **API Testing**
Use the debug page at `http://localhost:3000/debug` to test API endpoints.

## 📞 Support & Maintenance

### **Common Issues**
- **MongoDB Connection**: Ensure MongoDB service is running
- **Port Conflicts**: Check if ports 3000/5000 are available
- **Authentication**: Clear localStorage and re-login
- **Database**: Re-run seed script if data is corrupted

### **Monitoring**
- Use PM2 for process monitoring in production
- Check logs regularly for errors
- Monitor database performance
- Track user activity and system usage

## 🎉 Ready for Production

This dashboard is designed to be:
- **Client-Ready**: Professional appearance suitable for demos
- **Portfolio-Worthy**: Showcases modern development practices
- **Production-Grade**: Scalable architecture and security
- **Business-Focused**: Real-world functionality for companies

---

**CompanyHub** - Professional Internal Management System  
Built with ❤️ using modern web technologies