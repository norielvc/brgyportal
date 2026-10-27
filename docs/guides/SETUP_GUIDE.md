# Setup Guide - Troubleshooting

## Quick Fix Steps

### 1. Run Troubleshooting Script
```cmd
troubleshoot.bat
```
This will check all prerequisites and common issues.

### 2. Test Basic Setup
```cmd
test-setup.bat
```
This will start both servers and test connectivity.

### 3. Manual Step-by-Step Setup

#### Step 1: Install Prerequisites
1. **Node.js** (v18+): https://nodejs.org/
2. **MongoDB Community**: https://www.mongodb.com/try/download/community
3. **Git**: https://git-scm.com/download/win

#### Step 2: Install Dependencies
```cmd
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### Step 3: Setup Environment Files
```cmd
# Copy environment files
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
```

#### Step 4: Start MongoDB
```cmd
# Start MongoDB service
net start MongoDB

# OR start manually if service doesn't work
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```

#### Step 5: Seed Database
```cmd
cd backend
npm run seed
cd ..
```

#### Step 6: Start Servers

**Option A: Both servers together**
```cmd
npm run dev
```

**Option B: Separate terminals**
```cmd
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

#### Step 7: Test Access
- Health check: http://localhost:3000/health
- Dashboard: http://localhost:3000
- API: http://localhost:5000/api/health

## Common Issues & Solutions

### Issue 1: "This site can't be reached"

**Possible Causes:**
- Servers not started
- Wrong ports
- Firewall blocking
- Antivirus interference

**Solutions:**
1. Check if servers are running:
   ```cmd
   netstat -an | find ":3000"
   netstat -an | find ":5000"
   ```

2. Try different ports in `.env` files:
   ```
   # backend/.env
   PORT=5001
   
   # frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

3. Disable Windows Firewall temporarily
4. Add Node.js to antivirus exceptions

### Issue 2: MongoDB Connection Error

**Solutions:**
1. Install MongoDB Community Edition
2. Create data directory: `mkdir C:\data\db`
3. Start MongoDB service: `net start MongoDB`
4. Check MongoDB is running: `mongo --eval "db.runCommand('ping')"`

### Issue 3: Port Already in Use

**Solutions:**
1. Kill existing processes:
   ```cmd
   taskkill /f /im node.exe
   ```
2. Find and kill specific port:
   ```cmd
   netstat -ano | findstr :3000
   taskkill /PID <PID_NUMBER> /F
   ```

### Issue 4: Next.js Compilation Errors

**Solutions:**
1. Clear cache:
   ```cmd
   cd frontend
   rm -rf .next
   npm cache clean --force
   npm install
   ```

2. Check Node.js version: `node --version` (should be 18+)

### Issue 5: Permission Errors

**Solutions:**
1. Run Command Prompt as Administrator
2. Set npm permissions:
   ```cmd
   npm config set cache C:\npm-cache --global
   ```

## Testing Individual Components

### Test Backend Only
```cmd
cd backend
npm run dev
# Visit: http://localhost:5000/api/health
```

### Test Frontend Only
```cmd
cd frontend
npm run dev
# Visit: http://localhost:3000/health
```

### Test Database Connection
```cmd
cd backend
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/admin_dashboard')
  .then(() => console.log('DB Connected'))
  .catch(err => console.log('DB Error:', err));
"
```

## Network Access (Optional)

To access from other devices on your network:

1. Find your IP address:
   ```cmd
   ipconfig
   ```

2. Update environment files:
   ```
   # frontend/.env.local
   NEXT_PUBLIC_API_URL=http://YOUR-IP:5000/api
   ```

3. Configure Windows Firewall to allow ports 3000 and 5000

4. Access from other devices:
   - http://YOUR-IP:3000

## Default Login Credentials

After seeding the database:
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

## Getting Help

If you're still having issues:

1. Check the server console output for specific error messages
2. Look at browser developer tools (F12) for JavaScript errors
3. Verify all files were created correctly
4. Try restarting your computer
5. Run the troubleshoot.bat script again

## Alternative: Docker Setup (Advanced)

If you continue having issues, consider using Docker:

```dockerfile
# Create Dockerfile in root directory
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000 5000
CMD ["npm", "run", "dev"]
```

This ensures a consistent environment regardless of your Windows setup.