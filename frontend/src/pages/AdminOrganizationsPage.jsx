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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Flex,
  useToast,
  useDisclosure
} from '@chakra-ui/react';
import { FiMoreVertical, FiSearch, FiEye, FiEdit, FiPlus, FiCheck, FiX } from 'react-icons/fi';
import AdminLayout from '../components/admin/AdminLayout';
import OrganizationDetailModal from '../components/admin/modals/OrganizationDetailModal';
import OrganizationEditModal from '../components/admin/modals/OrganizationEditModal';

const OrganizationStatusBadge = ({ status }) => {
  const statusConfig = {
    ACTIVE: { colorScheme: 'green', label: 'Aktif' },
    PENDING: { colorScheme: 'yellow', label: 'Bekliyor' },
    SUSPENDED: { colorScheme: 'red', label: 'Askıya Alınmış' }
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
};

const OrganizationTypeBadge = ({ type }) => {
  const typeConfig = {
    NGO: { colorScheme: 'blue', label: 'STK' },
    FOUNDATION: { colorScheme: 'purple', label: 'Vakıf' },
    ASSOCIATION: { colorScheme: 'teal', label: 'Dernek' },
    COOPERATIVE: { colorScheme: 'orange', label: 'Kooperatif' }
  };

  const config = typeConfig[type] || typeConfig.NGO;
  return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
};

const OrganizationActionsMenu = ({ organization, onView, onEdit, onApprove, onSuspend }) => {
  const isPending = organization.status === 'PENDING';
  const isActive = organization.status === 'ACTIVE';

  return (
    <Menu>
      <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
      <MenuList>
        <MenuItem icon={<FiEye />} onClick={() => onView(organization)}>
          Detayları Görüntüle
        </MenuItem>
        <MenuItem icon={<FiEdit />} onClick={() => onEdit(organization)}>
          Düzenle
        </MenuItem>
        {isPending && (
          <MenuItem icon={<FiCheck />} onClick={() => onApprove(organization)} color="green.500">
            Onayla
          </MenuItem>
        )}
        {isActive && (
          <MenuItem icon={<FiX />} onClick={() => onSuspend(organization)} color="red.500">
            Askıya Al
          </MenuItem>
        )}
      </MenuList>
    </Menu>
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
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: ''
  });
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  const toast = useToast();
  const detailModal = useDisclosure();
  const editModal = useDisclosure();

  const fetchOrganizations = async (page = 1, search = '', status = '', type = '') => {
    try {
      setLoading(true);
      setError(null);

      // Mock data since Firebase/backend organization system is not implemented yet
      const mockOrganizations = [
        {
          id: '1',
          name: 'Kadın Hakları Derneği',
          description: 'Kadın haklarını savunan STK',
          type: 'ASSOCIATION',
          status: 'ACTIVE',
          contactPerson: 'Ayşe Yılmaz',
          email: 'info@kadinhaklari.org',
          phone: '+90 212 555 0001',
          website: 'https://kadinhaklari.org',
          address: 'İstanbul, Türkiye',
          createdAt: new Date().toISOString(),
          memberCount: 150,
          projectCount: 12
        },
        {
          id: '2',
          name: 'Güçlü Kadın Vakfı',
          description: 'Kadın girişimciliğini destekleyen vakıf',
          type: 'FOUNDATION',
          status: 'PENDING',
          contactPerson: 'Fatma Demir',
          email: 'info@guclukadin.org',
          phone: '+90 312 555 0002',
          website: 'https://guclukadin.org',
          address: 'Ankara, Türkiye',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          memberCount: 0,
          projectCount: 0
        },
        {
          id: '3',
          name: 'Kadın Kooperatifleri Birliği',
          description: 'Kadın kooperatiflerini destekleyen birlik',
          type: 'COOPERATIVE',
          status: 'ACTIVE',
          contactPerson: 'Zehra Öztürk',
          email: 'info@kadinkooperatifleri.org',
          phone: '+90 232 555 0003',
          website: 'https://kadinkooperatifleri.org',
          address: 'İzmir, Türkiye',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          memberCount: 85,
          projectCount: 8
        }
      ];

      // Apply filters
      let filteredOrgs = mockOrganizations;
      if (search) {
        filteredOrgs = filteredOrgs.filter(org =>
          org.name.toLowerCase().includes(search.toLowerCase()) ||
          org.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (status) {
        filteredOrgs = filteredOrgs.filter(org => org.status === status);
      }
      if (type) {
        filteredOrgs = filteredOrgs.filter(org => org.type === type);
      }

      setOrganizations(filteredOrgs);
      setPagination({
        page,
        limit: 20,
        total: filteredOrgs.length,
        totalPages: Math.ceil(filteredOrgs.length / 20)
      });
    } catch (err) {
      console.error('Fetch organizations error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    fetchOrganizations(1, searchValue, filters.status, filters.type);
  };

  const handleStatusFilter = (statusValue) => {
    setFilters(prev => ({ ...prev, status: statusValue }));
    fetchOrganizations(1, filters.search, statusValue, filters.type);
  };

  const handleTypeFilter = (typeValue) => {
    setFilters(prev => ({ ...prev, type: typeValue }));
    fetchOrganizations(1, filters.search, filters.status, typeValue);
  };

  const handleViewOrganization = (organization) => {
    setSelectedOrganization(organization);
    detailModal.onOpen();
  };

  const handleEditOrganization = (organization) => {
    setSelectedOrganization(organization);
    editModal.onOpen();
  };

  const handleApproveOrganization = async (organization) => {
    try {
      // Mock approval
      const updatedOrg = { ...organization, status: 'ACTIVE' };
      setOrganizations(prevOrgs =>
        prevOrgs.map(org =>
          org.id === organization.id ? updatedOrg : org
        )
      );

      toast({
        title: 'Başarılı',
        description: `${organization.name} onaylandı`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'STK onaylanamadı',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSuspendOrganization = async (organization) => {
    try {
      // Mock suspension
      const updatedOrg = { ...organization, status: 'SUSPENDED' };
      setOrganizations(prevOrgs =>
        prevOrgs.map(org =>
          org.id === organization.id ? updatedOrg : org
        )
      );

      toast({
        title: 'Başarılı',
        description: `${organization.name} askıya alındı`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'STK askıya alınamadı',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleOrganizationUpdate = (updatedOrganization) => {
    setOrganizations(prevOrgs =>
      prevOrgs.map(org =>
        org.id === updatedOrganization.id ? { ...org, ...updatedOrganization } : org
      )
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusCounts = () => {
    const active = organizations.filter(o => o.status === 'ACTIVE').length;
    const pending = organizations.filter(o => o.status === 'PENDING').length;
    const suspended = organizations.filter(o => o.status === 'SUSPENDED').length;
    return { active, pending, suspended };
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const statusCounts = getStatusCounts();

  return (
    <AdminLayout>
      <VStack align="start" spacing={6}>
        <HStack justify="space-between" w="full">
          <Heading size="lg" color="brand.600">
            STK Yönetimi
          </Heading>
          <Button leftIcon={<FiPlus />} colorScheme="brand">
            Yeni STK Ekle
          </Button>
        </HStack>

        {/* Status Summary */}
        <HStack spacing={4}>
          <Badge colorScheme="green" px={3} py={1}>
            {statusCounts.active} Aktif
          </Badge>
          <Badge colorScheme="yellow" px={3} py={1}>
            {statusCounts.pending} Bekleyen
          </Badge>
          <Badge colorScheme="red" px={3} py={1}>
            {statusCounts.suspended} Askıya Alınmış
          </Badge>
        </HStack>

        {/* Filters */}
        <HStack spacing={4} w="full">
          <Box flex="1">
            <Input
              placeholder="STK adı veya açıklama ile ara..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(e.target.value)}
              leftElement={<FiSearch />}
            />
          </Box>
          <Select
            placeholder="Tüm Durumlar"
            value={filters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            w="200px"
          >
            <option value="ACTIVE">Aktif</option>
            <option value="PENDING">Bekleyen</option>
            <option value="SUSPENDED">Askıya Alınmış</option>
          </Select>
          <Select
            placeholder="Tüm Tipler"
            value={filters.type}
            onChange={(e) => handleTypeFilter(e.target.value)}
            w="200px"
          >
            <option value="NGO">STK</option>
            <option value="FOUNDATION">Vakıf</option>
            <option value="ASSOCIATION">Dernek</option>
            <option value="COOPERATIVE">Kooperatif</option>
          </Select>
          <Button
            onClick={() => handleSearch(filters.search)}
            colorScheme="brand"
          >
            Ara
          </Button>
        </HStack>

        {/* Organizations Table */}
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="lg" color="brand.500" />
          </Flex>
        ) : error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : (
          <Box w="full" overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>STK Adı</Th>
                  <Th>Tip</Th>
                  <Th>Durum</Th>
                  <Th>İletişim Kişisi</Th>
                  <Th>Üye Sayısı</Th>
                  <Th>Kayıt Tarihi</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {organizations.map((organization) => (
                  <Tr key={organization.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{organization.name}</Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>
                          {organization.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <OrganizationTypeBadge type={organization.type} />
                    </Td>
                    <Td>
                      <OrganizationStatusBadge status={organization.status} />
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm">{organization.contactPerson}</Text>
                        <Text fontSize="xs" color="gray.600">{organization.email}</Text>
                      </VStack>
                    </Td>
                    <Td>{organization.memberCount}</Td>
                    <Td>{formatDate(organization.createdAt)}</Td>
                    <Td>
                      <OrganizationActionsMenu
                        organization={organization}
                        onView={handleViewOrganization}
                        onEdit={handleEditOrganization}
                        onApprove={handleApproveOrganization}
                        onSuspend={handleSuspendOrganization}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <HStack spacing={2}>
            <Button
              size="sm"
              onClick={() => fetchOrganizations(pagination.page - 1, filters.search, filters.status, filters.type)}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <Text fontSize="sm">
              Sayfa {pagination.page} / {pagination.totalPages}
            </Text>
            <Button
              size="sm"
              onClick={() => fetchOrganizations(pagination.page + 1, filters.search, filters.status, filters.type)}
              disabled={pagination.page === pagination.totalPages}
            >
              Sonraki
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Modals */}
      {selectedOrganization && (
        <>
          <OrganizationDetailModal
            isOpen={detailModal.isOpen}
            onClose={detailModal.onClose}
            organization={selectedOrganization}
          />
          <OrganizationEditModal
            isOpen={editModal.isOpen}
            onClose={editModal.onClose}
            organization={selectedOrganization}
            onUpdate={handleOrganizationUpdate}
          />
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOrganizationsPage;