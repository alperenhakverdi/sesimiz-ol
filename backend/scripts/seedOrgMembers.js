#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    take: 5,
    select: { id: true, nickname: true }
  });
  const orgs = await prisma.organization.findMany({
    orderBy: { id: 'asc' },
    take: 3,
    select: { id: true, slug: true, name: true }
  });

  if (users.length === 0 || orgs.length === 0) {
    console.log('No users or organizations found. Seed users and organizations first.');
    return;
  }

  const pairs = [
    [users[0], orgs[0]],
    [users[1] || users[0], orgs[1] || orgs[0]],
    [users[2] || users[0], orgs[2] || orgs[0]]
  ];

  for (const [user, org] of pairs) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id
        }
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: user.id,
        role: 'representative'
      }
    });
    console.log(`Linked ${user.nickname} as representative of ${org.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

