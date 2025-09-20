export const defaultUserSettings = {
  profileVisibility: 'PUBLIC',
  commentPermission: 'EVERYONE',
  searchVisibility: true,
  theme: 'SYSTEM',
  fontSize: 'MEDIUM',
  reducedMotion: false,
  createdAt: null,
  updatedAt: null,
};

export const userSettingsSelect = {
  profileVisibility: true,
  commentPermission: true,
  searchVisibility: true,
  theme: true,
  fontSize: true,
  reducedMotion: true,
  createdAt: true,
  updatedAt: true,
};

export const clientUserSelect = {
  id: true,
  nickname: true,
  email: true,
  bio: true,
  avatar: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  settings: {
    select: userSettingsSelect,
  },
};

export const authUserSelect = {
  ...clientUserSelect,
  isActive: true,
  isBanned: true,
};

export const mapUserForClient = (user) => {
  if (!user) return null;
  const { isActive, isBanned, ...safeUser } = user;
  const settings = user.settings || { ...defaultUserSettings };
  return {
    ...safeUser,
    settings,
  };
};

export const fetchClientUser = async (prisma, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: clientUserSelect,
  });
  return user ? { ...user, settings: user.settings || { ...defaultUserSettings } } : null;
};
