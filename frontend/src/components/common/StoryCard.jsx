import { memo } from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  HStack,
  VStack,
  Avatar,
  Button,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const StoryCard = ({ story }) => {
  // Color mode values
  const headingColor = useColorModeValue('neutral.800', 'neutral.100')
  const textColor = useColorModeValue('neutral.700', 'neutral.200')
  const authorColor = useColorModeValue('neutral.700', 'neutral.300')
  const timeColor = useColorModeValue('neutral.500', 'neutral.400')

  // Format date to Turkish
  const timeAgo = formatDistanceToNow(new Date(story.createdAt), {
    addSuffix: true,
    locale: tr
  })

  // Truncate content for preview
  const truncatedContent = story.content.length > 150
    ? story.content.substring(0, 150) + '...'
    : story.content

  return (
    <Card 
      maxW="sm" 
      borderRadius="lg" 
      overflow="hidden"
      _hover={{ 
        transform: 'translateY(-2px)', 
        shadow: 'lg' 
      }}
      transition="all 0.2s ease-in-out"
      cursor="pointer"
      as={RouterLink}
      to={`/hikayeler/${story.id}`}
      textDecoration="none"
      _focus={{ boxShadow: 'outline' }}
    >
      <CardHeader pb={2}>
        <VStack align="start" spacing={3}>
          <Heading size="md" color={headingColor} noOfLines={2}>
            {story.title}
          </Heading>
          
          <HStack justify="space-between" w="full" align="center">
            <HStack spacing={3}>
              <Avatar 
                size="sm" 
                name={story.author.nickname}
                src={story.author.avatar}
                bg="brand.100"
                color="brand.500"
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium" color={authorColor}>
                  @{story.author.nickname}
                </Text>
                <Text fontSize="xs" color={timeColor}>
                  {timeAgo}
                </Text>
              </VStack>
            </HStack>
            
          </HStack>
        </VStack>
      </CardHeader>

      <CardBody pt={0}>
        <VStack align="start" spacing={4}>
          <Text
            color={textColor}
            fontSize="sm"
            lineHeight="tall"
            noOfLines={4}
          >
            {truncatedContent}
          </Text>
          
          <Button 
            variant="link" 
            colorScheme="accent" 
            size="sm"
            alignSelf="flex-start"
            p={0}
            h="auto"
            fontWeight="medium"
          >
            Devamını Oku →
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default memo(StoryCard)