import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'İş Hayatı',
    slug: 'is-hayati',
    color: '#2B6CB0',
    description: 'Çalışma hayatı, kariyer yolculuğu ve işyeri deneyimlerine dair hikayeler',
    sortOrder: 1
  },
  {
    name: 'Aile',
    slug: 'aile',
    color: '#D53F8C',
    description: 'Aile içi ilişkiler, bakım emeği ve günlük hayatı paylaşan hikayeler',
    sortOrder: 2
  },
  {
    name: 'Eğitim',
    slug: 'egitim',
    color: '#38A169',
    description: 'Öğrenme deneyimleri, eğitim fırsatları ve kişisel gelişim hikayeleri',
    sortOrder: 3
  },
  {
    name: 'Sağlık',
    slug: 'saglik',
    color: '#DD6B20',
    description: 'Fiziksel ve mental sağlık, bakım süreçleri ve iyileşme hikayeleri',
    sortOrder: 4
  },
  {
    name: 'Sosyal',
    slug: 'sosyal',
    color: '#805AD5',
    description: 'Topluluk, dayanışma, gönüllülük ve sosyal etki hikayeleri',
    sortOrder: 5
  },
  {
    name: 'Diğer',
    slug: 'diger',
    color: '#718096',
    description: 'Diğer kategorilere sığmayan, paylaşmaya değer tüm hikayeler',
    sortOrder: 6
  }
];

async function seedCategories() {
  try {


    for (const category of categories) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.slug }
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: category
        });

      } else {
        await prisma.category.update({
          where: { id: existingCategory.id },
          data: {
            name: category.name,
            color: category.color,
            description: category.description,
            sortOrder: category.sortOrder ?? existingCategory.sortOrder,
            isActive: true
          }
        });

      }
    }

    const activeSlugs = categories.map(category => category.slug);
    const deactivated = await prisma.category.updateMany({
      where: {
        slug: {
          notIn: activeSlugs
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    if (deactivated.count > 0) {

    }


  } catch (error) {
    console.error('❌ Kategori ekleme hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();