import React from 'react';
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
  Text,
  Badge,
  Divider,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Progress
} from '@chakra-ui/react';

const AnnouncementDetailModal = ({ isOpen, onClose, announcement }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'SENT': return 'green';
      case 'SCHEDULED': return 'yellow';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'SENT': return 'Gönderildi';
      case 'SCHEDULED': return 'Zamanlandı';
      case 'CANCELLED': return 'İptal Edildi';
      default: return 'Taslak';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'USER': return 'Kullanıcılar';
      case 'ORGANIZATION': return 'STK\'lar';
      case 'ADMIN': return 'Adminler';
      default: return 'Genel';
    }
  };

  const getAudienceText = (audience) => {
    switch (audience) {
      case 'users': return 'Kullanıcılar';
      case 'organizations': return 'STK\'lar';
      case 'admins': return 'Adminler';
      default: return 'Herkes';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'HIGH': return 'Yüksek';
      case 'URGENT': return 'Acil';
      case 'LOW': return 'Düşük';
      default: return 'Normal';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'orange';
      case 'URGENT': return 'red';
      case 'LOW': return 'gray';
      default: return 'blue';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getReadPercentage = () => {
    if (!announcement?.recipientCount || announcement.recipientCount === 0) return 0;
    return Math.round((announcement.readCount / announcement.recipientCount) * 100);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>Duyuru Detayları</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={6} align="start">
            {/* Basic Info */}
            <VStack align="start" spacing={3} w="full">
              <HStack justify="space-between" w="full">
                <Text fontSize="xl" fontWeight="bold">
                  {announcement?.title}
                </Text>
                <HStack>
                  <Badge colorScheme={getStatusColor(announcement?.status)}>
                    {getStatusText(announcement?.status)}
                  </Badge>
                  <Badge colorScheme={getPriorityColor(announcement?.priority)}>
                    {getPriorityText(announcement?.priority)}
                  </Badge>
                </HStack>
              </HStack>

              <HStack spacing={4}>
                <Badge variant="outline">
                  {getTypeText(announcement?.type)}
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  Hedef: {getAudienceText(announcement?.targetAudience)}
                </Text>
              </HStack>
            </VStack>

            <Divider />

            {/* Content */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                İçerik
              </Text>
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                border="1px"
                borderColor="gray.200"
              >
                <Text whiteSpace="pre-wrap" lineHeight="tall">
                  {announcement?.content}
                </Text>
              </Box>
            </Box>

            <Divider />

            {/* Statistics */}
            {announcement?.status === 'SENT' && (
              <>
                <Box w="full">
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>
                    İstatistikler
                  </Text>
                  <SimpleGrid columns={3} spacing={4}>
                    <Stat>
                      <StatLabel>Alıcı Sayısı</StatLabel>
                      <StatNumber>{announcement.recipientCount || 0}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Okuyan Sayısı</StatLabel>
                      <StatNumber>{announcement.readCount || 0}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Okunma Oranı</StatLabel>
                      <StatNumber fontSize="md">
                        %{getReadPercentage()}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  <Box mt={4}>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Okunma Durumu
                    </Text>
                    <Progress
                      value={getReadPercentage()}
                      colorScheme="brand"
                      size="lg"
                      borderRadius="md"
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {announcement.readCount} / {announcement.recipientCount} kişi okudu
                    </Text>
                  </Box>
                </Box>
                <Divider />
              </>
            )}

            {/* Dates */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Tarih Bilgileri
              </Text>
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" w="full">
                  <Text color="gray.600">Oluşturulma:</Text>
                  <Text>{formatDate(announcement?.createdAt)}</Text>
                </HStack>

                {announcement?.status === 'SCHEDULED' && announcement?.scheduledAt && (
                  <HStack justify="space-between" w="full">
                    <Text color="gray.600">Zamanlanma:</Text>
                    <Text>{formatDate(announcement.scheduledAt)}</Text>
                  </HStack>
                )}

                {announcement?.status === 'SENT' && announcement?.sentAt && (
                  <HStack justify="space-between" w="full">
                    <Text color="gray.600">Gönderilme:</Text>
                    <Text>{formatDate(announcement.sentAt)}</Text>
                  </HStack>
                )}
              </VStack>
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

export default AnnouncementDetailModal;