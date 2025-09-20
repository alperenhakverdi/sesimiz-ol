import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Avatar,
  Text,
  Badge,
  Divider,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

const UserDetailModal = ({ isOpen, onClose, user }) => {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock stats for now - can be implemented later with Firebase queries
      const mockStats = {
        storiesCount: Math.floor(Math.random() * 20),
        commentsCount: Math.floor(Math.random() * 50),
        totalViews: Math.floor(Math.random() * 1000),
        joinDaysAgo: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
      };

      setUserStats(mockStats);
    } catch (err) {
      setError('İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchUserStats();
    }
  }, [isOpen, user]);

  const getStatusColor = (user) => {
    if (user.isBanned) return 'red';
    if (!user.isActive) return 'gray';
    if (!user.emailVerified) return 'yellow';
    return 'green';
  };

  const getStatusText = (user) => {
    if (user.isBanned) return 'Yasaklı';
    if (!user.isActive) return 'Pasif';
    if (!user.emailVerified) return 'Email Doğrulanmamış';
    return 'Aktif';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Kullanıcı Detayları</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="start">
            {/* User Basic Info */}
            <HStack spacing={4}>
              <Avatar size="lg" name={user.nickname} />
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold">
                  {user.nickname}
                </Text>
                <Text color="gray.600">{user.email}</Text>
                <HStack>
                  <Badge colorScheme={user.role === 'ADMIN' ? 'purple' : 'blue'}>
                    {user.role === 'ADMIN' ? 'Admin' : 'Kullanıcı'}
                  </Badge>
                  <Badge colorScheme={getStatusColor(user)}>
                    {getStatusText(user)}
                  </Badge>
                </HStack>
              </VStack>
            </HStack>

            <Divider />

            {/* Account Details */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Hesap Bilgileri
              </Text>
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" w="full">
                  <Text color="gray.600">Kayıt Tarihi:</Text>
                  <Text>{formatDate(user.createdAt)}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text color="gray.600">Son Giriş:</Text>
                  <Text>{formatDate(user.lastLoginAt)}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text color="gray.600">Email Doğrulama:</Text>
                  <Badge colorScheme={user.emailVerified ? 'green' : 'red'}>
                    {user.emailVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                  </Badge>
                </HStack>
                {user.lockedUntil && (
                  <HStack justify="space-between" w="full">
                    <Text color="gray.600">Kilit Bitiş:</Text>
                    <Text color="red.500">{formatDate(user.lockedUntil)}</Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            <Divider />

            {/* User Statistics */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                İstatistikler
              </Text>
              {loading ? (
                <Spinner size="md" />
              ) : error ? (
                <Alert status="warning" size="sm">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : userStats ? (
                <SimpleGrid columns={2} spacing={4}>
                  <Stat>
                    <StatLabel>Hikaye Sayısı</StatLabel>
                    <StatNumber>{userStats.storiesCount}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Yorum Sayısı</StatLabel>
                    <StatNumber>{userStats.commentsCount}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Toplam Görüntüleme</StatLabel>
                    <StatNumber>{userStats.totalViews}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Üyelik Süresi</StatLabel>
                    <StatNumber>{userStats.joinDaysAgo} gün</StatNumber>
                  </Stat>
                </SimpleGrid>
              ) : null}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Kapat</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserDetailModal;