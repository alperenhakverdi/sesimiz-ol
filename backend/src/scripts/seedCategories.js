import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Sosyal Adalet',
    slug: 'sosyal-adalet',
    color: '#E53E3E',
    description: 'İnsan hakları, eşitlik ve sosyal adaletle ilgili hikayeler'
  },
  {
    name: 'Çevre',
    slug: 'cevre',
    color: '#38A169',
    description: 'Çevre koruma, iklim değişikliği ve sürdürülebilirlik hikayeleri'
  },
  {
    name: 'Eğitim',
    slug: 'egitim',
    color: '#3182CE',
    description: 'Eğitim, öğrenme ve gelişim ile ilgili hikayeler'
  },
  {
    name: 'Sağlık',
    slug: 'saglik',
    color: '#D53F8C',
    description: 'Sağlık, mental sağlık ve yaşam kalitesi hikayeleri'
  },
  {
    name: 'Teknoloji',
    slug: 'teknoloji',
    color: '#805AD5',
    description: 'Teknoloji, dijital dönüşüm ve inovasyon hikayeleri'
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Kategori verilerini ekliyor...');

    for (const category of categories) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.slug }
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: category
        });
        console.log(`✅ Kategori eklendi: ${category.name}`);
      } else {
        console.log(`⚠️ Kategori zaten mevcut: ${category.name}`);
      }
    }

    console.log('🎉 Kategoriler başarıyla eklendi!');
  } catch (error) {
    console.error('❌ Kategori ekleme hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();