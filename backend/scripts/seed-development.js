import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDevelopment() {
  console.log('🌱 Seeding development data...');

  try {
    // Create sample users (password: "demo123")
    const hashedPassword = '$2b$10$MS5P.XbUD5CQsg1WboHetOGrgc.6.3DXh9PagnDEFsWAH9hlIqWli'; // demo123

    const sampleUsers = await prisma.user.createMany({
      data: [
        {
          email: 'user1@example.com',
          nickname: 'Ayşe',
          password: hashedPassword,
          role: 'USER',
          isActive: true,
          emailVerified: true,
        },
        {
          email: 'user2@example.com',
          nickname: 'Fatma',
          password: hashedPassword,
          role: 'USER',
          isActive: true,
          emailVerified: true,
        },
        {
          email: 'org1@example.com',
          nickname: 'STK Temsilcisi',
          password: hashedPassword,
          role: 'MODERATOR',
          isActive: true,
          emailVerified: true,
        },
        {
          email: 'admin@example.com',
          nickname: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          emailVerified: true,
        }
      ],
      skipDuplicates: true
    });

    // Create sample stories
    const user1 = await prisma.user.findFirst({ where: { email: 'user1@example.com' } });
    const user2 = await prisma.user.findFirst({ where: { email: 'user2@example.com' } });

    if (user1 && user2) {
      await prisma.story.createMany({
        data: [
          {
            title: 'İlk Hikayem',
            content: 'Bu benim ilk hikayem. Çok heyecanlıyım.',
            authorId: user1.id,
            status: 'APPROVED',
            viewCount: 15
          },
          {
            title: 'Güçlü Kadın Olmak',
            content: 'Hayatta karşılaştığım zorluklarla nasıl başa çıktığımı anlatıyorum.',
            authorId: user2.id,
            status: 'APPROVED',
            viewCount: 32
          },
          {
            title: 'Umut ve Gelecek',
            content: 'Geleceğe dair umutlarımı paylaşıyorum.',
            authorId: user1.id,
            status: 'APPROVED',
            viewCount: 8
          }
        ],
        skipDuplicates: true
      });
    }

    // Create sample organizations
    await prisma.organization.createMany({
      data: [
        {
          name: 'Kadın Dayanışma Vakfı',
          slug: 'kadin-dayanisma-vakfi',
          description: 'Kadınların güçlenmesi için çalışan vakıf',
          type: 'FOUNDATION',
          status: 'ACTIVE',
          location: 'İstanbul',
          website: 'https://example.com',
          email: 'info@kdv.org.tr',
          memberCount: 150,
          foundedYear: 2010
        },
        {
          name: 'Toplumsal Cinsiyet Eşitliği Derneği',
          slug: 'toplumsal-cinsiyet-esitligi-dernegi',
          description: 'Cinsiyet eşitliği için mücadele eden dernek',
          type: 'ASSOCIATION',
          status: 'ACTIVE',
          location: 'Ankara',
          website: 'https://example2.com',
          email: 'info@tced.org.tr',
          memberCount: 89,
          foundedYear: 2015
        }
      ],
      skipDuplicates: true
    });

    // Create sample announcements
    await prisma.announcement.createMany({
      data: [
        {
          title: 'Platform Güncelleme',
          body: 'Platformumuzda yeni özellikler eklendi. Artık daha güvenli bir şekilde hikayelerinizi paylaşabilirsiniz.',
          type: 'GENERAL',
          visibility: 'PUBLIC'
        },
        {
          title: 'Hoş Geldiniz!',
          body: 'Sesimiz Ol platformuna hoş geldiniz. Burada güvenle hikayelerinizi paylaşabilirsiniz.',
          type: 'USER',
          visibility: 'PUBLIC'
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Development data seeding completed!');
    console.log('📊 Created:');
    console.log('   - 4 sample users');
    console.log('   - 3 sample stories');
    console.log('   - 2 sample organizations');
    console.log('   - 2 sample announcements');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDevelopment()
  .then(() => {
    console.log('🎉 Seeding process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  });