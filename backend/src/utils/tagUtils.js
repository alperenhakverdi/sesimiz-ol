export const MAX_TAGS_PER_STORY = 5;

export class TagLimitError extends Error {
  constructor(max = MAX_TAGS_PER_STORY) {
    super('TAG_LIMIT_EXCEEDED');
    this.name = 'TagLimitError';
    this.code = 'TAG_LIMIT_EXCEEDED';
    this.max = max;
  }
}

export const slugifyTag = (value = '') => {
  return value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const normalizeTag = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const name = value.trim();
  if (name.length < 2 || name.length > 30) {
    return null;
  }

  const slug = slugifyTag(name);
  if (!slug) {
    return null;
  }

  return { name, slug };
};

export const sanitizeTagList = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  const sanitized = [];

  for (const value of values) {
    const normalized = normalizeTag(value);
    if (!normalized) {
      continue;
    }

    if (seen.has(normalized.slug)) {
      continue;
    }

    seen.add(normalized.slug);
    sanitized.push(normalized);
  }

  return sanitized;
};

const clampUsageCount = async (tx, tagId) => {
  await tx.tag.updateMany({
    where: {
      id: tagId,
      usageCount: { lt: 0 }
    },
    data: { usageCount: 0 }
  });
};

export const addTagsToStory = async ({ prisma, storyId, tags }) => {
  const sanitized = sanitizeTagList(tags);

  if (sanitized.length === 0) {
    return {
      added: [],
      tags: await prisma.storyTag.findMany({
        where: { storyId },
        include: { tag: true }
      }).then(relations => relations.map(rel => rel.tag))
    };
  }

  const existingRelations = await prisma.storyTag.findMany({
    where: { storyId },
    include: { tag: true }
  });

  const existingCount = existingRelations.length;
  const existingSlugs = new Set(existingRelations.map(rel => rel.tag.slug));

  const newTags = sanitized.filter(tag => !existingSlugs.has(tag.slug));

  if (newTags.length === 0) {
    return {
      added: [],
      tags: existingRelations.map(rel => rel.tag)
    };
  }

  if (existingCount + newTags.length > MAX_TAGS_PER_STORY) {
    throw new TagLimitError();
  }

  const addedTags = [];

  await prisma.$transaction(async (tx) => {
    for (const tag of newTags) {
      let existingTag = await tx.tag.findUnique({ where: { slug: tag.slug } });

      if (!existingTag) {
        existingTag = await tx.tag.create({
          data: {
            name: tag.name,
            slug: tag.slug,
            usageCount: 0,
            isActive: true
          }
        });
      } else if (existingTag.name !== tag.name) {
        existingTag = await tx.tag.update({
          where: { id: existingTag.id },
          data: {
            name: tag.name
          }
        });
      }

      await tx.storyTag.create({
        data: {
          storyId,
          tagId: existingTag.id
        }
      });

      await tx.tag.update({
        where: { id: existingTag.id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });

      addedTags.push(existingTag);
    }
  });

  const updatedRelations = await prisma.storyTag.findMany({
    where: { storyId },
    include: { tag: true }
  });

  return {
    added: addedTags,
    tags: updatedRelations.map(rel => rel.tag)
  };
};

export const replaceStoryTags = async ({ prisma, storyId, tags }) => {
  const sanitized = sanitizeTagList(tags);

  if (sanitized.length > MAX_TAGS_PER_STORY) {
    throw new TagLimitError();
  }

  const desiredSlugSet = new Set(sanitized.map(tag => tag.slug));

  const existingRelations = await prisma.storyTag.findMany({
    where: { storyId },
    include: { tag: true }
  });

  const existingSlugSet = new Set(existingRelations.map(rel => rel.tag.slug));

  const relationsToRemove = existingRelations.filter(rel => !desiredSlugSet.has(rel.tag.slug));
  const tagsToAdd = sanitized.filter(tag => !existingSlugSet.has(tag.slug));

  await prisma.$transaction(async (tx) => {
    for (const rel of relationsToRemove) {
      await tx.storyTag.delete({ where: { id: rel.id } });
      await tx.tag.update({
        where: { id: rel.tagId },
        data: {
          usageCount: {
            decrement: 1
          }
        }
      });
      await clampUsageCount(tx, rel.tagId);
    }

    for (const tag of tagsToAdd) {
      let existingTag = await tx.tag.findUnique({ where: { slug: tag.slug } });

      if (!existingTag) {
        existingTag = await tx.tag.create({
          data: {
            name: tag.name,
            slug: tag.slug,
            usageCount: 0,
            isActive: true
          }
        });
      } else if (existingTag.name !== tag.name) {
        existingTag = await tx.tag.update({
          where: { id: existingTag.id },
          data: {
            name: tag.name,
            isActive: true
          }
        });
      }

      await tx.storyTag.create({
        data: {
          storyId,
          tagId: existingTag.id
        }
      });

      await tx.tag.update({
        where: { id: existingTag.id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
    }
  });

  const updatedRelations = await prisma.storyTag.findMany({
    where: { storyId },
    include: { tag: true }
  });

  return updatedRelations.map(rel => rel.tag);
};
