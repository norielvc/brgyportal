# Deployment Guide

## Windows Production Deployment

### Prerequisites
1. **Node.js** (v18+): Download from https://nodejs.org/
2. **MongoDB Community**: Download from https://www.mongodb.com/try/download/community
3. **PM2**: Install globally with `npm install -g pm2`
4. **PM2 Windows Service**: Install with `npm install -g pm2-windows-service`

### Installation Steps

1. **Clone the repository**
   ```cmd
   git clone <repository-url>
   cd admin-dashboard
   ```

2. **Run the installation script**
   ```cmd
   install.bat
   ```

3. **Configure environment variables**
   - Edit `backend/.env` with your production settings
   - Edit `frontend/.env.local` if needed

4. **Start MongoDB service**
   ```cmd
   net start MongoDB
   ```

5. **Seed the database**
   ```cmd
   npm run seed
   ```

6. **Start production servers**
   ```cmd
   start-prod.bat
   ```

### Manual Production Setup

If you prefer manual setup:

1. **Install dependencies**
   ```cmd
   npm run install-all
   ```

2. **Build frontend**
   ```cmd
   cd frontend
   npm run build
   cd ..
   ```

3. **Install PM2 as Windows service**
   ```cmd
   npm install -g pm2
   npm install -g pm2-windows-service
   pm2-service-install
   ```

4. **Start with PM2**
   ```cmd
   pm2 start ecosystem.config.js
   pm2 save
   ```

### PM2 Management Commands

```cmd
pm2 status              # Check application status
pm2 logs                # View logs
pm2 restart all         # Restart all applications
pm2 stop all            # Stop all applications
pm2 delete all          # Delete all applications
pm2 monit               # Monitor applications
```

### Network Access

To access the dashboard from other devices on your network:

1. **Find your local IP address**
   ```cmd
   ipconfig
   ```

2. **Configure Windows Firewall**
   - Allow inbound connections on ports 3000 and 5000
   - Or temporarily disable firewall for testing

3. **Access from other devices**
   - Frontend: `http://YOUR-IP:3000`
   - API: `http://YOUR-IP:5000`

### SSL/HTTPS Setup (Optional)

For production with SSL:

1. **Install reverse proxy (nginx or IIS)**
2. **Configure SSL certificates**
3. **Update environment variables**
   ```
   FRONTEND_URL=https://yourdomain.com
   ```

## Ubuntu Migration

### Changes Required

1. **MongoDB Installation**
   ```bash
   sudo apt update
   sudo apt install -y mongodb
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

2. **PM2 with systemd**
   ```bash
   pm2 startup
   pm2 save
   ```

3. **Nginx Reverse Proxy** (Optional)
   ```bash
   sudo apt install nginx
   ```

   Create `/etc/nginx/sites-available/admin-dashboard`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/admin-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Environment Variables

The same `.env` files work on both Windows and Ubuntu without changes.

### File Permissions

On Ubuntu, ensure proper permissions:
```bash
chmod +x start-dev.sh
chmod +x start-prod.sh
```

## Monitoring and Maintenance

### Log Files
- PM2 logs: `pm2 logs`
- Application logs: `./logs/` directory
- MongoDB logs: Check MongoDB installation directory

### Database Backup
```bash
# Create backup
mongodump --db admin_dashboard --out ./backup/

# Restore backup
mongorestore --db admin_dashboard ./backup/admin_dashboard/
```

### Updates
1. Pull latest code: `git pull`
2. Install dependencies: `npm run install-all`
3. Build frontend: `cd frontend && npm run build`
4. Restart services: `pm2 restart all`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB service is running
   - Check connection string in `.env`

2. **Port Already in Use**
   - Change ports in environment variables
   - Kill existing processes: `taskkill /f /im node.exe` (Windows)

3. **PM2 Service Issues**
   - Reinstall PM2 service: `pm2-service-uninstall && pm2-service-install`
   - Check Windows Event Viewer for service errors

4. **Frontend Build Errors**
   - Clear cache: `npm cache clean --force`
   - Delete node_modules and reinstall

### Performance Optimization

1. **Enable gzip compression** in reverse proxy
2. **Configure MongoDB indexes** for better query performance
3. **Set up CDN** for static assets
4. **Enable caching** for API responses
5. **Monitor resource usage** with PM2 monitoring

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong MongoDB passwords
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Set up SSL certificates
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets