import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Button,
  Text,
  Avatar,
  useToast,
  Alert,
  AlertIcon,
  Box,
  Divider
} from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const ProfileSettings = ({ isOpen, onClose, user }) => {
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const { updateNickname } = useAuth()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!nickname.trim()) {
      setError('Kullanıcı adı gereklidir')
      return
    }

    if (nickname.trim() === user?.nickname) {
      onClose()
      return
    }

    setIsUpdating(true)

    try {
      await updateNickname(nickname)
      
      toast({
        title: "Profil güncellendi",
        description: `Kullanıcı adınız @${nickname} olarak güncellendi`,
        status: "success",
        duration: 4000,
        isClosable: true,
      })
      
      onClose()
      
    } catch (error) {
      setError(error.message)
      toast({
        title: "Güncelleme hatası",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    setNickname(user?.nickname || '')
    setError('')
    onClose()
  }

  const handleNicknameChange = (e) => {
    setNickname(e.target.value)
    if (error) setError('')
  }

  const isNicknameValid = nickname.trim().length >= 2 && nickname.trim().length <= 20
  const charactersLeft = 20 - nickname.length
  const hasChanges = nickname.trim() !== user?.nickname

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent mx={4}>
        <ModalHeader>
          <VStack spacing={3} align="center" textAlign="center">
            <Avatar 
              size="lg" 
              name={nickname || user?.nickname}
              bg="brand.100"
              color="brand.500"
              fontSize="xl"
              fontWeight="bold"
            />
            <VStack spacing={1}>
              <Text fontSize="xl" color="neutral.800">
                Profil Ayarları
              </Text>
              <Text fontSize="sm" color="neutral.500" fontWeight="normal">
                Kullanıcı bilgilerinizi düzenleyin
              </Text>
            </VStack>
          </VStack>
        </ModalHeader>
        
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody pb={6}>
            <VStack spacing={8}>
              {/* Privacy Notice */}
              <Alert status="info" borderRadius="lg" bg="accent.50" borderColor="accent.200">
                <AlertIcon color="accent.500" />
                <VStack spacing={2} align="start" flex="1">
                  <Text fontSize="sm" fontWeight="medium" color="accent.700">
                    🔒 Anonim Profil
                  </Text>
                  <Text fontSize="xs" color="accent.600" lineHeight="tall">
                    Sadece kullanıcı adınızı değiştirebilirsiniz. 
                    Diğer kişisel bilgileriniz güvenlidir.
                  </Text>
                </VStack>
              </Alert>

              {/* Current Info Display */}
              <Box w="full" p={4} bg="neutral.50" borderRadius="lg">
                <VStack spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="neutral.700">
                    Mevcut Bilgiler
                  </Text>
                  <VStack spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color="neutral.800">
                      @{user?.nickname}
                    </Text>
                    <Text fontSize="xs" color="neutral.500">
                      Anonim hesap - {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('tr-TR') : 'Bugün'} tarihinde katıldı
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              <Divider borderColor="neutral.300" />

              {/* Nickname Update */}
              <FormControl isInvalid={!!error} isRequired>
                <FormLabel color="neutral.700" fontSize="sm" fontWeight="medium">
                  Yeni Kullanıcı Adı
                </FormLabel>
                <Input
                  value={nickname}
                  onChange={handleNicknameChange}
                  placeholder="Yeni kullanıcı adınızı yazın..."
                  focusBorderColor="accent.500"
                  borderColor="neutral.300"
                  _hover={{ borderColor: "neutral.400" }}
                  size="lg"
                />
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
                {!error && (
                  <FormHelperText>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xs" color="neutral.500">
                        2-20 karakter arası, herhangi bir karakter kullanabilirsiniz
                      </Text>
                      <Text 
                        fontSize="xs" 
                        color={charactersLeft < 5 ? "orange.500" : "neutral.500"}
                      >
                        {charactersLeft} karakter kaldı
                      </Text>
                    </HStack>
                  </FormHelperText>
                )}
              </FormControl>

              {hasChanges && (
                <Alert status="warning" borderRadius="lg">
                  <AlertIcon />
                  <VStack spacing={1} align="start" flex="1">
                    <Text fontSize="sm" fontWeight="medium" color="orange.700">
                      Değişiklik Uyarısı
                    </Text>
                    <Text fontSize="xs" color="orange.600">
                      Kullanıcı adınız değiştirildikten sonra, eski paylaşımlarınızda 
                      yeni adınız görünecektir.
                    </Text>
                  </VStack>
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3} w="full" justify="end">
              <Button 
                variant="ghost" 
                onClick={handleClose}
                isDisabled={isUpdating}
              >
                İptal
              </Button>
              <Button
                type="submit"
                colorScheme="accent"
                isLoading={isUpdating}
                loadingText="Güncelleniyor..."
                isDisabled={!isNicknameValid || !hasChanges}
              >
                {hasChanges ? 'Güncelle' : 'Değişiklik Yok'}
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default ProfileSettings
