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
  Badge
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const StoryCard = ({ story }) => {
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
          <Heading size="md" color="brand.500" noOfLines={2}>
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
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  @{story.author.nickname}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {timeAgo}
                </Text>
              </VStack>
            </HStack>
            
            <Badge 
              colorScheme="brand" 
              variant="subtle"
              fontSize="2xs"
              px={2}
              py={1}
            >
              Hikâye
            </Badge>
          </HStack>
        </VStack>
      </CardHeader>

      <CardBody pt={0}>
        <VStack align="start" spacing={4}>
          <Text 
            color="gray.700" 
            fontSize="sm"
            lineHeight="tall"
            noOfLines={4}
          >
            {truncatedContent}
          </Text>
          
          <Button 
            variant="link" 
            colorScheme="brand" 
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

export default StoryCard