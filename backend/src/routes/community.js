import express from 'express'
import {
  getCommunityUsers,
  getUserProfile,
  getCommunityStats,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing
} from '../controllers/communityController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/users', getCommunityUsers)
router.get('/stats', getCommunityStats)
router.get('/users/:nickname', getUserProfile)

// Authenticated routes
router.post('/users/:userId/follow', authenticateToken, followUser)
router.delete('/users/:userId/follow', authenticateToken, unfollowUser)
router.get('/users/:userId/followers', getUserFollowers)
router.get('/users/:userId/following', getUserFollowing)

export default router
