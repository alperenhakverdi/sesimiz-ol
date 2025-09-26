import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  useDisclosure,
  useToast,
  Text,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Textarea,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiEye, FiEdit, FiTrash2, FiSend } from 'react-icons/fi';
import AdminLayout from '../components/admin/AdminLayout';
import { api } from '../services/api';

const TypeBadge = ({ type }) => {
  const typeConfig = {
    GENERAL: { color: 'blue', text: 'Genel' },
    USER: { color: 'green', text: 'Kullanıcı' },
    ORGANIZATION: { color: 'purple', text: 'Organizasyon' },
    ADMIN: { color: 'red', text: 'Admin' }
  };

  const config = typeConfig[type] || { color: 'gray', text: type };
  
  return (
    <Badge colorScheme={config.color} variant="subtle">
      {config.text}
    </Badge>
  );
};

const VisibilityBadge = ({ visibility }) => {
  const visibilityConfig = {
    PUBLIC: { color: 'green', text: 'Herkese Açık' },
    PRIVATE: { color: 'red', text: 'Özel' },
    ORGANIZATION: { color: 'purple', text: 'Organizasyon' }
  };

  const config = visibilityConfig[visibility] || { color: 'gray', text: visibility };
  
  return (
    <Badge colorScheme={config.color} variant="outline">
      {config.text}
    </Badge>
  );
};

const AnnouncementDetailModal = ({ isOpen, onClose, announcement }) => {
  if (!announcement) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Duyuru Detayları</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="start">
            <Box>
              <Text fontWeight="bold" fontSize="lg">{announcement.title}</Text>
              <HStack spacing={2} mt={1}>
                <TypeBadge type={announcement.type} />
                <VisibilityBadge visibility={announcement.visibility} />
              </HStack>
            </Box>
            
            <Divider />
            
            <Box>
              <Text fontWeight="semibold" mb={2}>İçerik</Text>
              <Text color="gray.600" whiteSpace="pre-wrap">{announcement.body}</Text>
            </Box>

            <SimpleGrid columns={2} spacing={4} w="full">
              <Box>
                <Text fontWeight="semibold" mb={1}>Başlangıç Tarihi</Text>
                <Text color="gray.600">
                  {announcement.startsAt 
                    ? new Date(announcement.startsAt).toLocaleDateString('tr-TR')
                    : 'Belirtilmemiş'
                  }
                </Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={1}>Bitiş Tarihi</Text>
                <Text color="gray.600">
                  {announcement.endsAt 
                    ? new Date(announcement.endsAt).toLocaleDateString('tr-TR')
                    : 'Belirtilmemiş'
                  }
                </Text>
              </Box>
            </SimpleGrid>

            <Divider />

            <Box w="full">
              <Text fontWeight="semibold" mb={2}>Durum</Text>
              <Text color="gray.600">
                {announcement.isActive ? 'Aktif' : 'Pasif'}
              </Text>
            </Box>

            <Box w="full">
              <Text fontWeight="semibold" mb={2}>Oluşturulma Tarihi</Text>
              <Text color="gray.600">
                {new Date(announcement.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const CreateAnnouncementModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'GENERAL',
    visibility: 'PUBLIC',
    startsAt: '',
    endsAt: ''
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await api.post('/announcements', formData);
      
      if (response.success) {
        toast({
          title: 'Başarılı',
          description: 'Duyuru başarıyla oluşturuldu',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        onSuccess();
        onClose();
        setFormData({
          title: '',
          body: '',
          type: 'GENERAL',
          visibility: 'PUBLIC',
          startsAt: '',
          endsAt: ''
        });
      } else {
        throw new Error(response.error?.message || 'Duyuru oluşturulamadı');
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message || 'Duyuru oluşturulamadı',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Yeni Duyuru Oluştur</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Başlık</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Duyuru başlığı"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>İçerik</FormLabel>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Duyuru içeriği"
                  rows={6}
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Tür</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="GENERAL">Genel</option>
                    <option value="USER">Kullanıcı</option>
                    <option value="ORGANIZATION">Organizasyon</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Görünürlük</FormLabel>
                  <Select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  >
                    <option value="PUBLIC">Herkese Açık</option>
                    <option value="PRIVATE">Özel</option>
                    <option value="ORGANIZATION">Organizasyon</option>
                  </Select>
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Başlangıç Tarihi</FormLabel>
                  <Input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Bitiş Tarihi</FormLabel>
                  <Input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full" justify="end">
                <Button variant="ghost" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" colorScheme="brand" isLoading={loading}>
                  Oluştur
                </Button>
              </HStack>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const toast = useToast();
  const createModal = useDisclosure();
  const detailModal = useDisclosure();

  const fetchAnnouncements = async (page = 1, status = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/announcements', {
        params: {
          page,
          limit: 20,
          status: status || undefined
        }
      });

      if (response.success) {
        setAnnouncements(response.data.announcements);
        setPagination({
          page: response.data.pagination.currentPage,
          limit: response.data.pagination.totalCount / response.data.pagination.totalPages,
          total: response.data.pagination.totalCount,
          totalPages: response.data.pagination.totalPages
        });
      } else {
        throw new Error(response.error?.message || 'Duyurular yüklenemedi');
      }
    } catch (error) {
      console.error('Fetch announcements error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (statusValue) => {
    setStatusFilter(statusValue);
    fetchAnnouncements(1, statusValue);
  };

  const handleViewDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
    detailModal.onOpen();
  };

  const handleDelete = async (announcement) => {
    try {
      await api.delete(`/announcements/${announcement.id}`);
      
      toast({
        title: 'Başarılı',
        description: `"${announcement.title}" duyurusu silindi`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchAnnouncements(pagination.page, statusFilter);
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message || 'Duyuru silinemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <AdminLayout>
      <VStack spacing={6} align="start">
        <HStack justify="space-between" w="full">
          <Heading size="lg" color="brand.600">
            Duyuru Yönetimi
          </Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="brand"
            onClick={createModal.onOpen}
          >
            Yeni Duyuru
          </Button>
        </HStack>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} w="full">
          <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
            <StatLabel fontSize="sm" color="gray.600">Toplam Duyuru</StatLabel>
            <StatNumber color="brand.500">{pagination.total}</StatNumber>
          </Stat>
          <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
            <StatLabel fontSize="sm" color="gray.600">Aktif</StatLabel>
            <StatNumber color="green.500">
              {announcements.filter(ann => ann.isActive).length}
            </StatNumber>
          </Stat>
          <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
            <StatLabel fontSize="sm" color="gray.600">Genel</StatLabel>
            <StatNumber color="blue.500">
              {announcements.filter(ann => ann.type === 'GENERAL').length}
            </StatNumber>
          </Stat>
          <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
            <StatLabel fontSize="sm" color="gray.600">Organizasyon</StatLabel>
            <StatNumber color="purple.500">
              {announcements.filter(ann => ann.type === 'ORGANIZATION').length}
            </StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <Box bg="white" p={4} borderRadius="lg" shadow="sm" w="full">
          <HStack spacing={4}>
            <Select
              placeholder="Durum Filtresi"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              maxW="200px"
            >
              <option value="">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Pasif</option>
            </Select>
          </HStack>
        </Box>

        {/* Announcements Table */}
        <Box bg="white" borderRadius="lg" shadow="sm" w="full" overflow="hidden">
          {loading ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" color="brand.500" />
            </Flex>
          ) : error ? (
            <Alert status="error" borderRadius="lg" m={4}>
              <AlertIcon />
              {error}
            </Alert>
          ) : (
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Başlık</Th>
                  <Th>Tür</Th>
                  <Th>Görünürlük</Th>
                  <Th>Durum</Th>
                  <Th>Oluşturulma</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {announcements.map((announcement) => (
                  <Tr key={announcement.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">{announcement.title}</Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {announcement.body}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <TypeBadge type={announcement.type} />
                    </Td>
                    <Td>
                      <VisibilityBadge visibility={announcement.visibility} />
                    </Td>
                    <Td>
                      <Badge colorScheme={announcement.isActive ? 'green' : 'red'} variant="subtle">
                        {announcement.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </Td>
                    <Td>
                      {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<FiEye />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(announcement)}
                        />
                        <IconButton
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(announcement)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <HStack spacing={2} justify="center" w="full">
            <Button
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchAnnouncements(pagination.page - 1, statusFilter)}
            >
              Önceki
            </Button>
            <Text fontSize="sm" color="gray.600">
              Sayfa {pagination.page} / {pagination.totalPages}
            </Text>
            <Button
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchAnnouncements(pagination.page + 1, statusFilter)}
            >
              Sonraki
            </Button>
          </HStack>
        )}
      </VStack>

      <AnnouncementDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        announcement={selectedAnnouncement}
      />

      <CreateAnnouncementModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={() => fetchAnnouncements(pagination.page, statusFilter)}
      />
    </AdminLayout>
  );
};

export default AdminAnnouncementsPage;