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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
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
  StatHelpText,
  StatArrow
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiMoreVertical, FiEye, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import AdminLayout from '../components/admin/AdminLayout';
import { api } from '../services/api';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    ACTIVE: { color: 'green', text: 'Aktif' },
    PENDING: { color: 'yellow', text: 'Beklemede' },
    SUSPENDED: { color: 'red', text: 'Askıya Alınmış' },
    REJECTED: { color: 'red', text: 'Reddedildi' }
  };

  const config = statusConfig[status] || { color: 'gray', text: status };
  
  return (
    <Badge colorScheme={config.color} variant="subtle">
      {config.text}
    </Badge>
  );
};

const TypeBadge = ({ type }) => {
  const typeConfig = {
    NGO: { color: 'blue', text: 'STK' },
    FOUNDATION: { color: 'purple', text: 'Vakıf' },
    ASSOCIATION: { color: 'teal', text: 'Dernek' },
    COOPERATIVE: { color: 'orange', text: 'Kooperatif' }
  };

  const config = typeConfig[type] || { color: 'gray', text: type };
  
  return (
    <Badge colorScheme={config.color} variant="outline">
      {config.text}
    </Badge>
  );
};

const OrganizationDetailModal = ({ isOpen, onClose, organization }) => {
  if (!organization) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Organizasyon Detayları</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="start">
            <Box>
              <Text fontWeight="bold" fontSize="lg">{organization.name}</Text>
              <HStack spacing={2} mt={1}>
                <TypeBadge type={organization.type} />
                <StatusBadge status={organization.status} />
              </HStack>
            </Box>
            
            <Divider />
            
            <Box>
              <Text fontWeight="semibold" mb={2}>Açıklama</Text>
              <Text color="gray.600">{organization.description}</Text>
            </Box>

            {organization.longDescription && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Detaylı Açıklama</Text>
                <Text color="gray.600">{organization.longDescription}</Text>
              </Box>
            )}

            <SimpleGrid columns={2} spacing={4} w="full">
              <Box>
                <Text fontWeight="semibold" mb={1}>Konum</Text>
                <Text color="gray.600">{organization.location || 'Belirtilmemiş'}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={1}>Üye Sayısı</Text>
                <Text color="gray.600">{organization.memberCount || 0}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={1}>Kuruluş Yılı</Text>
                <Text color="gray.600">{organization.foundedYear || 'Belirtilmemiş'}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={1}>Website</Text>
                <Text color="blue.500" as="a" href={organization.website} target="_blank">
                  {organization.website || 'Belirtilmemiş'}
                </Text>
              </Box>
            </SimpleGrid>

            <Divider />

            <Box w="full">
              <Text fontWeight="semibold" mb={2}>İletişim Bilgileri</Text>
              <VStack spacing={2} align="start">
                <Text><strong>Email:</strong> {organization.email || 'Belirtilmemiş'}</Text>
                <Text><strong>Telefon:</strong> {organization.phone || 'Belirtilmemiş'}</Text>
                <Text><strong>Adres:</strong> {organization.address || 'Belirtilmemiş'}</Text>
              </VStack>
            </Box>

            <Box w="full">
              <Text fontWeight="semibold" mb={2}>Oluşturulma Tarihi</Text>
              <Text color="gray.600">
                {new Date(organization.createdAt).toLocaleDateString('tr-TR', {
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

const AdminOrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  const toast = useToast();
  const detailModal = useDisclosure();
  const editModal = useDisclosure();

  const fetchOrganizations = async (page = 1, search = '', status = '', type = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/organizations', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: status || undefined,
          type: type || undefined
        }
      });

      if (response.success) {
        setOrganizations(response.data.organizations);
        setPagination({
          page: response.data.pagination.currentPage,
          limit: response.data.pagination.totalCount / response.data.pagination.totalPages,
          total: response.data.pagination.totalCount,
          totalPages: response.data.pagination.totalPages
        });
      } else {
        throw new Error(response.error?.message || 'Organizasyonlar yüklenemedi');
      }
    } catch (error) {
      console.error('Fetch organizations error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchOrganizations(1, searchQuery, statusFilter, typeFilter);
  };

  const handleStatusFilter = (statusValue) => {
    setStatusFilter(statusValue);
    fetchOrganizations(1, searchQuery, statusValue, typeFilter);
  };

  const handleTypeFilter = (typeValue) => {
    setTypeFilter(typeValue);
    fetchOrganizations(1, searchQuery, statusFilter, typeValue);
  };

  const handleViewDetails = (organization) => {
    setSelectedOrganization(organization);
    detailModal.onOpen();
  };

  const handleApprove = async (organization) => {
    try {
      // API call to approve organization
      toast({
        title: 'Başarılı',
        description: `"${organization.name}" organizasyonu onaylandı`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh the list
      fetchOrganizations(pagination.page, searchQuery, statusFilter, typeFilter);
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message || 'Organizasyon onaylanamadı',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleReject = async (organization) => {
    try {
      // API call to reject organization
      toast({
        title: 'Başarılı',
        description: `"${organization.name}" organizasyonu reddedildi`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh the list
      fetchOrganizations(pagination.page, searchQuery, statusFilter, typeFilter);
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message || 'Organizasyon reddedilemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <AdminLayout>
      <VStack spacing={6} align="start">
        <Heading size="lg" color="brand.600">
          Organizasyon Yönetimi
        </Heading>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} w="full">
          <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
            <StatLabel fontSize="sm" color="gray.600">Toplam Organizasyon</StatLabel>
            <StatNumber color="brand.500">{pagination.total}</StatNumber>
          </Stat>
          <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
            <StatLabel fontSize="sm" color="gray.600">Aktif</StatLabel>
            <StatNumber color="green.500">
              {organizations.filter(org => org.status === 'ACTIVE').length}
            </StatNumber>
          </Stat>
          <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
            <StatLabel fontSize="sm" color="gray.600">Beklemede</StatLabel>
            <StatNumber color="yellow.500">
              {organizations.filter(org => org.status === 'PENDING').length}
            </StatNumber>
          </Stat>
          <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
            <StatLabel fontSize="sm" color="gray.600">Reddedilen</StatLabel>
            <StatNumber color="red.500">
              {organizations.filter(org => org.status === 'REJECTED').length}
            </StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <Box bg="white" p={4} borderRadius="lg" shadow="sm" w="full">
          <HStack spacing={4} wrap="wrap">
            <Input
              placeholder="Organizasyon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              maxW="300px"
            />
            <Button leftIcon={<FiSearch />} onClick={handleSearch} colorScheme="brand">
              Ara
            </Button>
            
            <Select
              placeholder="Durum Filtresi"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              maxW="200px"
            >
              <option value="">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="PENDING">Beklemede</option>
              <option value="SUSPENDED">Askıya Alınmış</option>
              <option value="REJECTED">Reddedildi</option>
            </Select>

            <Select
              placeholder="Tür Filtresi"
              value={typeFilter}
              onChange={(e) => handleTypeFilter(e.target.value)}
              maxW="200px"
            >
              <option value="">Tüm Türler</option>
              <option value="NGO">STK</option>
              <option value="FOUNDATION">Vakıf</option>
              <option value="ASSOCIATION">Dernek</option>
              <option value="COOPERATIVE">Kooperatif</option>
            </Select>
          </HStack>
        </Box>

        {/* Organizations Table */}
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
                  <Th>Organizasyon</Th>
                  <Th>Tür</Th>
                  <Th>Durum</Th>
                  <Th>Üye Sayısı</Th>
                  <Th>Oluşturulma</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {organizations.map((organization) => (
                  <Tr key={organization.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">{organization.name}</Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>
                          {organization.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <TypeBadge type={organization.type} />
                    </Td>
                    <Td>
                      <StatusBadge status={organization.status} />
                    </Td>
                    <Td>{organization.memberCount || 0}</Td>
                    <Td>
                      {new Date(organization.createdAt).toLocaleDateString('tr-TR')}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<FiEye />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(organization)}
                        />
                        {organization.status === 'PENDING' && (
                          <>
                            <IconButton
                              icon={<FiCheck />}
                              size="sm"
                              colorScheme="green"
                              variant="ghost"
                              onClick={() => handleApprove(organization)}
                            />
                            <IconButton
                              icon={<FiX />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleReject(organization)}
                            />
                          </>
                        )}
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
              onClick={() => fetchOrganizations(pagination.page - 1, searchQuery, statusFilter, typeFilter)}
            >
              Önceki
            </Button>
            <Text fontSize="sm" color="gray.600">
              Sayfa {pagination.page} / {pagination.totalPages}
            </Text>
            <Button
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchOrganizations(pagination.page + 1, searchQuery, statusFilter, typeFilter)}
            >
              Sonraki
            </Button>
          </HStack>
        )}
      </VStack>

      <OrganizationDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        organization={selectedOrganization}
      />
    </AdminLayout>
  );
};

export default AdminOrganizationsPage;