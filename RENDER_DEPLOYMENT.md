# Deploy Nissaet on Render

This guide will walk you through deploying the Nissaet internship finder platform on Render.com.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your project must be on GitHub
3. **Domain (Optional)**: Custom domain if you want one

## Step 1: Prepare Your Repository

### 1.1 Update Repository URL
Edit the `render.yaml` files in both `backend/` and `frontend/` directories:

```yaml
# Replace this line in both files:
repo: https://github.com/yourusername/Nissaet__FInd__Internship.git
# With your actual GitHub repository URL
```

### 1.2 Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

## Step 2: Deploy Backend

### 2.1 Create Backend Service
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `nissaet-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 2.2 Add Environment Variables
Add these environment variables in the Render dashboard:

#### Database Variables (will be auto-filled if using Render Database):
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `DB_HOST`: (from database)
- `DB_USER`: (from database)
- `DB_PASSWORD`: (from database)
- `DB_NAME`: (from database)

#### Application Variables:
- `JWT_SECRET`: (generate a strong secret)
- `ADMIN_REGISTRATION_CODE`: (create your admin code)

#### File Storage Variables (optional):
- `S3_ACCESS_KEY_ID`: (your S3 provider key)
- `S3_SECRET_ACCESS_KEY`: (your S3 provider secret)
- `S3_REGION`: `auto`
- `S3_ENDPOINT`: (your S3 provider endpoint)
- `S3_BUCKET`: (your bucket name)
- `S3_PUBLIC_BASE_URL`: (public URL for files)
- `S3_FORCE_PATH_STYLE`: `false`
- `MAX_UPLOAD_MB`: `15`

### 2.3 Create Database
1. Go to Render Dashboard → New → PostgreSQL
2. **Name**: `nissaet-db`
3. **Database Name**: `nissaet_db`
4. **User**: `nissaet_user`
5. **Plan**: `Free`
6. Wait for database to be ready
7. Connect the database to your backend service

### 2.4 Run Database Migrations
Once the backend is deployed:
1. Go to your backend service → Logs
2. Click on "Shell" tab
3. Run: `npm run migrate`

## Step 3: Deploy Frontend

### 3.1 Create Frontend Service
1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository
3. Configure:
   - **Name**: `nissaet-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Instance Type**: `Free`

### 3.2 Add Environment Variables
Add these environment variables:
- `VITE_API_BASE_URL`: `https://nissaet-backend.onrender.com/api`
- `VITE_BACKEND_URL`: `https://nissaet-backend.onrender.com`
- `VITE_FIREBASE_API_KEY`: (your Firebase config)
- `VITE_FIREBASE_AUTH_DOMAIN`: (your Firebase config)
- `VITE_FIREBASE_PROJECT_ID`: (your Firebase config)
- `VITE_FIREBASE_STORAGE_BUCKET`: (your Firebase config)
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: (your Firebase config)
- `VITE_FIREBASE_APP_ID`: (your Firebase config)

## Step 4: Alternative - Use render.yaml Files

For automatic deployment, you can use the provided `render.yaml` files:

### 4.1 Backend Deployment
1. Go to Render Dashboard → New → Blueprint
2. Connect your GitHub repository
3. Select the `backend/render.yaml` file
4. Click "Deploy Blueprint"

### 4.2 Frontend Deployment
1. Go to Render Dashboard → New → Blueprint
2. Connect your GitHub repository
3. Select the `frontend/render.yaml` file
4. Click "Deploy Blueprint"

## Step 5: Post-Deployment Setup

### 5.1 Test Your Application
1. Backend: `https://nissaet-backend.onrender.com/api`
2. Frontend: `https://nissaet-frontend.onrender.com`

### 5.2 Create Admin Account
1. Access the frontend
2. Register as admin using your `ADMIN_REGISTRATION_CODE`
3. Set up initial data and configurations

### 5.3 Configure File Storage (Optional)
If using file uploads:
1. Set up S3-compatible storage (DigitalOcean Spaces, AWS S3, etc.)
2. Update S3 environment variables
3. Test file upload functionality

## Troubleshooting

### Common Issues

#### Backend Issues
- **Database Connection**: Ensure database variables are correct
- **Port Issues**: Backend should use port 10000 on Render
- **Build Failures**: Check logs for missing dependencies

#### Frontend Issues
- **Build Failures**: Ensure all dependencies are installed
- **API Connection**: Verify `VITE_API_BASE_URL` is correct
- **Environment Variables**: Ensure all required variables are set

### Useful Commands

#### Access Backend Shell
```bash
# In Render dashboard, go to Backend Service → Shell tab
npm run migrate:status  # Check migration status
npm run migrate:rollback  # Rollback migrations if needed
```

#### View Logs
- Backend: Service → Logs tab
- Frontend: Service → Logs tab
- Database: Database → Logs tab

## Cost Optimization

### Free Tier Usage
- Backend: 750 hours/month (free tier)
- Frontend: Static site (always free)
- Database: 256MB RAM, 10GB storage (free tier)

### Upgrade Options
- **Backend**: Upgrade to Standard ($7/month) for better performance
- **Database**: Upgrade for more storage and connections
- **Custom Domains**: Add custom domains for branding

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **Database**: Use strong passwords and limit connections
3. **JWT Secret**: Use a strong, unique secret
4. **HTTPS**: Render provides automatic SSL certificates
5. **Firewall**: Render provides built-in DDoS protection

## Maintenance

### Regular Tasks
- Monitor logs for errors
- Update dependencies regularly
- Backup database data
- Monitor resource usage

### Scaling
- Horizontal scaling: Add more instances
- Database scaling: Upgrade database plan
- CDN: Render provides built-in CDN for static sites

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Community**: [Render Community Forum](https://community.render.com)
- **Support**: Support available through dashboard

Your Nissaet platform is now live on Render! 🎉
