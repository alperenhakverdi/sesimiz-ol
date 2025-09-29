const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const API_ORIGIN = API_BASE_URL.replace(/\/$/, '').replace(/\/api$/, '')

export const resolveAvatarUrl = (avatarPath, nickname = '') => {
  if (!avatarPath) {
    return generateFallbackAvatar(nickname)
  }

  if (avatarPath.startsWith('data:') || avatarPath.startsWith('http')) {
    return avatarPath
  }

  const normalizedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`
  return `${API_ORIGIN}${normalizedPath}`
}

export const generateFallbackAvatar = (seed = 'guest') => {
  const encoded = encodeURIComponent(seed || 'guest')
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encoded}`
}

export const ensureAvatar = (avatarPath, nickname = '') => {
  const resolved = resolveAvatarUrl(avatarPath, nickname)
  return resolved || generateFallbackAvatar(nickname)
}
