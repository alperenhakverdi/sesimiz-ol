import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore'

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${key}`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: requiredEnv('FIREBASE_API_KEY'),
  authDomain: requiredEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: requiredEnv('FIREBASE_PROJECT_ID'),
  storageBucket: requiredEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: requiredEnv('FIREBASE_APP_ID')
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Firebase service functions
export const firebaseService = {
  // Users
  async getUsers() {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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

  // Stories
  async getStories(page = 1, pageLimit = 10) {
    const storiesRef = collection(db, 'stories')
    const q = query(
      storiesRef,
      orderBy('createdAt', 'desc'),
      limit(pageLimit)
    )
    
    const snapshot = await getDocs(q)
    const stories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }))

    // Pagination hesaplama
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

  // Comments
  async getCommentsByStoryId(storyId) {
    const commentsRef = collection(db, 'comments')
    const q = query(
      commentsRef,
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    const comments = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }))
      .filter(comment => comment.storyId === storyId)
    
    return comments
  },

  async createComment(commentData) {
    const commentsRef = collection(db, 'comments')
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      createdAt: new Date()
    })
    return { id: docRef.id, ...commentData }
  }
}

export default firebaseService