import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter } from 'firebase/firestore'

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDrwMCxDNhOO_bFImhK7iBElzGoHdgd-88",
  authDomain: "sesimiz-ol.firebaseapp.com",
  projectId: "sesimiz-ol",
  storageBucket: "sesimiz-ol.firebasestorage.app",
  messagingSenderId: "654033076911",
  appId: "1:654033076911:web:d2683450b5fc6389940a5a"
}

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