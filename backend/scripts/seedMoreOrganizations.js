#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const orgs = [
  { name: 'TEMA Vakfı', slug: 'tema-vakfi', type: 'FOUNDATION', website: 'https://www.tema.org.tr', location: 'İstanbul' },
  { name: 'AKUT', slug: 'akut', type: 'ASSOCIATION', website: 'https://www.akut.org.tr', location: 'İstanbul' },
  { name: 'Türk Kızılay', slug: 'turk-kizilay', type: 'ASSOCIATION', website: 'https://www.kizilay.org.tr', location: 'Ankara' },
  { name: 'Mor Çatı Kadın Sığınağı Vakfı', slug: 'mor-cati', type: 'FOUNDATION', website: 'https://www.morcati.org.tr', location: 'İstanbul' },
  { name: 'KEDV', slug: 'kedv', type: 'FOUNDATION', website: 'https://www.kedv.org.tr', location: 'İstanbul' },
  { name: 'TEV', slug: 'tev', type: 'FOUNDATION', website: 'https://www.tev.org.tr', location: 'İstanbul' },
  { name: 'Darüşşafaka', slug: 'darussafaka', type: 'FOUNDATION', website: 'https://www.darussafaka.org', location: 'İstanbul' },
  { name: 'İHH', slug: 'ihh', type: 'ASSOCIATION', website: 'https://www.ihh.org.tr', location: 'İstanbul' }
];

async function main() {
  let created = 0;
  for (const o of orgs) {
    const exists = await prisma.organization.findUnique({ where: { slug: o.slug } });
    if (exists) continue;
    await prisma.organization.create({
      data: {
        name: o.name,
        slug: o.slug,
        type: o.type,
        status: 'ACTIVE',
        description: `${o.name} – toplum yararına faaliyet gösteren kuruluş.`,
        location: o.location,
        website: o.website,
        memberCount: 0
      }
    });
    created++;
  }
  console.log(`Seeded ${created} organizations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

