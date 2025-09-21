import { useState, useMemo, memo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  useColorModeValue
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Link as RouterLink } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ViewIcon } from '@chakra-ui/icons'
import { storyAPI } from '../../services/api'
import LazyImage from './LazyImage'

// Keyframes for animations
const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`

const EnhancedStoryCard = ({ story }) => {
  const [localViewCount, setLocalViewCount] = useState(story.viewCount || 0)
  
  const timeAgo = useMemo(() => {
    try {
      // Handle both Firebase timestamp format and ISO string format
      let date
      if (story.createdAt?.seconds) {
        // Firebase timestamp format
        date = new Date(story.createdAt.seconds * 1000)
      } else if (typeof story.createdAt === 'string') {
        // ISO string format from API
        date = new Date(story.createdAt)
      } else if (story.createdAt instanceof Date) {
        // Already a Date object
        date = story.createdAt
      } else {
        return 'Tarih belirtilmemiş'
      }
      
      if (isNaN(date.getTime())) {
        return 'Tarih belirtilmemiş'
      }
      
      return formatDistanceToNow(date, { addSuffix: true, locale: tr })
    } catch (error) {
      console.error('Date parsing error:', error, story.createdAt)
      return 'Tarih belirtilmemiş'
    }
  }, [story.createdAt])

  const handleViewIncrement = async () => {
    try {
      await storyAPI.incrementView(story.id)
      setLocalViewCount(prev => prev + 1)
    } catch (error) {
      console.error('View increment failed:', error)
    }
  }

  // Responsive colors
  const cardBg = useColorModeValue('white', 'neutral.800')
  const borderColor = useColorModeValue('neutral.200', 'neutral.700')
  const hoverBorderColor = useColorModeValue('accent.300', 'accent.400')
  const shadowColor = useColorModeValue('0px 4px 12px rgba(0, 0, 0, 0.05)', '0px 4px 12px rgba(0, 0, 0, 0.3)')
  const hoverShadowColor = useColorModeValue('0px 8px 20px rgba(0, 0, 0, 0.12)', '0px 8px 20px rgba(0, 0, 0, 0.4)')
  const titleColor = useColorModeValue('neutral.800', 'neutral.100')
  const textColor = useColorModeValue('neutral.600', 'neutral.300')
  const authorColor = useColorModeValue('neutral.700', 'neutral.200')
  const timeColor = useColorModeValue('neutral.500', 'neutral.400')

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      position="relative"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      transform="translateY(0)"
      _hover={{
        transform: 'translateY(-4px)',
        borderColor: hoverBorderColor,
        boxShadow: hoverShadowColor,
        '& .shimmer-effect': {
          opacity: 0.6,
        },
        '& .hover-overlay': {
          opacity: 1,
        },
        '& .read-button': {
          transform: 'translateY(0)',
          opacity: 1,
        },
        '& .story-title': {
          color: 'accent.600',
        }
      }}
      boxShadow={shadowColor}
    >
      {/* Shimmer effect overlay */}
      <Box
        className="shimmer-effect"
        position="absolute"
        top="0"
        left="-100%"
        width="100%"
        height="100%"
        background="linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
        animation={`${shimmer} 2s infinite`}
        opacity="0"
        zIndex="1"
        transition="opacity 0.3s ease"
      />

      {/* Hover overlay */}
      <Box
        className="hover-overlay"
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="gradient-to-br from-accent.50 via-transparent to-brand.50"
        opacity="0"
        transition="opacity 0.3s ease"
        zIndex="1"
        pointerEvents="none"
      />

      <VStack spacing={6} p={8} align="stretch" position="relative" zIndex="2">
        {/* Story Header */}
        <VStack spacing={4} align="start">
          <Text
            className="story-title"
            fontSize="xl"
            fontWeight="bold"
            color={titleColor}
            lineHeight="short"
            noOfLines={2}
            transition="color 0.3s ease"
          >
            {story.title}
          </Text>
          
          <Text
            fontSize="md"
            color={textColor}
            lineHeight="tall"
            noOfLines={3}
            minH="72px"
          >
            {story.excerpt || story.content?.substring(0, 120) + '...'}
          </Text>
        </VStack>

        {/* Story Footer */}
        <VStack spacing={4}>
          {/* Author Info */}
          <HStack justify="space-between" w="full" align="center">
            <HStack spacing={3}>
              {story.authorAvatar || story.author?.avatar ? (
                <LazyImage
                  src={story.authorAvatar || story.author?.avatar}
                  alt={`${story.authorNickname || story.author?.nickname} profil fotoğrafı`}
                  boxSize="32px"
                  borderRadius="full"
                  objectFit="cover"
                  fallbackSrc="/default-avatar.png"
                  transition="transform 0.2s ease"
                  _groupHover={{
                    animation: `${pulse} 1s ease-in-out infinite`,
                  }}
                />
              ) : (
                <Avatar
                  size="sm"
                  name={story.authorNickname || story.author?.nickname}
                  bg="brand.100"
                  color="brand.500"
                  transition="transform 0.2s ease"
                  _groupHover={{
                    animation: `${pulse} 1s ease-in-out infinite`,
                  }}
                />
              )}
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium" color={authorColor}>
                  @{story.authorNickname || story.author?.nickname}
                </Text>
                <Text fontSize="xs" color={timeColor}>
                  {timeAgo}
                </Text>
              </VStack>
            </HStack>
            
            <HStack 
              spacing={2} 
              cursor="pointer" 
              onClick={handleViewIncrement}
              _hover={{ transform: 'scale(1.05)' }}
              transition="transform 0.2s"
              p={1}
              borderRadius="md"
            >
              <ViewIcon boxSize={3} color={timeColor} />
              <Text fontSize="xs" color={timeColor}>
                {localViewCount}
              </Text>
            </HStack>
          </HStack>

          {/* Action Button */}
          <Button
            className="read-button"
            as={RouterLink}
            to={`/hikayeler/${story.id}`}
            colorScheme="accent"
            size="md"
            width="full"
            transform="translateY(8px)"
            opacity="0"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              transform: 'translateY(0) scale(1.02)',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            _active={{
              transform: 'translateY(0) scale(0.98)',
            }}
          >
            Hikayeyi Oku
          </Button>
        </VStack>
      </VStack>

      {/* Corner accent */}
      <Box
        position="absolute"
        top="0"
        right="0"
        w="40px"
        h="40px"
        opacity="0.3"
        background="linear-gradient(135deg, accent.200 0%, transparent 70%)"
        transition="opacity 0.3s ease"
        _groupHover={{
          opacity: 0.6,
        }}
      />
    </Box>
  )
}

export default memo(EnhancedStoryCard)