const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');

// Load env vars
dotenv.config();
const passport = require('./config/passport');

const app = express();

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json()); // Body parser

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);

const PORT = process.env.PORT || 5000;
const githubCallbackUrl =
  process.env.GITHUB_CALLBACK_URL ||
  `http://localhost:${PORT}/api/auth/github/callback`;
const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL ||
  `http://localhost:${PORT}/api/auth/google/callback`;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`[oauth] GitHub callback URL: ${githubCallbackUrl}`);
    console.log(`[oauth] Google callback URL: ${googleCallbackUrl}`);
});
