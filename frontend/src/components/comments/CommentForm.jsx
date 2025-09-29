import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  Avatar,
  useToast,
  FormControl,
  FormErrorMessage,
  useColorModeValue
} from '@chakra-ui/react'
import { ChatIcon } from '@chakra-ui/icons'
import { useState } from 'react'

const CommentForm = ({ 
  currentUserNickname = "Anonim", 
  onSubmit = null,
  placeholder = "Yorumunuzu yazın...",
  isSubmitting = false
}) => {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()

  const maxLength = 500
  const remainingChars = maxLength - content.length
  const isOverLimit = remainingChars < 0
  const isEmpty = content.trim().length === 0

  const handleContentChange = (e) => {
    setContent(e.target.value)
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (isEmpty) {
      setError('Yorum boş olamaz')
      return
    }

    if (isOverLimit) {
      setError(`Yorum ${maxLength} karakterden uzun olamaz`)
      return
    }

    if (!onSubmit) return

    try {
      await onSubmit({
        content: content.trim(),
        authorNickname: currentUserNickname
      })
      
      // Clear form on success
      setContent('')
      setError('')
      
      toast({
        title: "Yorum eklendi",
        description: "Yorumunuz başarıyla eklendi.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      setError(error.message || 'Yorum eklenirken bir hata oluştu')
      toast({
        title: "Hata",
        description: "Yorum eklenirken bir hata oluştu.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box
      bg={useColorModeValue('white','neutral.800')}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="neutral.200"
    >
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          {/* User info */}
          <HStack spacing={3}>
            <Avatar 
              size="sm" 
              name={currentUserNickname}
              bg="brand.100"
              color="brand.500"
            />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium" color="neutral.800">
                @{currentUserNickname}
              </Text>
              <Text fontSize="xs" color="neutral.500">
                olarak yorum yapıyorsunuz
              </Text>
            </VStack>
          </HStack>

          {/* Comment input */}
          <FormControl isInvalid={!!error}>
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder={placeholder}
              resize="vertical"
              minH="120px"
              focusBorderColor="accent.500"
              borderColor="neutral.300"
              _hover={{ borderColor: "neutral.400" }}
            />
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>

          {/* Character count and submit */}
          <HStack justify="space-between">
            <Text 
              fontSize="xs" 
              color={isOverLimit ? "red.500" : "neutral.500"}
            >
              {remainingChars} karakter kaldı
            </Text>
            
            <Button
              type="submit"
              colorScheme="accent"
              leftIcon={<ChatIcon />}
              isLoading={isSubmitting}
              loadingText="Gönderiliyor..."
              isDisabled={isEmpty || isOverLimit}
              size="sm"
            >
              Yorum Yap
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  )
}

export default CommentForm