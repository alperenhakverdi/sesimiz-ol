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
  Link,
  useColorModeValue
} from '@chakra-ui/react';
import { FiExternalLink, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const OrganizationDetailModal = ({ isOpen, onClose, organization }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'SUSPENDED': return 'red';
      default: return 'yellow';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Aktif';
      case 'SUSPENDED': return 'Askıya Alınmış';
      default: return 'Bekliyor';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'FOUNDATION': return 'Vakıf';
      case 'ASSOCIATION': return 'Dernek';
      case 'COOPERATIVE': return 'Kooperatif';
      default: return 'STK';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>STK Detayları</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="start">
            {/* Basic Info */}
            <VStack align="start" spacing={3} w="full">
              <HStack justify="space-between" w="full">
                <Text fontSize="xl" fontWeight="bold">
                  {organization?.name}
                </Text>
                <HStack>
                  <Badge colorScheme={getStatusColor(organization?.status)}>
                    {getStatusText(organization?.status)}
                  </Badge>
                  <Badge variant="outline">
                    {getTypeText(organization?.type)}
                  </Badge>
                </HStack>
              </HStack>

              <Text color={useColorModeValue('neutral.600', 'neutral.300')} lineHeight="tall">
                {organization?.description}
              </Text>
            </VStack>

            <Divider />

            {/* Contact Information */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                İletişim Bilgileri
              </Text>
              <VStack align="start" spacing={3}>
                <HStack>
                  <Text fontWeight="medium" minW="120px">İletişim Kişisi:</Text>
                  <Text>{organization?.contactPerson}</Text>
                </HStack>
                <HStack>
                  <FiMail />
                  <Link href={`mailto:${organization?.email}`} color={useColorModeValue('blue.600', 'blue.300')}>
                    {organization?.email}
                  </Link>
                </HStack>
                <HStack>
                  <FiPhone />
                  <Link href={`tel:${organization?.phone}`} color={useColorModeValue('blue.600', 'blue.300')}>
                    {organization?.phone}
                  </Link>
                </HStack>
                {organization?.website && (
                  <HStack>
                    <FiExternalLink />
                    <Link href={organization.website} isExternal color={useColorModeValue('blue.600', 'blue.300')}>
                      {organization.website}
                    </Link>
                  </HStack>
                )}
                <HStack>
                  <FiMapPin />
                  <Text>{organization?.address}</Text>
                </HStack>
              </VStack>
            </Box>

            <Divider />

            {/* Statistics */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                İstatistikler
              </Text>
              <SimpleGrid columns={3} spacing={4}>
                <Stat>
                  <StatLabel>Üye Sayısı</StatLabel>
                  <StatNumber>{organization?.memberCount || 0}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Proje Sayısı</StatLabel>
                  <StatNumber>{organization?.projectCount || 0}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Kayıt Tarihi</StatLabel>
                  <StatNumber fontSize="md">
                    {formatDate(organization?.createdAt).split(' ')[0]}
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Additional Info */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Ek Bilgiler
              </Text>
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" w="full">
                  <Text color={useColorModeValue('neutral.600', 'neutral.300')}>Kayıt Tarihi:</Text>
                  <Text>{formatDate(organization?.createdAt)}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text color={useColorModeValue('neutral.600', 'neutral.300')}>Son Güncelleme:</Text>
                  <Text>{formatDate(organization?.updatedAt || organization?.createdAt)}</Text>
                </HStack>
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

export default OrganizationDetailModal;