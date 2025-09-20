// Content quality utility functions

// Calculate estimated reading time based on content length
export const calculateReadingTime = (content) => {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTimeMinutes); // Minimum 1 minute
};

// Calculate content quality score based on various factors
export const calculateQualityScore = (story) => {
  let score = 0;
  const maxScore = 100;

  // Content length score (0-30 points)
  const contentLength = story.content.length;
  if (contentLength >= 1000) {
    score += 30;
  } else if (contentLength >= 500) {
    score += 20;
  } else if (contentLength >= 200) {
    score += 10;
  }

  // Title quality score (0-15 points)
  const titleLength = story.title.length;
  if (titleLength >= 30 && titleLength <= 100) {
    score += 15;
  } else if (titleLength >= 20 && titleLength <= 150) {
    score += 10;
  } else if (titleLength >= 10) {
    score += 5;
  }

  // Category assignment (0-10 points)
  if (story.categoryId) {
    score += 10;
  }

  // Tags usage (0-15 points)
  const tagCount = story.tags?.length || 0;
  if (tagCount >= 3) {
    score += 15;
  } else if (tagCount >= 2) {
    score += 10;
  } else if (tagCount >= 1) {
    score += 5;
  }

  // Engagement score (0-30 points)
  const viewCount = story.viewCount || 0;
  const supportCount = story.supportCount || 0;
  const commentCount = story._count?.comments || 0;

  const engagementScore = Math.min(30,
    Math.floor(viewCount / 10) +
    (supportCount * 2) +
    (commentCount * 3)
  );
  score += engagementScore;

  return Math.min(maxScore, score);
};

// Get quality rating based on score
export const getQualityRating = (score) => {
  if (score >= 80) return { rating: 'excellent', label: 'Mükemmel' };
  if (score >= 60) return { rating: 'good', label: 'İyi' };
  if (score >= 40) return { rating: 'fair', label: 'Orta' };
  if (score >= 20) return { rating: 'poor', label: 'Zayıf' };
  return { rating: 'very-poor', label: 'Çok Zayıf' };
};

// Calculate content metrics for a story
export const calculateContentMetrics = (story) => {
  const readingTime = calculateReadingTime(story.content);
  const qualityScore = calculateQualityScore(story);
  const qualityRating = getQualityRating(qualityScore);

  return {
    readingTime,
    qualityScore,
    qualityRating,
    wordCount: story.content.trim().split(/\s+/).length,
    characterCount: story.content.length
  };
};