# CompanyHub Admin Dashboard - Quick Reference Guide

## 🚀 Quick Start

### Start the Application
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Access:**
- Frontend: http://localhost:3003
- Backend API: http://localhost:5003/api

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| User | user@example.com | user123 |

---

## 📍 Navigation Map

### Main Menu (Sidebar)
- **Dashboard** - Overview & Analytics
- **Employees** - Manage team members
- **Roles & Permissions** - Access control
- **Activity Logs** - System activity
- **Reports** - Analytics & Reports
- **Settings** - System configuration

---

## 👥 Employee Management

### Add Employee
1. Click "Add Employee" button
2. Fill in form:
   - First Name
   - Last Name
   - Email
   - Password
   - Confirm Password
   - Role (User/Admin)
   - Status (Active/Inactive/Suspended)
3. Click "Add Employee"

### Edit Employee
1. Click Edit icon (pencil) in employee row
2. Update fields
3. Click "Save Changes"

### View Employee Details
1. Click View icon (eye) in employee row
2. See full employee information
3. Click "Close" to dismiss

### Delete Employee
1. Click Delete icon (trash) in employee row
2. Confirm deletion
3. Employee is permanently removed

### Search Employees
1. Use search bar at top
2. Type name or email
3. Results filter in real-time

---

## 🔐 Security & Roles

### Role Permissions

**Administrator**
- ✅ Manage Users
- ✅ Manage Roles
- ✅ View Reports
- ✅ System Settings
- ✅ View Logs
- ✅ Delete Data

**Manager**
- ✅ Manage Users
- ✅ View Reports
- ✅ View Logs
- ❌ Manage Roles
- ❌ System Settings
- ❌ Delete Data

**User**
- ✅ View Reports
- ❌ Manage Users
- ❌ Manage Roles
- ❌ System Settings
- ❌ View Logs
- ❌ Delete Data

---

## 📊 Dashboard Metrics

- **Total Employees** - Count of all employees
- **Active Employees** - Count of active users
- **Administrators** - Count of admin users
- **System Alerts** - Important notifications
- **Quick Actions** - Common tasks

---

## 📋 Activity Logs

### Filter Activities
- All Activities
- Login
- Logout
- User Created
- User Updated
- User Deleted
- Role Changed

### Search Activities
- Search by user name
- Search by email
- Search by action description

### Export Logs
- Click "Export" button (UI ready for implementation)

---

## ⚙️ System Settings

### General Settings
- Company Name
- Company Email
- Timezone
- Language

### Security Settings
- Session Timeout (minutes)
- Password Expiry (days)
- Two-Factor Authentication (toggle)
- IP Whitelist (toggle)

### Notifications
- Email Notifications
- Login Alerts
- Security Alerts
- Weekly Reports

### Data & Backup
- Automatic Backup (toggle)
- Backup Frequency
- Data Retention (days)
- Manual Backup Button

---

## 🔄 API Endpoints

### Authentication
```
POST   /api/auth/login          - Login
POST   /api/auth/logout         - Logout
GET    /api/auth/me             - Get current user
PUT    /api/auth/profile        - Update profile
```

### Users
```
GET    /api/users               - Get all users (admin)
GET    /api/users/:id           - Get single user
POST   /api/users               - Create user (admin)
PUT    /api/users/:id           - Update user (admin)
DELETE /api/users/:id           - Delete user (admin)
```

### Health
```
GET    /api/health              - Health check
```

---

## 🗄️ Database Schema

### Users Table
```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE NOT NULL
first_name      TEXT NOT NULL
last_name       TEXT NOT NULL
password_hash   TEXT NOT NULL
role            TEXT (admin, user)
status          TEXT (active, inactive, suspended)
avatar          TEXT
last_login      TIMESTAMP
login_count     INTEGER
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🛠️ Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
PORT=5003
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5003/api
NEXT_PUBLIC_APP_NAME=Admin Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=development
```

---

## 📦 Key Dependencies

### Backend
- express - Web framework
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- @supabase/supabase-js - Database client
- cors - CORS middleware
- helmet - Security headers
- express-rate-limit - Rate limiting

### Frontend
- next - React framework
- react - UI library
- tailwindcss - CSS framework
- lucide-react - Icons
- axios - HTTP client (optional)

---

## 🐛 Common Issues & Solutions

### Issue: Port Already in Use
**Solution:** System automatically tries next port (3003 → 3004, etc.)

### Issue: CORS Errors
**Solution:** Check backend CORS configuration includes frontend URL

### Issue: Login Fails
**Solution:** 
1. Verify Supabase credentials
2. Check database is seeded
3. Clear browser cache/localStorage

### Issue: API Not Responding
**Solution:**
1. Verify backend is running
2. Check port configuration
3. Verify network connectivity

### Issue: Database Connection Error
**Solution:**
1. Verify Supabase credentials in .env
2. Check internet connection
3. Verify Supabase project is active

---

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

All pages are fully responsive and mobile-friendly.

---

## 🎨 Color Scheme

- **Primary**: Blue (#2563EB)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)
- **Gray**: Gray (#6B7280)

---

## 📞 File Locations

| Feature | Frontend | Backend |
|---------|----------|---------|
| Login | pages/login.js | routes/auth-supabase.js |
| Dashboard | pages/dashboard.js | routes/dashboard.js |
| Employees | pages/employees.js | routes/users-supabase.js |
| Activity | pages/activity.js | - |
| Roles | pages/roles.js | - |
| Settings | pages/settings.js | - |
| Auth | src/lib/auth.js | middleware/auth-supabase.js |
| Layout | src/components/Layout/ | - |

---

## ✅ Checklist for Deployment

- [ ] Update Supabase credentials
- [ ] Set NODE_ENV=production
- [ ] Update API URLs for production
- [ ] Configure CORS for production domain
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Set up SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring/logging
- [ ] Test all features
- [ ] Create admin account
- [ ] Document deployment process

---

## 🔗 Useful Links

- **Supabase**: https://supabase.com
- **Next.js**: https://nextjs.org
- **Express.js**: https://expressjs.com
- **Tailwind CSS**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev

---

**Version**: 1.0.0  
**Last Updated**: December 30, 2025
