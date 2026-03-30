const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

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

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development to fix connection issues
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
// FIX MARK: increase JSON payload limit so profile image (base64) can be saved.
app.use(express.json({ limit: '10mb' })); // Body parser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
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

const BASE_PORT = Number.parseInt(process.env.PORT, 10) || 5001;
const PORT_RETRY_COUNT = Number.parseInt(process.env.PORT_RETRY_COUNT, 10) || 10;

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

const startServer = async (port, attempt = 0) => {
    try {
        await db.initDatabase();
    } catch (err) {
        console.error('Failed to ensure database exists:', err.message);
    }
    await testDbConnection();
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port} (all interfaces)`);
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
