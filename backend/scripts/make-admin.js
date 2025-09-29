#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error('Usage: node scripts/make-admin.js <nickname-or-email>');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ nickname: identifier }, { email: identifier }]
    },
    select: { id: true, nickname: true, email: true, role: true }
  });

  if (!user) {
    console.error(`User not found: ${identifier}`);
    process.exit(1);
  }

  if (user.role === 'ADMIN') {
    console.log(`User is already ADMIN: ${user.nickname} (${user.email || 'no-email'})`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' }
  });

  console.log(`✅ Promoted to ADMIN: ${user.nickname} (${user.email || 'no-email'})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

