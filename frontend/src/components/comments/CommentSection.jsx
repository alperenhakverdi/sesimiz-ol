import {
  VStack,
  Heading,
  Divider,
  Text,
  HStack
} from '@chakra-ui/react'
import { ChatIcon } from '@chakra-ui/icons'
import { useState, useEffect } from 'react'
import CommentForm from './CommentForm'
import CommentList from './CommentList'
import { generateCommentsForStory } from '../../utils/commentGenerator'

const CommentSection = ({ 
  storyId,
  currentUserNickname = null,
  title = "Yorumlar"
}) => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load comments (Mock implementation with random comments)
  useEffect(() => {
    const loadComments = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate diverse comments for this specific story
        const generatedComments = generateCommentsForStory(storyId)
        setComments(generatedComments)
      } catch {
        setError('Yorumlar yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (storyId) {
      loadComments()
    }
  }, [storyId])

  // Handle new comment submission
  const handleAddComment = async (commentData) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newComment = {
        id: Date.now().toString(),
        storyId: storyId,
        authorNickname: commentData.authorNickname,
        content: commentData.content,
        createdAt: new Date()
      }
      
      // Add to beginning of list (newest first)
      setComments(prev => [newComment, ...prev])
      
    } catch {
      throw new Error('Yorum eklenirken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remove from local state
      setComments(prev => prev.filter(comment => comment.id !== commentId))
      
    } catch {
      throw new Error('Yorum silinirken bir hata oluştu')
    }
  }

  const commentCount = comments.length

  return (
    <VStack spacing={6} align="stretch">
      {/* Comments Header */}
      <VStack spacing={3} align="start">
        <HStack spacing={3}>
          <ChatIcon color="accent.500" boxSize={5} />
          <Heading as="h3" size="md" color="neutral.800">
            {title}
          </Heading>
        </HStack>
        <Text fontSize="sm" color="neutral.500">
          {commentCount === 0 
            ? "Henüz yorum yapılmamış" 
            : `${commentCount} yorum`
          }
        </Text>
      </VStack>

      {/* Comment Form - Only show if user is logged in */}
      {currentUserNickname && (
        <>
          <CommentForm
            currentUserNickname={currentUserNickname}
            onSubmit={handleAddComment}
            isSubmitting={isSubmitting}
          />
          <Divider borderColor="neutral.300" />
        </>
      )}

      {/* Comments List */}
      <CommentList
        comments={comments}
        loading={loading}
        error={error}
        currentUserNickname={currentUserNickname}
        onDeleteComment={handleDeleteComment}
      />
    </VStack>
  )
}

export default CommentSection