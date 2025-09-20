export const MAX_TAGS_PER_STORY = 5;

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

export const isDuplicateTag = (tags, slug) => tags.some(tag => tag.slug === slug);
