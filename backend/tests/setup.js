/**
 * Jest Test Setup for Sesimiz Ol API
 * Provides comprehensive testing infrastructure with database isolation
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global test utilities
global.testStartTime = Date.now();
global.testPrisma = null;

/**
 * Database Setup for Testing
 * Creates isolated test database per test run
 */
async function setupTestDatabase() {
  try {
    // Use separate test database
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/sesimiz_ol_test';
    process.env.NODE_ENV = 'test';

    // Initialize Prisma for tests
    global.testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Run migrations for test database
    console.log('🔧 Setting up test database...');
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env }
    });

    console.log('✅ Test database ready');

  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Database Cleanup
 * Cleans up test data between tests
 */
async function cleanupTestDatabase() {
  if (!global.testPrisma) return;

  try {
    // Delete in dependency order to avoid foreign key constraints
    await global.testPrisma.commentReaction.deleteMany();
    await global.testPrisma.comment.deleteMany();
    await global.testPrisma.storySupport.deleteMany();
    await global.testPrisma.storyView.deleteMany();
    await global.testPrisma.storyReport.deleteMany();
    await global.testPrisma.storyTag.deleteMany();
    await global.testPrisma.userBookmark.deleteMany();
    await global.testPrisma.story.deleteMany();
    await global.testPrisma.userFollow.deleteMany();
    await global.testPrisma.stkFollow.deleteMany();
    await global.testPrisma.organizationMember.deleteMany();
    await global.testPrisma.blockedUser.deleteMany();
    await global.testPrisma.message.deleteMany();
    await global.testPrisma.notification.deleteMany();
    await global.testPrisma.user.deleteMany();
    await global.testPrisma.organization.deleteMany();
    await global.testPrisma.tag.deleteMany();
    await global.testPrisma.category.deleteMany();

  } catch (error) {
    console.error('Database cleanup error:', error);
  }
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
  process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:5173';
  process.env.SECURITY_HEADERS_ENABLED = 'false'; // Disable for easier testing
  process.env.RATE_LIMIT_ENABLED = 'false'; // Disable rate limiting in tests

  // Setup test database
  await setupTestDatabase();

  // Create basic test data
  await seedBasicTestData();
}

/**
 * Create essential test data
 */
async function seedBasicTestData() {
  try {
    // Create test categories
    await global.testPrisma.category.createMany({
      data: [
        {
          name: 'Kişisel Deneyimler',
          slug: 'kisisel-deneyimler',
          description: 'Kişisel hikayeler ve deneyimler',
          color: '#FF6B6B',
          sortOrder: 1,
          isActive: true
        },
        {
          name: 'Toplumsal Konular',
          slug: 'toplumsal-konular',
          description: 'Toplumsal sorunlar ve çözümler',
          color: '#4ECDC4',
          sortOrder: 2,
          isActive: true
        }
      ]
    });

    // Create test tags
    await global.testPrisma.tag.createMany({
      data: [
        { name: 'güçlü kadın', slug: 'guclu-kadin', usageCount: 0, isActive: true },
        { name: 'cesaret', slug: 'cesaret', usageCount: 0, isActive: true },
        { name: 'umut', slug: 'umut', usageCount: 0, isActive: true }
      ]
    });

    console.log('✅ Basic test data seeded');

  } catch (error) {
    console.error('❌ Test data seeding failed:', error);
    throw error;
  }
}

/**
 * Teardown test environment
 */
async function teardownTestEnvironment() {
  try {
    if (global.testPrisma) {
      await global.testPrisma.$disconnect();
    }

    const testDuration = Date.now() - global.testStartTime;
    console.log(`🏁 Tests completed in ${testDuration}ms`);

  } catch (error) {
    console.error('Test teardown error:', error);
  }
}

// Jest lifecycle hooks
beforeAll(async () => {
  await setupTestEnvironment();
}, 30000); // 30 second timeout for setup

beforeEach(async () => {
  await cleanupTestDatabase();
  await seedBasicTestData();
});

afterAll(async () => {
  await cleanupTestDatabase();
  await teardownTestEnvironment();
}, 10000);

// Global test utilities
global.testUtils = {
  prisma: () => global.testPrisma,

  // Create test user helper
  createTestUser: async (overrides = {}) => {
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash('password123', 10);

    return await global.testPrisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        nickname: `testuser-${Date.now()}`,
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
        ...overrides
      }
    });
  },

  // Create test story helper
  createTestStory: async (authorId, overrides = {}) => {
    const categories = await global.testPrisma.category.findMany({ take: 1 });

    return await global.testPrisma.story.create({
      data: {
        title: `Test Story ${Date.now()}`,
        content: 'This is a test story content. It contains meaningful text for testing purposes.',
        slug: `test-story-${Date.now()}`,
        authorId,
        categoryId: categories[0].id,
        isPublished: true,
        isAnonymous: false,
        viewCount: 0,
        supportCount: 0,
        ...overrides
      }
    });
  },

  // Generate JWT token helper
  generateTestToken: async (userId) => {
    const jwt = (await import('jsonwebtoken')).default;
    return jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Wait helper for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

export default global.testUtils;