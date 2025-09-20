import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Avatar,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';

const UserBanModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleBanToggle = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('İşlem başarısız');
      }

      const data = await response.json();

      if (data.success) {
        onUpdate(data.data.user);

        toast({
          title: 'Başarılı',
          description: user.isBanned
            ? `${user.nickname} kullanıcısının yasağı kaldırıldı`
            : `${user.nickname} kullanıcısı yasaklandı`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        onClose();
      } else {
        throw new Error(data.error?.message || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Ban toggle error:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const actionText = user?.isBanned ? 'Yasağı Kaldır' : 'Yasakla';
  const actionColor = user?.isBanned ? 'green' : 'red';
  const warningText = user?.isBanned
    ? 'Bu kullanıcının yasağını kaldırmak istediğinizden emin misiniz?'
    : 'Bu kullanıcıyı yasaklamak istediğinizden emin misiniz?';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{actionText}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Avatar size="md" name={user?.nickname} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{user?.nickname}</Text>
                <Text fontSize="sm" color="gray.600">{user?.email}</Text>
              </VStack>
            </HStack>

            <Alert status={user?.isBanned ? 'info' : 'warning'}>
              <AlertIcon />
              {warningText}
            </Alert>

            {!user?.isBanned && (
              <VStack align="start" spacing={2} w="full">
                <Text fontSize="sm" fontWeight="medium">
                  Yasaklandığında:
                </Text>
                <VStack align="start" spacing={1} pl={4}>
                  <Text fontSize="sm" color="gray.600">
                    • Platformda oturum açamayacak
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    • Yeni hikaye paylaşamayacak
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    • Yorum yapamayacak
                  </Text>
                </VStack>
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            İptal
          </Button>
          <Button
            colorScheme={actionColor}
            onClick={handleBanToggle}
            isLoading={loading}
            loadingText="İşleniyor..."
          >
            {actionText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserBanModal;
