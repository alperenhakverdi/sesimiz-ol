#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

const nicknames = [
  'DenizYildizi','GunesliGun','MaviYolcu','RuzgarinSesi','GeceYolcusu','PapatyaKokusu','DagMelodisi','YildizlarAltinda','NehirAkisi','SerinGolge',
  'KumsalAdimi','SessizRuzgar','SakinLiman','GokyuzuRuhu','GulBahcesi','SevgiIzi','HuzurAdasi','Kardelen','OkyanusSesi','Gulumsen'
];

const sampleTitles = [
  'Yeni Bir Başlangıç','Sessizlikteki Güç','Yol Ayrımı','Geri Dönüş','Gölgedeki Hayaller','Bir Umut Hikayesi','Kendime Yolculuk','İzler','Kırılganlık ve Güç','Ufuk Çizgisi'
];

const sampleParagraph =
  'Bugün kendimi dinlemeye karar verdim. Zor günlerin ardından, içimde saklanan gücü hatırlatmak istedim. Yazmak iyi geliyor; kelimeler, içimdeki düğümleri çözüyor.';

function avatarFor(nick) {
  const seed = encodeURIComponent(nick);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

async function ensureUser(nickname, email, password) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ nickname }, { email }] } });
  if (existing) return existing;
  const hashed = await bcryptjs.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      nickname,
      email,
      password: hashed,
      avatar: avatarFor(nickname),
      role: 'USER',
      isActive: true
    }
  });
  await prisma.userSettings.create({ data: { userId: user.id } });
  return user;
}

async function createStory(authorId, title) {
  return prisma.story.create({
    data: {
      title,
      content: sampleParagraph,
      authorId
    }
  });
}

async function createComment(storyId, authorId, content) {
  return prisma.comment.create({
    data: {
      storyId,
      authorId,
      content
    }
  });
}

async function main() {
  // Create ~15 extra users
  const users = [];
  for (let i = 0; i < 15; i++) {
    const name = nicknames[i % nicknames.length] + (i > nicknames.length ? String(i) : '');
    const email = `${name.toLowerCase()}@example.com`;
    const u = await ensureUser(name, email, '12345678');
    users.push(u);
  }

  // For first 8 users create 2 stories each
  const stories = [];
  for (let i = 0; i < Math.min(8, users.length); i++) {
    const u = users[i];
    for (let s = 0; s < 2; s++) {
      const title = sampleTitles[(i + s) % sampleTitles.length];
      const st = await createStory(u.id, title);
      stories.push(st);
    }
  }

  // Add comments from other users across stories
  let commentCount = 0;
  for (let i = 0; i < stories.length; i++) {
    const st = stories[i];
    for (let c = 0; c < 3; c++) {
      const commenter = users[(i + c + 3) % users.length];
      await createComment(st.id, commenter.id, 'Paylaşımın için teşekkürler. Yanındayız.');
      commentCount++;
    }
  }

  console.log(`Seeded ${users.length} users, ${stories.length} stories, ${commentCount} comments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

