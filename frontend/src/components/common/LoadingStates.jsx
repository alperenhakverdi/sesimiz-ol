import {
  Box,
  VStack,
  HStack,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Spinner,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

// Keyframes for custom loading animations
const fadeInOut = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`

const slideUp = keyframes`
  0% { 
    transform: translateY(20px);
    opacity: 0;
  }
  100% { 
    transform: translateY(0);
    opacity: 1;
  }
`

const dots = keyframes`
  0%, 80%, 100% { 
    transform: scale(0);
  }
  40% { 
    transform: scale(1);
  }
`

// Story Card Skeleton
export const StoryCardSkeleton = ({ count = 1 }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('neutral.200', 'neutral.600')

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          p={8}
          animation={`${slideUp} 0.6s ease-out ${index * 0.1}s both`}
        >
          <VStack spacing={6} align="stretch">
            {/* Title skeleton */}
            <Skeleton height="24px" borderRadius="md" />
            
            {/* Content skeleton */}
            <SkeletonText noOfLines={3} spacing="3" skeletonHeight="16px" />
            
            {/* Author info skeleton */}
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <SkeletonCircle size="40px" />
                <VStack align="start" spacing={1}>
                  <Skeleton height="14px" width="80px" />
                  <Skeleton height="12px" width="60px" />
                </VStack>
              </HStack>
              <Skeleton height="12px" width="40px" />
            </HStack>
            
            {/* Button skeleton */}
            <Skeleton height="40px" borderRadius="md" />
          </VStack>
        </Box>
      ))}
    </>
  )
}

// Comment Skeleton
export const CommentSkeleton = ({ count = 3 }) => {
  return (
    <VStack spacing={4} align="stretch">
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          p={4}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="neutral.200"
          bg="white"
          animation={`${slideUp} 0.4s ease-out ${index * 0.1}s both`}
        >
          <HStack align="start" spacing={3}>
            <SkeletonCircle size="32px" />
            <VStack align="start" flex="1" spacing={2}>
              <HStack justify="space-between" w="full">
                <Skeleton height="14px" width="100px" />
                <Skeleton height="12px" width="60px" />
              </HStack>
              <SkeletonText noOfLines={2} spacing="2" skeletonHeight="14px" />
            </VStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  )
}

// Custom Spinner with text
export const CustomSpinner = ({ 
  size = 'lg', 
  color = 'accent.500',
  text = 'Yükleniyor...',
  showText = true 
}) => {
  return (
    <VStack spacing={4} py={12}>
      <Spinner
        size={size}
        color={color}
        thickness="3px"
        speed="0.8s"
      />
      {showText && (
        <Text
          fontSize="sm"
          color="neutral.500"
          animation={`${fadeInOut} 1.5s ease-in-out infinite`}
        >
          {text}
        </Text>
      )}
    </VStack>
  )
}

// Dot Loading Animation
export const DotLoading = ({ 
  color = 'accent.500',
  size = '12px',
  text = 'Yükleniyor'
}) => {
  return (
    <HStack spacing={2} justify="center" py={6}>
      <Text fontSize="sm" color="neutral.600">
        {text}
      </Text>
      <HStack spacing={1}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            w={size}
            h={size}
            bg={color}
            borderRadius="full"
            animation={`${dots} 1.4s ease-in-out ${index * 0.16}s infinite both`}
          />
        ))}
      </HStack>
    </HStack>
  )
}

// Profile Page Skeleton
export const ProfileSkeleton = () => {
  const cardBg = useColorModeValue('white', 'gray.800')

  return (
    <VStack spacing={12} align="stretch">
      {/* Profile header */}
      <VStack spacing={6} textAlign="center">
        <VStack spacing={4}>
          <SkeletonCircle size="128px" />
          <VStack spacing={2}>
            <Skeleton height="32px" width="200px" />
            <Skeleton height="20px" width="120px" />
          </VStack>
        </VStack>
        <Skeleton height="36px" width="140px" />
      </VStack>

      {/* Stats grid */}
      <VStack spacing={6}>
        <Skeleton height="28px" width="240px" />
        <HStack spacing={6} justify="center" flexWrap="wrap">
          {Array.from({ length: 4 }).map((_, index) => (
            <Box
              key={index}
              bg={cardBg}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="neutral.200"
              p={6}
              textAlign="center"
              minW="140px"
            >
              <VStack spacing={2}>
                <Skeleton height="16px" width="80px" />
                <Skeleton height="32px" width="40px" />
                <Skeleton height="12px" width="60px" />
              </VStack>
            </Box>
          ))}
        </HStack>
      </VStack>

      {/* Recent activity */}
      <VStack spacing={6}>
        <Skeleton height="28px" width="180px" />
        <VStack spacing={4} w="full" maxW="2xl" mx="auto">
          {Array.from({ length: 3 }).map((_, index) => (
            <Box
              key={index}
              w="full"
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="neutral.200"
              bg="neutral.50"
            >
              <HStack spacing={4}>
                <SkeletonCircle size="20px" />
                <VStack align="start" flex="1" spacing={1}>
                  <Skeleton height="16px" width="70%" />
                  <Skeleton height="12px" width="40%" />
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </VStack>
    </VStack>
  )
}

// Page Loading Overlay
export const PageLoading = ({ 
  isVisible = true,
  text = 'Sayfa yükleniyor...' 
}) => {
  if (!isVisible) return null

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(255, 255, 255, 0.9)"
      backdropFilter="blur(8px)"
      zIndex="9999"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <CustomSpinner text={text} />
    </Box>
  )
}