import { useState, useEffect, useCallback } from 'react'
import { HStack, IconButton, Text, useColorModeValue, Tooltip, useToast } from '@chakra-ui/react'
import { FiHeart } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'
import { storyAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const StoryLikeButton = ({
  storyId,
  initialLiked = false,
  initialCount = 0,
  size = 'sm',
  showCount = true,
  ariaLabel = 'Hikâyeyi beğen',
  onChange
}) => {
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const heartColor = useColorModeValue('red.500', 'red.300')
  const mutedColor = useColorModeValue('neutral.500', 'neutral.400')
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialCount)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setIsLiked(initialLiked)
  }, [initialLiked])

  useEffect(() => {
    setLikesCount(initialCount)
  }, [initialCount])

  const handleToggle = useCallback(async (event) => {
    event?.stopPropagation?.()
    event?.preventDefault?.()

    if (!isAuthenticated) {
      toast({
        title: 'Giriş gerekli',
        description: 'Hikâyeleri beğenmek için giriş yapmalısınız.',
        status: 'info',
        duration: 3000,
        isClosable: true
      })
      return
    }

    if (isProcessing) return

    const previousState = { liked: isLiked, count: likesCount }
    const optimisticLiked = !isLiked
    const optimisticCount = Math.max(0, likesCount + (optimisticLiked ? 1 : -1))

    setIsLiked(optimisticLiked)
    setLikesCount(optimisticCount)
    setIsProcessing(true)

    try {
      const response = optimisticLiked
        ? await storyAPI.like(storyId)
        : await storyAPI.unlike(storyId)

      if (!response?.success) {
        throw new Error(response?.error?.message || 'İşlem tamamlanamadı')
      }

      const nextLiked = response.liked ?? optimisticLiked
      const nextCount = response.likesCount ?? optimisticCount

      setIsLiked(nextLiked)
      setLikesCount(Math.max(0, nextCount))
      onChange?.({ liked: nextLiked, likesCount: Math.max(0, nextCount) })
    } catch (error) {
      console.error('Story like toggle error:', error)
      setIsLiked(previousState.liked)
      setLikesCount(previousState.count)
      toast({
        title: 'Hata',
        description: error?.message || 'Hikâyeyi beğenirken bir sorun oluştu.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setIsProcessing(false)
    }
  }, [isAuthenticated, isLiked, likesCount, storyId, isProcessing, toast, onChange])

  const icon = isLiked ? <FaHeart /> : <FiHeart />
  const color = isLiked ? heartColor : mutedColor

  const button = (
    <IconButton
      aria-label={ariaLabel}
      icon={icon}
      size={size}
      variant="ghost"
      color={color}
      _hover={{ color: heartColor }}
      isDisabled={isProcessing}
      onClick={handleToggle}
    />
  )

  return (
    <HStack spacing={1} align="center">
      <Tooltip label={isLiked ? 'Beğeniyi geri al' : 'Hikâyeyi beğen'}>{button}</Tooltip>
      {showCount && (
        <Text fontSize="sm" color={mutedColor} minW="1.5rem" textAlign="center">
          {likesCount}
        </Text>
      )}
    </HStack>
  )
}

export default StoryLikeButton
