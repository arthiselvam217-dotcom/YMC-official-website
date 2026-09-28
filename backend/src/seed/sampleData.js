const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const {
  User,
  Event,
  LibraryResource,
  Podcast,
  TdcTalk,
} = require('../models');

/**
 * Minimal sample data for local development & testing.
 * Note: Historical YSC data will be migrated separately after review.
 */
const sampleData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI || mongoURI.includes('<username>')) {
      console.log('⚠️  Please configure a valid MONGO_URI in backend/.env before running the seeder.');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('🌱 Connected to MongoDB for sample data seeding...');

    // 1. Sample Admin User (if not already exists)
    const existingAdmin = await User.findOne({ username: 'ymcadmin' });
    if (!existingAdmin) {
      await User.create({
        username: 'ymcadmin',
        email: 'admin@ymcgct.org',
        passwordHash: 'admin123', // Will be hashed by pre-save hook
        role: 'admin',
        memberType: 'BoardMember',
        points: 100,
        isProudMember: true,
      });
      console.log('✅ Created sample admin user: ymcadmin / admin123');
    } else {
      console.log('ℹ️  Sample admin user already exists.');
    }

    // 2. Sample YMC Event
    const existingEvent = await Event.findOne({ title: 'YMC Orientation 2025' });
    if (!existingEvent) {
      await Event.create({
        title: 'YMC Orientation 2025',
        description: 'Welcome orientation for new members of YMC GCT. Learn about upcoming projects and initiatives.',
        link: 'https://ymcgct.org',
        venue: 'GCT Main Auditorium',
        date: new Date('2025-10-15T10:00:00Z'),
        isActive: true,
      });
      console.log('✅ Created sample event: YMC Orientation 2025');
    }

    // 3. Sample Library Resource
    const existingLib = await LibraryResource.findOne({ course: 'Data Structures and Algorithms' });
    if (!existingLib) {
      await LibraryResource.create({
        year: '2',
        dept: 'CSE',
        course: 'Data Structures and Algorithms',
        bookLink: 'https://example.com/dsa-notes.pdf',
      });
      console.log('✅ Created sample library resource: Data Structures');
    }

    // 4. Sample Podcast
    const existingPod = await Podcast.findOne({ title: 'YMC Tech Talks - Ep 01' });
    if (!existingPod) {
      await Podcast.create({
        title: 'YMC Tech Talks - Ep 01: Engineering the Future',
        link: 'https://spotify.com',
        coverImage: '/media/podlogo.jpeg',
      });
      console.log('✅ Created sample podcast episode');
    }

    // 5. Sample TDC Talk
    const existingTdc = await TdcTalk.findOne({ title: 'Introduction to Modern Web Development' });
    if (!existingTdc) {
      await TdcTalk.create({
        title: 'Introduction to Modern Web Development',
        speaker: 'YMC Alumni Speaker',
        link: 'https://youtube.com',
        year: '2024',
      });
      console.log('✅ Created sample TDC talk');
    }

    console.log('🎉 Sample seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
};

sampleData();
