import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, writeBatch, doc } from 'firebase/firestore'
import { PrismaClient } from '@prisma/client'

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
const prisma = new PrismaClient()

async function migrateData() {
  console.log('🔄 SQLite → Firestore migration başlıyor...')
  
  try {
    // Users migrate et
    const users = await prisma.user.findMany()
    console.log(`📥 ${users.length} kullanıcı bulundu`)
    
    const batch = writeBatch(db)
    const userIdMap = new Map()
    
    for (const user of users) {
      const userRef = doc(collection(db, 'users'))
      batch.set(userRef, {
        nickname: user.nickname,
        email: user.email,
        password: user.password,
        avatar: user.avatar,
        createdAt: user.createdAt
      })
      userIdMap.set(user.id, userRef.id)
    }
    
    await batch.commit()
    console.log('✅ Kullanıcılar migrate edildi')
    
    // Stories migrate et
    const stories = await prisma.story.findMany({
      include: { author: true }
    })
    console.log(`📚 ${stories.length} hikaye bulundu`)
    
    const storyBatch = writeBatch(db)
    const storyIdMap = new Map()
    
    for (const story of stories) {
      const storyRef = doc(collection(db, 'stories'))
      storyBatch.set(storyRef, {
        title: story.title,
        content: story.content,
        viewCount: story.viewCount || 0,
        authorId: userIdMap.get(story.authorId),
        authorNickname: story.author.nickname,
        authorAvatar: story.author.avatar,
        createdAt: story.createdAt
      })
      storyIdMap.set(story.id, storyRef.id)
    }
    
    await storyBatch.commit()
    console.log('✅ Hikayeler migrate edildi')
    
    // Comments migrate et (eğer varsa)
    const comments = await prisma.comment?.findMany({
      include: { author: true }
    }) || []
    
    if (comments.length > 0) {
      console.log(`💬 ${comments.length} yorum bulundu`)
      
      const commentBatch = writeBatch(db)
      for (const comment of comments) {
        const commentRef = doc(collection(db, 'comments'))
        commentBatch.set(commentRef, {
          content: comment.content,
          storyId: storyIdMap.get(comment.storyId),
          authorId: userIdMap.get(comment.authorId),
          authorNickname: comment.author.nickname,
          authorAvatar: comment.author.avatar,
          createdAt: comment.createdAt
        })
      }
      await commentBatch.commit()
      console.log('✅ Yorumlar migrate edildi')
    }
    
    console.log('🎉 Migration tamamlandı!')
    
  } catch (error) {
    console.error('❌ Migration hatası:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()