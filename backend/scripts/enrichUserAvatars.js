#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function buildAvatarUrl(nickname, idx) {
  // Stable but diverse avatars using DiceBear initials with seed
  const seed = encodeURIComponent(nickname || `user-${idx}`);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, nickname: true, avatar: true },
    orderBy: { id: 'asc' }
  });

  let updated = 0;
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (!u.avatar) {
      const url = buildAvatarUrl(u.nickname, i);
      await prisma.user.update({ where: { id: u.id }, data: { avatar: url } });
      updated++;
    }
  }

  console.log(`Updated ${updated} users with generated avatars.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

