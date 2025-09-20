import {
  VStack,
  Text,
  Spinner,
  Center,
  Box
} from '@chakra-ui/react'
import { ChatIcon } from '@chakra-ui/icons'
import CommentCard from './CommentCard'
import { CommentSkeleton, CustomSpinner } from '../common/LoadingStates'

const CommentList = ({
  comments = [],
  loading = false,
  error = null,
  currentUserNickname = null,
  onDeleteComment = null,
  onReplyComment = null,
  onReactComment = null,
  emptyMessage = "Henüz yorum yapılmamış. İlk yorumu sen yap!"
}) => {
  
  if (loading) {
    return <CommentSkeleton count={3} />
  }

  if (error) {
    return (
      <Box 
        bg="red.50" 
        p={4} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor="red.200"
      >
        <Text color="red.700" fontSize="sm" textAlign="center">
          Yorumlar yüklenirken bir hata oluştu: {error}
        </Text>
      </Box>
    )
  }

  if (comments.length === 0) {
    return (
      <Center py={8}>
        <VStack spacing={3} textAlign="center">
          <ChatIcon color="neutral.400" boxSize={8} />
          <VStack spacing={1}>
            <Text fontSize="md" color="neutral.600" fontWeight="medium">
              Henüz yorum yok
            </Text>
            <Text fontSize="sm" color="neutral.500" maxW="sm">
              {emptyMessage}
            </Text>
          </VStack>
        </VStack>
      </Center>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          currentUserNickname={currentUserNickname}
          onDelete={onDeleteComment}
          onReply={onReplyComment}
          onReact={onReactComment}
          replies={comment.replies || []}
          isReply={false}
          depth={0}
        />
      ))}
    </VStack>
  )
}

export default CommentList