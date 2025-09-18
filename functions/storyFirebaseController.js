import firebaseService from '../services/firebase.js'

// GET /api/stories - List all stories
export const getAllStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    
    const result = await firebaseService.getStories(page, limit)
    
    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Get stories error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch stories'
      }
    })
  }
}

// GET /api/stories/:id - Get story details
export const getStoryById = async (req, res) => {
  try {
    const { id } = req.params
    const story = await firebaseService.getStoryById(id)
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Story not found'
        }
      })
    }
    
    // Get comments for this story
    const comments = await firebaseService.getCommentsByStoryId(id)
    
    res.status(200).json({
      success: true,
      data: {
        story,
        comments
      }
    })
  } catch (error) {
    console.error('Get story by ID error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch story'
      }
    })
  }
}

// POST /api/stories/:id/view - Increment view count
export const incrementViewCount = async (req, res) => {
  try {
    const { id } = req.params
    await firebaseService.updateStoryViewCount(id)
    
    res.status(200).json({
      success: true,
      message: 'View count updated'
    })
  } catch (error) {
    console.error('Increment view count error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update view count'
      }
    })
  }
}

// POST /api/stories - Create new story
export const createStory = async (req, res) => {
  try {
    const { title, content } = req.body
    const userId = req.user.id
    
    // Get user info for the story
    const user = await firebaseService.getUserById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      })
    }
    
    const storyData = {
      title,
      content,
      authorId: userId,
      authorNickname: user.nickname,
      authorAvatar: user.avatar,
      viewCount: 0
    }
    
    const story = await firebaseService.createStory(storyData)
    
    res.status(201).json({
      success: true,
      data: story
    })
  } catch (error) {
    console.error('Create story error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create story'
      }
    })
  }
}

// Temporary placeholder functions (can be implemented later if needed)
export const updateStory = async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Update story not implemented yet'
    }
  })
}

export const deleteStory = async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED', 
      message: 'Delete story not implemented yet'
    }
  })
}