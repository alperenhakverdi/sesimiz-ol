import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDevelopment() {
  console.log('🌱 Seeding development data...');

  try {
    // Create sample users (password: "demo123")
    const hashedPassword = '$2b$10$MS5P.XbUD5CQsg1WboHetOGrgc.6.3DXh9PagnDEFsWAH9hlIqWli'; // demo123

    // Create users individually to handle duplicates
    const users = [
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
    ];

    for (const userData of users) {
      try {
        await prisma.user.create({ data: userData });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`User ${userData.nickname} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Create meaningful stories with real women's experiences
    const allUsers = await prisma.user.findMany();

    const meaningfulStories = [
      {
        title: "İş Yerinde Yaşadığım Mobbing",
        content: "3 yıldır çalıştığım şirkette erkek meslektaşlarım sürekli fikirlerimi görmezden geliyor. Toplantılarda konuştuğumda 'kızlar işinden anlamaz' gibi yorumlar yapıyorlar. Patronum da erkek olduğu için onların tarafını tutuyor. Özgüvenim çok sarsıldı ama bırakmamaya kararlıyım. Bu durumu nasıl aşabilirim bilmiyorum.",
        authorId: allUsers[0]?.id,
        status: 'APPROVED',
        viewCount: 45
      },
      {
        title: "Annemle Aramızdaki Sorunlar",
        content: "Annem sürekli evlenme konusunda baskı yapıyor. 'Yaşın geçiyor, kimse seni almaz' diyor. 30 yaşındayım ve kariyerime odaklanmak istiyorum ama ailem bunu anlayamıyor. Her aile toplantısı büyük bir işkenceye dönüşüyor. Kendi kararlarımı veremiyorum gibi hissediyorum.",
        authorId: allUsers[1]?.id,
        status: 'APPROVED',
        viewCount: 67
      },
      {
        title: "Tek Başıma Anne Olmak",
        content: "Bebeğimin babası hamilelik öğrenince ortadan kayboldu. Şimdi 2 yaşındaki oğlumla tek başımayım. Mali durumum zor, ailem destek olmuyor 'neden evlenmedin önce' diyorlar. Çok yoruldum ama oğlum için güçlü olmaya çalışıyorum. Bazen ne kadar dayanabilirim bilmiyorum.",
        authorId: allUsers[0]?.id,
        status: 'APPROVED',
        viewCount: 89
      },
      {
        title: "Üniversitede Taciz Yaşadım",
        content: "Hocam sürekli kişisel sorular soruyor, derse kalmam için bahaneler üreterek yanımda durmaya çalışıyor. Şikayet etmek istiyorum ama kanıtım yok. Ailem 'sen yanlış anlamışsındır' diyor. Okulu bırakmayı düşünüyorum ama hayallerimi de bırakmak istemiyorum.",
        authorId: allUsers[1]?.id,
        status: 'APPROVED',
        viewCount: 123
      },
      {
        title: "Doğum Sonrası Depresyonum",
        content: "Bebeğimi doğurduktan sonra çok mutlu olacağımı düşünüyordum ama sürekli ağlama krizleri geçiriyorum. Bebeğime bakamayacağımı düşünüyorum. Çevremdekiler 'bu doğal' diyor ama ben normal hissetmiyorum. Yardım istiyorum ama kimse ciddiye almıyor.",
        authorId: allUsers[2]?.id,
        status: 'APPROVED',
        viewCount: 78
      },
      {
        title: "İş Bulamıyorum Çünkü Kadınım",
        content: "Mühendislik mezunuyum ama 6 aydır işsizim. Mülakatların çoğunda 'evlenince çalışmaya devam eder misin' sorusu geliyor. Biri açıkça 'erkek mühendis tercih ediyoruz' dedi. Ailem 'zor alan seçtin' diyor. Hayallerimi gerçekleştirmek bu kadar zor olacağını bilmiyordum.",
        authorId: allUsers[3]?.id,
        status: 'APPROVED',
        viewCount: 156
      }
    ];

    // Create stories individually
    for (const storyData of meaningfulStories) {
      try {
        await prisma.story.create({ data: storyData });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`Story "${storyData.title}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Create sample organizations
    const organizations = [
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
    ];

    for (const orgData of organizations) {
      try {
        await prisma.organization.create({ data: orgData });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`Organization "${orgData.name}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Create sample announcements
    const announcements = [
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
    ];

    for (const announcementData of announcements) {
      try {
        await prisma.announcement.create({ data: announcementData });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`Announcement "${announcementData.title}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

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