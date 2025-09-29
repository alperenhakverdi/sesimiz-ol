import React, { useState } from 'react'
import {
  Button,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Select,
  Textarea,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react'
import { FiFlag, FiMoreVertical } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { useColorModeValue } from '@chakra-ui/react'

const ReportStoryButton = ({ storyId, storyTitle, size = "sm", variant = "ghost" }) => {
  const { user, token } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const toast = useToast()

  const handleReport = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir şikayet sebebi seçin',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/stories/${storyId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason,
          description
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Şikayet Gönderildi',
          description: 'Şikayetiniz başarıyla gönderildi. En kısa sürede değerlendirilecektir.',
          status: 'success',
          duration: 5000,
          isClosable: true
        })
        onClose()
        setReason('')
        setDescription('')
      } else {
        throw new Error(data.error?.message || 'Şikayet gönderilemedi')
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setReason('')
    setDescription('')
  }

  if (!user || !token) {
    return null
  }

  return (
    <>
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<FiMoreVertical />}
          size={size}
          variant={variant}
          aria-label="Daha fazla seçenek"
        />
        <MenuList>
          <MenuItem
            icon={<FiFlag />}
            onClick={onOpen}
            color="red.600"
          >
            Hikayeyi Şikayet Et
          </MenuItem>
        </MenuList>
      </Menu>

      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Hikayeyi Şikayet Et</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={useColorModeValue('neutral.600','neutral.300')}>
                <Text as="span" fontWeight="medium">"{storyTitle}"</Text>
                {' '}başlıklı hikayeyi neden şikayet ediyorsunuz?
              </Text>

              <Select
                placeholder="Şikayet sebebini seçin"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="inappropriate_content">Uygunsuz İçerik</option>
                <option value="harassment">Taciz / Zorbalık</option>
                <option value="hate_speech">Nefret Söylemi</option>
                <option value="spam">Spam / İstenmeyen İçerik</option>
                <option value="misinformation">Yanlış Bilgi</option>
                <option value="violence">Şiddet İçeriği</option>
                <option value="copyright">Telif Hakkı İhlali</option>
                <option value="privacy">Mahremiyet İhlali</option>
                <option value="fake_story">Sahte Hikaye</option>
                <option value="other">Diğer</option>
              </Select>

              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color={useColorModeValue('neutral.600','neutral.300')}>
                  Açıklama (isteğe bağlı):
                </Text>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Şikayetiniz hakkında daha fazla bilgi verin..."
                  maxLength={1000}
                  rows={5}
                />
                <Text fontSize="xs" color={useColorModeValue('neutral.600','neutral.400')}>
                  {description.length}/1000
                </Text>
              </VStack>

              <Text fontSize="xs" color={useColorModeValue('neutral.600','neutral.400')} bg={useColorModeValue('neutral.100','neutral.800')} p={3} borderRadius="md">
                <Text as="span" fontWeight="medium">Not:</Text>
                {' '}Tüm şikayetler gizli olarak incelenir. Şikayet eden kişinin kimliği gizli tutulur.
                Yanlış şikayetler hesap askıya alınmasına neden olabilir.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleClose}
            >
              İptal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleReport}
              isLoading={loading}
              isDisabled={!reason.trim()}
            >
              Şikayet Et
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ReportStoryButton