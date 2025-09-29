import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  useToast,
  IconButton,
  Collapse,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Textarea,
  useColorModeValue
} from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import { FiMessageCircle, FiHeart, FiMoreVertical, FiFlag } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useState } from 'react'
import { ensureAvatar } from '../../utils/avatar'

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



  const replyBorderColor = useColorModeValue('neutral.200', 'neutral.700')
  const cardBg = useColorModeValue('white', 'neutral.800')
  const cardBorder = useColorModeValue('neutral.200', 'neutral.600')
  const cardHoverBorder = useColorModeValue('neutral.300', 'neutral.500')
  const authorColor = useColorModeValue('neutral.800', 'neutral.100')
  const metaColor = useColorModeValue('neutral.500', 'neutral.400')
  const contentColor = useColorModeValue('neutral.700', 'neutral.200')
  const reactionColor = useColorModeValue('neutral.600', 'neutral.400')
  const replyActionColor = useColorModeValue('neutral.700', 'neutral.300')

  return (
    <Box
      ml={isReply ? 8 : 0}
      borderLeft={isReply ? '2px solid' : 'none'}
      borderColor={isReply ? replyBorderColor : 'transparent'}
      pl={isReply ? 4 : 0}
    >
      <Box
        bg={cardBg}
        p={4}
        borderRadius="md"
        borderWidth="1px"
        borderColor={cardBorder}
        _hover={{ borderColor: cardHoverBorder }}
        transition="all 0.2s ease-in-out"
      >
        <VStack align="start" spacing={3}>
          {/* Author and timestamp */}
          <HStack justify="space-between" w="full">
            <HStack spacing={3}>
              <Avatar
                size="sm"
                name={comment.authorNickname}
                src={ensureAvatar(comment.authorAvatar, comment.authorNickname)}
                bg="brand.100"
                color="brand.500"
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium" color={authorColor}>
                  @{comment.authorNickname}
                </Text>
                <Text fontSize="xs" color={metaColor}>
                  {timeAgo}
                </Text>
              </VStack>
            </HStack>

            {/* Actions menu */}
            <HStack spacing={2}>
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

              {/* Report menu - only show for other users' comments */}
              {!isOwner && currentUserNickname && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    size="xs"
                    variant="ghost"
                    aria-label="Daha fazla seçenek"
                  />
                  <MenuList>
                    <MenuItem icon={<FiFlag />} isDisabled>
                      Şikayet Et (yakında)
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </HStack>

          {/* Comment content */}
          <Text
            color={contentColor}
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
                  color={comment.userReacted ? 'red.500' : reactionColor}
                  _hover={{ color: 'red.500' }}
                  aria-label="Beğen"
                />
                {comment.reactionCount > 0 && (
                  <Text fontSize="xs" color={reactionColor}>
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
                color={replyActionColor}
                _hover={{ color: 'brand.500' }}
              >
                Yanıtla
              </Button>
            )}
          </HStack>

          {/* Reply form */}
          <Collapse in={showReplyForm} animateOpacity>
            <VStack spacing={3} align="stretch" w="full">
              <Text fontSize="sm" color={replyActionColor}>
                @{comment.authorNickname} kullanıcısına yanıt:
              </Text>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                rows={5}
                resize="vertical"
                maxLength={500}
                focusBorderColor="accent.500"
                borderColor={replyBorderColor}
              />
              <HStack justify="space-between">
                <Text fontSize="xs" color={reactionColor}>
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
