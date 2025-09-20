import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
  Text,
  HStack,
  Avatar
} from '@chakra-ui/react';
import { FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SendMessageButton = ({ storyAuthor, storyTitle }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: storyAuthor.id,
          content: message.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Başarılı',
          description: 'Mesajınız gönderildi',
          status: 'success',
          duration: 3000,
          isClosable: true
        });

        onClose();
        setMessage('');

        // Navigate to messages page with this conversation
        navigate('/mesajlar');
      } else {
        toast({
          title: 'Hata',
          description: data.error?.message || 'Mesaj gönderilemedi',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Hata',
        description: 'Mesaj gönderilemedi',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setSending(false);
    }
  };

  const handleOpen = () => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Mesaj göndermek için giriş yapmanız gerekiyor',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (user.id === storyAuthor.id) {
      toast({
        title: 'Bilgi',
        description: 'Kendinize mesaj gönderemezsiniz',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setMessage(`Merhaba! "${storyTitle}" başlıklı hikayeniz hakkında...`);
    onOpen();
  };

  return (
    <>
      <Button
        leftIcon={<FiMessageCircle />}
        colorScheme="blue"
        variant="outline"
        size="sm"
        onClick={handleOpen}
      >
        Mesaj Gönder
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <Text>Mesaj Gönder</Text>
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  name={storyAuthor.nickname}
                  src={storyAuthor.avatar}
                />
                <Text fontSize="sm" color="gray.600">
                  {storyAuthor.nickname}'e mesaj
                </Text>
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                "{storyTitle}" hikayesi hakkında:
              </Text>

              <Textarea
                placeholder="Mesajınızı buraya yazın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={1000}
                resize="vertical"
              />

              <Text fontSize="xs" color="gray.400" textAlign="right">
                {message.length}/1000
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              İptal
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSendMessage}
              isLoading={sending}
              loadingText="Gönderiliyor..."
              isDisabled={!message.trim()}
            >
              Gönder
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SendMessageButton;