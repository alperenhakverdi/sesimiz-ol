import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore'

const requiredKeys = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
]

const missingKeys = requiredKeys.filter((key) => !process.env[key])
const firebaseEnabled = missingKeys.length === 0

let db = null

if (!firebaseEnabled) {
  console.warn(
    `[firebase] Service disabled. Missing environment variables: ${missingKeys.join(', ')}`
  )
} else {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  }

  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
}

const disabledError = () => {
  throw new Error(
    'Firebase service is disabled because required environment variables are missing.'
  )
}

const disabledService = {
  async getUsers() {
    return []
  },
  async getUserById() {
    return null
  },
  async createUser() {
    disabledError()
  },
  async updateUser() {
    disabledError()
  },
  async getStories() {
    return {
      stories: [],
      pagination: {
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  },
  async getStoryById() {
    return null
  },
  async createStory() {
    disabledError()
  },
  async updateStoryViewCount() {
    return
  },
  async getCommentsByStoryId() {
    return []
  },
  async createComment() {
    disabledError()
  },
  async getUserMetrics() {
    return { total: 0, today: 0, active: 0 }
  },
  async getStoryMetrics() {
    return { total: 0, today: 0, totalViews: 0 }
  },
  async getRecentActivity() {
    return []
  }
}

const activeService = {
  async getUsers() {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    return snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }))
  },

  async getUserById(id) {
    const userRef = doc(db, 'users', id)
    const userSnap = await getDoc(userRef)
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null
  },

  async createUser(userData) {
    const usersRef = collection(db, 'users')
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: new Date()
    })
    return { id: docRef.id, ...userData }
  },

  async updateUser(id, userData) {
    const userRef = doc(db, 'users', id)
    await updateDoc(userRef, userData)
    return { id, ...userData }
  },

  async getStories(page = 1, pageLimit = 10) {
    const storiesRef = collection(db, 'stories')
    const storiesQuery = query(
      storiesRef,
      orderBy('createdAt', 'desc'),
      limit(pageLimit)
    )

    const snapshot = await getDocs(storiesQuery)
    const stories = snapshot.docs.map((storyDoc) => ({
      id: storyDoc.id,
      ...storyDoc.data(),
      createdAt: storyDoc.data().createdAt?.toDate?.() || storyDoc.data().createdAt
    }))

    const totalSnapshot = await getDocs(collection(db, 'stories'))
    const total = totalSnapshot.size
    const totalPages = Math.ceil(total / pageLimit)

    return {
      stories,
      pagination: {
        page,
        limit: pageLimit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  },

  async getStoryById(id) {
    const storyRef = doc(db, 'stories', id)
    const storySnap = await getDoc(storyRef)
    if (!storySnap.exists()) return null

    const storyData = storySnap.data()
    return {
      id: storySnap.id,
      ...storyData,
      createdAt: storyData.createdAt?.toDate?.() || storyData.createdAt
    }
  },

  async createStory(storyData) {
    const storiesRef = collection(db, 'stories')
    const docRef = await addDoc(storiesRef, {
      ...storyData,
      viewCount: 0,
      createdAt: new Date()
    })
    return { id: docRef.id, ...storyData }
  },

  async updateStoryViewCount(id) {
    const storyRef = doc(db, 'stories', id)
    const storySnap = await getDoc(storyRef)
    if (storySnap.exists()) {
      const currentViewCount = storySnap.data().viewCount || 0
      await updateDoc(storyRef, { viewCount: currentViewCount + 1 })
    }
  },

  async getCommentsByStoryId(storyId) {
    const commentsRef = collection(db, 'comments')
    const commentsQuery = query(
      commentsRef,
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(commentsQuery)
    const comments = snapshot.docs
      .map((commentDoc) => ({
        id: commentDoc.id,
        ...commentDoc.data(),
        createdAt: commentDoc.data().createdAt?.toDate?.() || commentDoc.data().createdAt
      }))
      .filter((comment) => comment.storyId === storyId)

    return comments
  },

  async createComment(commentData) {
    const commentsRef = collection(db, 'comments')
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      createdAt: new Date()
    })
    return { id: docRef.id, ...commentData }
  },

  async getUserMetrics() {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }))

    const total = users.length

    // Users created today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUsers = users.filter(user => {
      const createdAt = user.createdAt
      if (!createdAt) return false
      const userDate = new Date(createdAt)
      userDate.setHours(0, 0, 0, 0)
      return userDate.getTime() === today.getTime()
    })

    // Active users (logged in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = users.filter(user => {
      const lastLogin = user.lastLoginAt
      if (!lastLogin) return false
      const loginDate = new Date(lastLogin)
      return loginDate >= thirtyDaysAgo
    })

    return {
      total,
      today: todayUsers.length,
      active: activeUsers.length
    }
  },

  async getStoryMetrics() {
    const storiesRef = collection(db, 'stories')
    const snapshot = await getDocs(storiesRef)

    const stories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }))

    const total = stories.length

    // Stories created today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStories = stories.filter(story => {
      const createdAt = story.createdAt
      if (!createdAt) return false
      const storyDate = new Date(createdAt)
      storyDate.setHours(0, 0, 0, 0)
      return storyDate.getTime() === today.getTime()
    })

    // Total view count across all stories
    const totalViews = stories.reduce((sum, story) => {
      return sum + (story.viewCount || 0)
    }, 0)

    return {
      total,
      today: todayStories.length,
      totalViews
    }
  },

  async getRecentActivity() {
    const activities = []

    try {
      // Get recent users (last 10)
      const usersRef = collection(db, 'users')
      const usersQuery = query(
        usersRef,
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const usersSnapshot = await getDocs(usersQuery)

      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data()
        activities.push({
          id: `user_${doc.id}`,
          type: 'user_registered',
          title: 'Yeni kullanıcı kaydı',
          description: `${userData.nickname} platformuya katıldı`,
          timestamp: userData.createdAt?.toDate?.() || userData.createdAt,
          user: {
            nickname: userData.nickname,
            avatar: userData.avatar
          }
        })
      })

      // Get recent stories (last 5)
      const storiesRef = collection(db, 'stories')
      const storiesQuery = query(
        storiesRef,
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const storiesSnapshot = await getDocs(storiesQuery)

      storiesSnapshot.docs.forEach(doc => {
        const storyData = doc.data()
        activities.push({
          id: `story_${doc.id}`,
          type: 'story_created',
          title: 'Yeni hikaye paylaşıldı',
          description: `"${storyData.title}" hikayesi paylaşıldı`,
          timestamp: storyData.createdAt?.toDate?.() || storyData.createdAt,
          user: {
            nickname: storyData.authorNickname,
            avatar: storyData.authorAvatar
          },
          storyId: doc.id
        })
      })

      // Sort by timestamp and limit to 10
      activities.sort((a, b) => {
        const dateA = new Date(a.timestamp)
        const dateB = new Date(b.timestamp)
        return dateB - dateA
      })

      return activities.slice(0, 10)
    } catch (error) {
      console.error('Get recent activity error:', error)
      return []
    }
  }
}

export const firebaseService = firebaseEnabled ? activeService : disabledService
export const isFirebaseEnabled = firebaseEnabled
