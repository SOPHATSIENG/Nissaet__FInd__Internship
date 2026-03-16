const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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
const app = express();

// Middleware
app.use(cors());
// FIX MARK: increase JSON payload limit so profile image (base64) can be saved.
app.use(express.json({ limit: '10mb' })); // Body parser

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
