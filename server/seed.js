/**
 * Seed script — creates admin user + sample charities
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Charity = require('./models/Charity');
const Score = require('./models/Score');
const Draw = require('./models/Draw');

const charities = [
  {
    name: 'Cancer Research UK',
    shortDescription: 'Fighting cancer on all fronts through world-class research.',
    description: 'Cancer Research UK is the world\'s largest independent cancer research organisation. We fund scientists, doctors and nurses to help beat cancer sooner.',
    category: 'health',
    website: 'https://www.cancerresearchuk.org',
    isFeatured: true,
    isActive: true
  },
  {
    name: 'British Heart Foundation',
    shortDescription: 'Funding lifesaving research into heart and circulatory diseases.',
    description: 'The British Heart Foundation is the nation\'s heart charity. We fund over £100 million of research each year into all heart and circulatory diseases and their risk factors.',
    category: 'health',
    website: 'https://www.bhf.org.uk',
    isFeatured: true,
    isActive: true
  },
  {
    name: 'WWF UK',
    shortDescription: 'Building a future where people and nature thrive.',
    description: 'WWF is the world\'s leading independent conservation organisation. We work in over 100 countries to protect and restore wildlife and natural habitats.',
    category: 'environment',
    website: 'https://www.wwf.org.uk',
    isFeatured: true,
    isActive: true
  },
  {
    name: 'Macmillan Cancer Support',
    shortDescription: 'No one faces cancer alone — we provide expert care and support.',
    description: 'Macmillan Cancer Support improves the lives of people affected by cancer. We provide practical, medical, emotional and financial support.',
    category: 'health',
    isActive: true
  },
  {
    name: 'Alzheimer\'s Research UK',
    shortDescription: 'Pioneering research into the diseases that cause dementia.',
    description: 'Alzheimer\'s Research UK is the UK\'s leading dementia research charity. We fund pioneering research with the aim of understanding, preventing, treating and curing the diseases that cause dementia.',
    category: 'health',
    isActive: true
  },
  {
    name: 'RNLI',
    shortDescription: 'Saving lives at sea since 1824.',
    description: 'The Royal National Lifeboat Institution is a charity that saves lives at sea. Our crews are on call 24/7, 365 days a year.',
    category: 'community',
    isActive: true
  },
  {
    name: 'Sport England',
    shortDescription: 'Helping everyone enjoy sport and get active.',
    description: 'Sport England invests in communities and organisations to help people enjoy sport, be more active, and support local grassroots sports.',
    category: 'sports',
    isActive: true
  },
  {
    name: 'Dogs Trust',
    shortDescription: 'We never put a healthy dog down.',
    description: 'Dogs Trust is the UK\'s largest dog welfare charity. Every year we care for more than 15,000 dogs at our 22 rehoming centres across the UK.',
    category: 'animals',
    isActive: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/golf_platform');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Charity.deleteMany({}),
      Score.deleteMany({}),
      Draw.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // Create charities
    const createdCharities = await Charity.insertMany(charities);
    console.log(`✅ Created ${createdCharities.length} charities`);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@golf.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });
    await Score.create({ user: admin._id, scores: [] });
    console.log('✅ Created admin: admin@golf.com / password123');

    // Create sample subscriber
    const subscriber = await User.create({
      name: 'John Golfer',
      email: 'john@golf.com',
      password: 'password123',
      role: 'subscriber',
      selectedCharity: createdCharities[0]._id,
      charityContributionPercent: 15,
      subscription: {
        status: 'active',
        plan: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Add some scores for subscriber
    const scoreDoc = await Score.create({
      user: subscriber._id,
      scores: [
        { value: 32, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { value: 28, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { value: 35, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        { value: 24, date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
        { value: 38, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) }
      ]
    });
    console.log('✅ Created subscriber: john@golf.com / password123');

    // Create a sample published draw
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    await Draw.create({
      month: lastMonth,
      year: lastYear,
      drawType: 'random',
      status: 'published',
      winningNumbers: [14, 22, 28, 35, 40],
      prizePool: { total: 1200, fiveMatch: 480, fourMatch: 420, threeMatch: 300 },
      activeSubscribers: 120,
      participantCount: 98,
      publishedAt: new Date(),
      winners: [
        {
          user: subscriber._id,
          matchType: '3-match',
          prizeAmount: 150,
          paymentStatus: 'pending',
          verificationStatus: 'unsubmitted'
        }
      ]
    });
    console.log('✅ Created sample draw with winner');

    console.log('\n🎉 Seed complete!\n');
    console.log('Admin credentials:     admin@golf.com / password123');
    console.log('Subscriber credentials: john@golf.com / password123');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and fill in your values');
    console.log('2. Run: npm run dev (from root)');
    console.log('3. Visit http://localhost:5173\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedDB();
