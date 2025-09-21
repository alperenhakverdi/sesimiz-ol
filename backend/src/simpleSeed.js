import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seeding...');

  // Create test user (simple password for testing)
  const hashedPassword = 'test-password-hash';
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@sesimiz-ol.com' },
    update: {},
    create: {
      nickname: 'testuser',
      email: 'test@sesimiz-ol.com',
      password: hashedPassword,
      bio: 'Test kullanıcısı',
      emailVerified: true,
    },
  });

  console.log('✅ Test user created:', testUser.nickname);

  // Create test organization
  const testOrg = await prisma.organization.upsert({
    where: { slug: 'test-stk' },
    update: {},
    create: {
      name: 'Test STK',
      slug: 'test-stk',
      description: 'Test organizasyonu',
      isActive: true,
    },
  });

  console.log('✅ Test organization created:', testOrg.name);

  // Create test story
  const testStory = await prisma.story.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'İlk Test Hikayesi',
      content: 'Bu bir test hikayesidir. Platform çalışıyor!',
      authorId: testUser.id,
      viewCount: 5,
    },
  });

  console.log('✅ Test story created:', testStory.title);

  console.log('🎉 Simple seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });