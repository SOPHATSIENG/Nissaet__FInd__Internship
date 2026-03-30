const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateBranding() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nissaet_db'
    });

    try {
        // Check if admin_settings record exists
        const [existing] = await connection.execute('SELECT id FROM admin_settings ORDER BY id ASC LIMIT 1');
        
        if (existing.length > 0) {
            // Update existing record
            await connection.execute(
                `UPDATE admin_settings SET 
                    platform_name = ?,
                    support_email = ?
                WHERE id = ?`,
                ['Nissaet', 'support@nissaet.com', existing[0].id]
            );
            console.log('✅ Branding updated successfully!');
        } else {
            // Create new record
            await connection.execute(
                `INSERT INTO admin_settings (
                    platform_name,
                    support_email,
                    seo_description,
                    maintenance_mode,
                    default_language,
                    timezone,
                    brand_logo,
                    brand_favicon,
                    auth_methods,
                    brute_force_protection,
                    ip_whitelist,
                    password_min_length,
                    session_timeout_minutes,
                    email_triggers,
                    slack_webhook_url,
                    push_notifications,
                    backup_schedule,
                    data_retention_days
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'Nissaet',
                    'support@nissaet.com',
                    'Find internships, events, and career paths in one place',
                    false,
                    'English (US)',
                    '(GMT+07:00) Phnom Penh',
                    null,
                    null,
                    JSON.stringify({'Email & Password': true, 'Google OAuth': true}),
                    true,
                    JSON.stringify([]),
                    8,
                    60,
                    JSON.stringify({'New User Registration': true, 'Company Verification Request': true}),
                    '',
                    true,
                    'Daily at 04:00 AM',
                    90
                ]
            );
            console.log('✅ Branding initialized successfully!');
        }

        console.log('\n✅ Website branding updated to: "Nissaet"');
        console.log('The logo will appear as "NI" in a blue circle as shown in your design');

    } catch (error) {
        console.error('❌ Error updating branding:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

updateBranding();
