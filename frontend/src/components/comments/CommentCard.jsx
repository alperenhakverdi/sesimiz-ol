import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  useToast,
  IconButton,
  Collapse
} from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import { FiMessageCircle, FiHeart } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useState } from 'react'

const CommentCard = ({
  comment,
  currentUserNickname = null,
  onDelete = null,
  onReply = null,
  onReact = null,
  isReply = false,
  replies = [],
  depth = 0
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [isReacting, setIsReacting] = useState(false)
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

  const handleReply = async () => {
    if (!onReply || !replyContent.trim()) return

    setIsSubmittingReply(true)
    try {
      await onReply(comment.id, replyContent.trim())
      setReplyContent('')
      setShowReplyForm(false)
      toast({
        title: "Yanıt gönderildi",
        description: "Yanıtınız başarıyla gönderildi.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch {
      toast({
        title: "Hata",
        description: "Yanıt gönderilirken bir hata oluştu.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleReact = async () => {
    if (!onReact) return

    setIsReacting(true)
    try {
      await onReact(comment.id)
    } catch {
      toast({
        title: "Hata",
        description: "Tepki verirken bir hata oluştu.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsReacting(false)
    }
  }

  return (
    <Box
      ml={isReply ? 8 : 0}
      borderLeft={isReply ? '2px solid' : 'none'}
      borderColor={isReply ? 'gray.200' : 'transparent'}
      pl={isReply ? 4 : 0}
    >
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
                src={comment.authorAvatar}
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

          {/* Action buttons */}
          <HStack spacing={4}>
            {/* React button */}
            {onReact && (
              <HStack spacing={1}>
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={<FiHeart />}
                  onClick={handleReact}
                  isLoading={isReacting}
                  color={comment.userReacted ? 'red.500' : 'gray.500'}
                  _hover={{ color: 'red.500' }}
                  aria-label="Beğen"
                />
                {comment.reactionCount > 0 && (
                  <Text fontSize="xs" color="gray.500">
                    {comment.reactionCount}
                  </Text>
                )}
              </HStack>
            )}

            {/* Reply button - only for top-level comments */}
            {!isReply && onReply && currentUserNickname && (
              <Button
                size="xs"
                variant="ghost"
                leftIcon={<FiMessageCircle />}
                onClick={() => setShowReplyForm(!showReplyForm)}
                color="gray.600"
                _hover={{ color: 'brand.500' }}
              >
                Yanıtla
              </Button>
            )}
          </HStack>

          {/* Reply form */}
          <Collapse in={showReplyForm} animateOpacity>
            <VStack spacing={3} align="stretch" w="full">
              <Text fontSize="sm" color="gray.600">
                @{comment.authorNickname} kullanıcısına yanıt:
              </Text>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                maxLength={500}
              />
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.400">
                  {replyContent.length}/500
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setShowReplyForm(false)
                      setReplyContent('')
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="brand"
                    onClick={handleReply}
                    isLoading={isSubmittingReply}
                    isDisabled={!replyContent.trim()}
                  >
                    Yanıtla
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </Collapse>
        </VStack>
      </Box>

      {/* Render replies */}
      {replies && replies.length > 0 && (
        <VStack spacing={2} align="stretch" mt={3}>
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserNickname={currentUserNickname}
              onDelete={onDelete}
              onReact={onReact}
              isReply={true}
              depth={depth + 1}
            />
          ))}
        </VStack>
      )}
    </Box>
  )
}

export default CommentCard