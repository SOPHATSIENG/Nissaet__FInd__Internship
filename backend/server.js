const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
<<<<<<< HEAD
const session = require('express-session');

// Load env vars
dotenv.config();
const passport = require('./config/passport');

=======
// Load env vars
dotenv.config();
// Set JWT_SECRET if not loaded from .env
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'your_jwt_secret_key_change_this_for_production';
}
// Set ADMIN_REGISTRATION_CODE if not loaded from .env
if (!process.env.ADMIN_REGISTRATION_CODE) {
    process.env.ADMIN_REGISTRATION_CODE = 'change_this_admin_code';
}
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('ADMIN_REGISTRATION_CODE loaded:', process.env.ADMIN_REGISTRATION_CODE ? 'YES' : 'NO');
>>>>>>> origin/feature/phat
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
<<<<<<< HEAD
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json()); // Body parser
=======
app.use(cors());
// FIX MARK: increase JSON payload limit so profile image (base64) can be saved.
app.use(express.json({ limit: '10mb' })); // Body parser
>>>>>>> origin/feature/phat

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const profileRoutes = require('./routes/profileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);

<<<<<<< HEAD
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
=======
const BASE_PORT = Number.parseInt(process.env.PORT, 10) || 5001;
const PORT_RETRY_COUNT = Number.parseInt(process.env.PORT_RETRY_COUNT, 10) || 10;

const startServer = (port, attempt = 0) => {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE' && attempt < PORT_RETRY_COUNT) {
            const nextPort = port + 1;
            console.warn(`Port ${port} is in use. Retrying on port ${nextPort}...`);
            startServer(nextPort, attempt + 1);
            return;
        }

        console.error('Failed to start server:', error.message);
        process.exit(1);
    });
};

startServer(BASE_PORT);
>>>>>>> origin/feature/phat
