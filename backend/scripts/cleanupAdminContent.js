#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, nickname: true }
  });

  if (admins.length === 0) {
    console.log('No ADMIN users found. Nothing to clean.');
    return;
  }

  const adminIds = admins.map(a => a.id);

  // Delete comments authored by admins
  const deletedComments = await prisma.comment.deleteMany({
    where: { authorId: { in: adminIds } }
  });
  console.log(`Deleted ${deletedComments.count} comments authored by admins.`);

  // Delete stories authored by admins (bookmarks, comments cascade)
  const deletedStories = await prisma.story.deleteMany({
    where: { authorId: { in: adminIds } }
  });
  console.log(`Deleted ${deletedStories.count} stories authored by admins.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

