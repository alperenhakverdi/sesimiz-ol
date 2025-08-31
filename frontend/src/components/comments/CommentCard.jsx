import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  useToast
} from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useState } from 'react'

const CommentCard = ({ 
  comment, 
  currentUserNickname = null, 
  onDelete = null 
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const toast = useToast()

  // Format date to Turkish
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { 
    addSuffix: true, 
    locale: tr 
  })

  const isOwner = currentUserNickname && comment.authorNickname === currentUserNickname

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(comment.id)
      toast({
        title: "Yorum silindi",
        description: "Yorumunuz başarıyla silindi.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch {
      toast({
        title: "Hata",
        description: "Yorum silinirken bir hata oluştu.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="md"
      borderWidth="1px"
      borderColor="neutral.200"
      _hover={{ borderColor: "neutral.300" }}
      transition="all 0.2s ease-in-out"
    >
      <VStack align="start" spacing={3}>
        {/* Author and timestamp */}
        <HStack justify="space-between" w="full">
          <HStack spacing={3}>
            <Avatar 
              size="sm" 
              name={comment.authorNickname}
              bg="brand.100"
              color="brand.500"
            />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium" color="neutral.800">
                @{comment.authorNickname}
              </Text>
              <Text fontSize="xs" color="neutral.500">
                {timeAgo}
              </Text>
            </VStack>
          </HStack>
          
          {/* Delete button - only show for comment owner */}
          {isOwner && onDelete && (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="red"
              leftIcon={<DeleteIcon />}
              onClick={handleDelete}
              isLoading={isDeleting}
              loadingText="Siliniyor..."
            >
              Sil
            </Button>
          )}
        </HStack>

        {/* Comment content */}
        <Text 
          color="neutral.700" 
          fontSize="sm"
          lineHeight="tall"
          whiteSpace="pre-wrap"
          w="full"
        >
          {comment.content}
        </Text>
      </VStack>
    </Box>
  )
}

export default CommentCard