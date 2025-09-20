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
  Radio,
  RadioGroup,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';

const UserRoleModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'USER');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: selectedRole })
      });

      if (!response.ok) {
        throw new Error('Rol değiştirilemedi');
      }

      const data = await response.json();

      if (data.success) {
        onUpdate(data.data.user);

        toast({
          title: 'Başarılı',
          description: `${user.nickname} kullanıcısının rolü ${selectedRole === 'ADMIN' ? 'Admin' : 'Kullanıcı'} olarak değiştirildi`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        onClose();
      } else {
        throw new Error(data.error?.message || 'Rol değiştirilemedi');
      }
    } catch (err) {
      console.error('Role change error:', err);
      toast({
        title: 'Hata',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const isChangingToAdmin = selectedRole === 'ADMIN' && user?.role !== 'ADMIN';
  const isChangingToUser = selectedRole === 'USER' && user?.role !== 'USER';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Kullanıcı Rolü Değiştir</ModalHeader>
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

            <VStack align="start" spacing={3} w="full">
              <Text fontWeight="medium">Yeni Rol Seçin:</Text>
              <RadioGroup value={selectedRole} onChange={setSelectedRole}>
                <VStack align="start" spacing={3}>
                  <Radio value="USER">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Kullanıcı</Text>
                      <Text fontSize="sm" color="gray.600">
                        Standart kullanıcı hakları (hikaye yazma, yorum yapma)
                      </Text>
                    </VStack>
                  </Radio>
                  <Radio value="ADMIN">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Admin</Text>
                      <Text fontSize="sm" color="gray.600">
                        Yönetici hakları (kullanıcı/içerik yönetimi, sistem ayarları)
                      </Text>
                    </VStack>
                  </Radio>
                </VStack>
              </RadioGroup>
            </VStack>

            {isChangingToAdmin && (
              <Alert status="warning">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Dikkat: Admin rolü veriliyor
                  </Text>
                  <Text fontSize="sm">
                    Bu kullanıcı tüm admin paneli özelliklerine erişim kazanacak.
                  </Text>
                </VStack>
              </Alert>
            )}

            {isChangingToUser && user?.role === 'ADMIN' && (
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Admin yetkisi kaldırılıyor
                  </Text>
                  <Text fontSize="sm">
                    Bu kullanıcı admin paneline erişimini kaybedecek.
                  </Text>
                </VStack>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            İptal
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleRoleChange}
            isLoading={loading}
            loadingText="Güncelleniyor..."
            isDisabled={selectedRole === user?.role}
          >
            Rolü Değiştir
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserRoleModal;