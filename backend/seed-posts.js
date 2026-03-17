const db = require('./config/db');

async function seedPosts() {
    try {
        console.log('🌱 Seeding sample posts...');
        
        // Check if there's at least one company
        const companies = await db.query('SELECT id FROM companies LIMIT 1');
        const companyId = companies.length > 0 ? companies[0].id : null;

        if (!companyId) {
            console.log('⚠️ No companies found. Please create a company first or run other seeders.');
            return;
        }

        const samplePosts = [
            [
                'Summer Internship 2024 at ABC Tech',
                'We are looking for passionate students to join our engineering team for a 3-month summer internship program.',
                'Exciting summer internship opportunity for CS students!',
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                'internship',
                companyId,
                'Phnom Penh',
                '2024-06-01 09:00:00',
                'published'
            ],
            [
                'Full-stack Web Development Workshop',
                'Join our expert-led workshop to master modern web technologies including React, Node.js, and MySQL.',
                'Learn full-stack development in this 2-day intensive workshop.',
                'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                'workshop',
                companyId,
                'Online',
                '2024-04-15 14:00:00',
                'published'
            ],
            [
                'National Tech Career Fair 2024',
                'Connect with over 50 leading technology companies and discover your next career move.',
                'The biggest tech career fair in Cambodia is back!',
                'https://images.unsplash.com/photo-1540575861501-7ad0582373f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                'career_fair',
                companyId,
                'Koh Pich Convention Center',
                '2024-05-20 08:30:00',
                'published'
            ],
            [
                'How to Ace Your First Tech Interview',
                'Landing your first tech job can be challenging. This guide covers the most common interview questions and how to prepare.',
                'Expert tips for successful technical and behavioral interviews.',
                'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                'article',
                companyId,
                null,
                null,
                'published'
            ]
        ];

        for (const post of samplePosts) {
            await db.query(`
                INSERT INTO posts (
                    title, content, short_description, image_url, 
                    post_type, company_id, location, event_date, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, post);
        }

        console.log('✅ Sample posts seeded successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
    } finally {
        process.exit(0);
    }
}

seedPosts();
