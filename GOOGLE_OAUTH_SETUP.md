# OAuth Setup Instructions (Google + GitHub)

## 1. Get Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add the following authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
7. Note down your **Client ID** and **Client Secret**

## 2. Get GitHub OAuth Credentials

1. Go to GitHub Developer Settings:
   - https://github.com/settings/developers
2. Click "New OAuth App"
3. Set:
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Note your **Client ID** and **Client Secret**

## 3. Backend Setup

1. Install the required dependencies:
   ```bash
   cd backend
   npm install passport passport-google-oauth20 passport-github2 express-session
   ```

2. Update your `.env` file with your Google credentials:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   SESSION_SECRET=your_session_secret_key
   FRONTEND_URL=http://localhost:5173
   ```

## 4. Database Setup

Make sure your database has a `users` table with the following structure:
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  github_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Start the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend application:
   ```bash
   cd frontend
   npm run dev
   ```

## 6. Test OAuth Login

1. Navigate to `http://localhost:5173`
2. Click "Continue with Google" or "Continue with GitHub"
3. Complete provider authorization
4. After authorizing, you'll be redirected back to your application

## Notes

- The backend runs on port 5000 by default
- The frontend runs on port 5173 by default
- Make sure both ports are available
- The Google callback URL must match: `http://localhost:5000/api/auth/google/callback`
- The GitHub callback URL must match: `http://localhost:5000/api/auth/github/callback`
