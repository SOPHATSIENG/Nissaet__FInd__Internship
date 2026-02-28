const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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
const db = require('./config/db');

const app = express();

// Middleware
app.use(cors());
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

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
