# Nissaet - Student Internship Finder

A full-stack internship finder platform connecting students and companies.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Axios, React Router
- **Backend**: Node.js, Express.js, MySQL
- **Database**: MySQL

## Prerequisites
- Node.js installed
- MySQL Server installed and running

## Setup Instructions

### 1. Database Setup
1. Open your MySQL client (Workbench, Command Line, etc.).
2. Create a database named `nissaet_db` (or run the script below which does it).
3. Import the schema from `backend/database/schema.sql`.
   ```bash
   cd backend/database
   mysql -u root -p < schema.sql
   ```

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   - Open `.env` file.
   - Update `DB_PASSWORD` with your MySQL root password.
   - (Optional) Update `JWT_SECRET` for better security.
4. Start the server:
   ```bash
   npm run dev
   # Server runs on http://localhost:5000
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React app:
   ```bash
   npm run dev
   # App runs on http://localhost:5173
   ```

## Features
- **Student**: Register, view internships, apply, view application status.
- **Company**: Register, post internships, view applicants.
- **Auth**: JWT-based authentication.

## API Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/internships` - Get all internships
- `POST /api/internships` - Post internship
- `POST /api/applications/apply` - Apply for internship
