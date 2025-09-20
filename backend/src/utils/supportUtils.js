import { SUPPORT_TYPES, DEFAULT_SUPPORT_TYPE, normalizeSupportType } from '../config/supportTypes.js';

export const SUPPORT_TYPE_LABELS = {
  HEART: 'Kalp',
  HUG: 'Sarılma',
  CLAP: 'Alkış',
  CARE: 'Destek'
};

export const formatSupportSummary = (summary) => ({
  total: summary.total,
  userSupport: summary.userSupport,
  breakdown: summary.breakdown.map(item => ({
    ...item,
    label: SUPPORT_TYPE_LABELS[item.type] || item.type
  }))
});

export const buildSupportSummary = async ({ prisma, storyId, userId }) => {
  const grouped = await prisma.storySupport.groupBy({
    by: ['supportType'],
    where: { storyId },
    _count: { _all: true }
  });

  const breakdown = SUPPORT_TYPES.map(type => {
    const match = grouped.find(entry => entry.supportType === type);
    const count = match?._count?._all ?? 0;
    return { type, count };
  });

  const total = breakdown.reduce((acc, item) => acc + item.count, 0);

  let userSelection = null;
  if (userId) {
    const existing = await prisma.storySupport.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId
        }
      },
      select: { supportType: true }
    });
    userSelection = existing?.supportType ?? null;
  }

  return {
    total,
    breakdown,
    userSupport: userSelection
  };
};

export const applySupportMutation = async ({ prisma, storyId, userId, supportType }) => {
  const normalizedType = normalizeSupportType(supportType ?? DEFAULT_SUPPORT_TYPE);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.storySupport.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId
        }
      }
    });

    if (!existing) {
      await tx.storySupport.create({
        data: {
          storyId,
          userId,
          supportType: normalizedType
        }
      });

      await tx.story.update({
        where: { id: storyId },
        data: {
          supportCount: {
            increment: 1
          }
        }
      });

      return { action: 'added', supportType: normalizedType };
    }

    if (existing.supportType === normalizedType) {
      await tx.storySupport.delete({
        where: {
          storyId_userId: {
            storyId,
            userId
          }
        }
      });

      await tx.story.update({
        where: { id: storyId },
        data: {
          supportCount: {
            decrement: 1
          }
        }
      });

      await tx.story.updateMany({
        where: {
          id: storyId,
          supportCount: { lt: 0 }
        },
        data: {
          supportCount: 0
        }
      });

      return { action: 'removed', supportType: normalizedType };
    }

    await tx.storySupport.update({
      where: {
        storyId_userId: {
          storyId,
          userId
        }
      },
      data: {
        supportType: normalizedType
      }
    });

    return { action: 'updated', supportType: normalizedType };
  });
};

export { SUPPORT_TYPES, DEFAULT_SUPPORT_TYPE, normalizeSupportType };
