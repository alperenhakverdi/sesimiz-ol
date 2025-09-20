import {
  VStack,
  Heading,
  Divider,
  Text,
  HStack,
  Select,
  useToast
} from '@chakra-ui/react'
import { ChatIcon } from '@chakra-ui/icons'
import { useState, useEffect } from 'react'
import CommentForm from './CommentForm'
import CommentList from './CommentList'
import { useAuth } from '../../contexts/AuthContext'

const CommentSection = ({
  storyId,
  currentUserNickname = null,
  title = "Yorumlar"
}) => {
  const { token } = useAuth()
  const toast = useToast()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  // Load comments from API
  const loadComments = async () => {
    if (!storyId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/comments/story/${storyId}?sort=${sortBy}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })

      const data = await response.json()
      if (data.success) {
        setComments(data.comments)
      } else {
        setError(data.error?.message || 'Yorumlar yüklenirken bir hata oluştu')
      }
    } catch (err) {
      setError('Yorumlar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [storyId, sortBy, token])

  // Handle new comment submission
  const handleAddComment = async (commentData) => {
    if (!token) {
      toast({
        title: 'Hata',
        description: 'Yorum yapmak için giriş yapmanız gerekiyor',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: commentData.content,
          storyId: parseInt(storyId)
        })
      })

      const data = await response.json()
      if (data.success) {
        // Add to beginning of list (newest first) if sorting by newest
        if (sortBy === 'newest') {
          setComments(prev => [data.comment, ...prev])
        } else {
          // Reload comments to maintain proper sorting
          loadComments()
        }

        toast({
          title: 'Başarılı',
          description: 'Yorumunuz eklendi',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } else {
        throw new Error(data.error?.message || 'Yorum eklenirken bir hata oluştu')
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!token) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        // Remove from local state
        setComments(prev => prev.filter(comment => comment.id !== commentId))

        toast({
          title: 'Başarılı',
          description: 'Yorum silindi',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } else {
        throw new Error(data.error?.message || 'Yorum silinirken bir hata oluştu')
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      throw error
    }
  }

  // Handle comment reply
  const handleReplyComment = async (parentId, content) => {
    if (!token) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          storyId: parseInt(storyId),
          parentId: parseInt(parentId)
        })
      })

      const data = await response.json()
      if (data.success) {
        // Reload comments to show the new reply
        loadComments()
      } else {
        throw new Error(data.error?.message || 'Yanıt gönderilirken bir hata oluştu')
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      throw error
    }
  }

  // Handle comment reaction
  const handleReactComment = async (commentId) => {
    if (!token) return

    try {
      const response = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        // Update comment in local state
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              userReacted: data.action === 'added',
              reactionCount: data.action === 'added'
                ? comment.reactionCount + 1
                : comment.reactionCount - 1
            }
          }
          // Also check replies
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  userReacted: data.action === 'added',
                  reactionCount: data.action === 'added'
                    ? reply.reactionCount + 1
                    : reply.reactionCount - 1
                }
              }
              return reply
            })
            return { ...comment, replies: updatedReplies }
          }
          return comment
        }))
      }
    } catch (error) {
      console.error('Error reacting to comment:', error)
    }
  }

  const commentCount = comments.length

  return (
    <VStack spacing={6} align="stretch">
      {/* Comments Header */}
      <VStack spacing={3} align="start">
        <HStack justify="space-between" w="full">
          <HStack spacing={3}>
            <ChatIcon color="accent.500" boxSize={5} />
            <Heading as="h3" size="md" color="neutral.800">
              {title}
            </Heading>
          </HStack>

          {/* Sort dropdown */}
          {comments.length > 0 && (
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="sm"
              width="150px"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="popular">En Popüler</option>
            </Select>
          )}
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
        onReplyComment={handleReplyComment}
        onReactComment={handleReactComment}
      />
    </VStack>
  )
}

export default CommentSection