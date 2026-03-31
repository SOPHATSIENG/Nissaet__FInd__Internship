const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Import database config
const db = require('./config/db');

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

const app = express();

const session = require('express-session');
const passport = require('./config/passport');

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development to fix connection issues
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'nissaet_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());
// FIX MARK: increase JSON payload limit so profile image (base64) can be saved.
app.use(express.json({ limit: '10mb' })); // Body parser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Normalize accidental double /api prefixes from clients (e.g. /api//api/auth/register)
app.use((req, _res, next) => {
    if (req.url.startsWith('/api//api/')) {
        req.url = req.url.replace('/api//api/', '/api/');
    }
    next();
});

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});
app.get('/api/skills', async (req, res) => {
  const { search } = req.query;
  // filter skills
});
app.get('/api/test', (req, res) => {
  res.json({ message: 'API works!' });
});
const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const eventRoutes = require('./routes/eventRoutes');
const postRoutes = require('./routes/postRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const brandingRoutes = require('./routes/brandingRoutes');
const { authenticate, authorize } = require('./middleware/auth');
const internshipController = require('./controllers/internshipController');

app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/branding', brandingRoutes);

// Alias routes for company ratings (helps when frontend calls /api/companies/... directly)
app.get('/api/companies/:id/ratings', internshipController.getCompanyRatings);
app.post('/api/companies/:id/ratings', authenticate, authorize('student'), internshipController.rateCompany);

const PORT = process.env.PORT || 5001;

// FIX MARK: Test database connection on startup
const testDbConnection = async () => {
    try {
        await db.connection();
        console.log('✅ Database connection test successful');
    } catch (error) {
        console.error('❌ Database connection test failed during startup!');
        console.error('Error details:', error.message);
    }
};

const startServer = async () => {
    try {
        await db.initDatabase();
    } catch (err) {
        console.error('Failed to ensure database exists:', err.message);
    }
    await testDbConnection();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
