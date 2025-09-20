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
  Avatar,
  Text,
  Flex,
  useToast,
  useDisclosure
} from '@chakra-ui/react';
import { FiMoreVertical, FiSearch, FiEye, FiEdit, FiUserX, FiUserCheck, FiShield } from 'react-icons/fi';
import AdminLayout from '../components/admin/AdminLayout';
import UserDetailModal from '../components/admin/modals/UserDetailModal';
import UserBanModal from '../components/admin/modals/UserBanModal';
import UserRoleModal from '../components/admin/modals/UserRoleModal';

const UserStatusBadge = ({ user }) => {
  if (user.isBanned) {
    return <Badge colorScheme="red">Yasaklı</Badge>;
  }
  if (!user.isActive) {
    return <Badge colorScheme="gray">Pasif</Badge>;
  }
  if (!user.emailVerified) {
    return <Badge colorScheme="yellow">Email Doğrulanmamış</Badge>;
  }
  return <Badge colorScheme="green">Aktif</Badge>;
};

const UserRoleBadge = ({ role }) => {
  const colorScheme = role === 'ADMIN' ? 'purple' : 'blue';
  const label = role === 'ADMIN' ? 'Admin' : 'Kullanıcı';
  return <Badge colorScheme={colorScheme}>{label}</Badge>;
};

const UserActionsMenu = ({ user, onView, onBan, onChangeRole }) => {
  return (
    <Menu>
      <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
      <MenuList>
        <MenuItem icon={<FiEye />} onClick={() => onView(user)}>
          Detayları Görüntüle
        </MenuItem>
        <MenuItem
          icon={user.isBanned ? <FiUserCheck /> : <FiUserX />}
          onClick={() => onBan(user)}
          color={user.isBanned ? 'green.500' : 'red.500'}
        >
          {user.isBanned ? 'Yasağı Kaldır' : 'Yasakla'}
        </MenuItem>
        <MenuItem icon={<FiShield />} onClick={() => onChangeRole(user)}>
          Rol Değiştir
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
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
    role: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);

  const toast = useToast();
  const detailModal = useDisclosure();
  const banModal = useDisclosure();
  const roleModal = useDisclosure();

  const fetchUsers = async (page = 1, search = '', role = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(role && { role })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Kullanıcılar yüklenemedi');
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || 'Veri yüklenemedi');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    fetchUsers(1, searchValue, filters.role);
  };

  const handleRoleFilter = (roleValue) => {
    setFilters(prev => ({ ...prev, role: roleValue }));
    fetchUsers(1, filters.search, roleValue);
  };

  const handlePageChange = (newPage) => {
    fetchUsers(newPage, filters.search, filters.role);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    detailModal.onOpen();
  };

  const handleBanUser = (user) => {
    setSelectedUser(user);
    banModal.onOpen();
  };

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    roleModal.onOpen();
  };

  const handleUserUpdate = (updatedUser) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      )
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminLayout>
      <VStack align="start" spacing={6}>
        <Heading size="lg" color="brand.600">
          Kullanıcı Yönetimi
        </Heading>

        {/* Filters */}
        <HStack spacing={4} w="full">
          <Box flex="1">
            <Input
              placeholder="Kullanıcı adı veya email ile ara..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(e.target.value)}
              leftElement={<FiSearch />}
            />
          </Box>
          <Select
            placeholder="Tüm Roller"
            value={filters.role}
            onChange={(e) => handleRoleFilter(e.target.value)}
            w="200px"
          >
            <option value="USER">Kullanıcı</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Button
            onClick={() => handleSearch(filters.search)}
            colorScheme="brand"
          >
            Ara
          </Button>
        </HStack>

        {/* Users Table */}
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
                  <Th>Kullanıcı</Th>
                  <Th>Email</Th>
                  <Th>Rol</Th>
                  <Th>Durum</Th>
                  <Th>Son Giriş</Th>
                  <Th>Kayıt Tarihi</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <HStack>
                        <Avatar size="sm" name={user.nickname} />
                        <Text fontWeight="medium">{user.nickname}</Text>
                      </HStack>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <UserRoleBadge role={user.role} />
                    </Td>
                    <Td>
                      <UserStatusBadge user={user} />
                    </Td>
                    <Td>{formatDate(user.lastLoginAt)}</Td>
                    <Td>{formatDate(user.createdAt)}</Td>
                    <Td>
                      <UserActionsMenu
                        user={user}
                        onView={handleViewUser}
                        onBan={handleBanUser}
                        onChangeRole={handleChangeRole}
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
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <Text fontSize="sm">
              Sayfa {pagination.page} / {pagination.totalPages}
            </Text>
            <Button
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Sonraki
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Modals */}
      {selectedUser && (
        <>
          <UserDetailModal
            isOpen={detailModal.isOpen}
            onClose={detailModal.onClose}
            user={selectedUser}
          />
          <UserBanModal
            isOpen={banModal.isOpen}
            onClose={banModal.onClose}
            user={selectedUser}
            onUpdate={handleUserUpdate}
          />
          <UserRoleModal
            isOpen={roleModal.isOpen}
            onClose={roleModal.onClose}
            user={selectedUser}
            onUpdate={handleUserUpdate}
          />
        </>
      )}
    </AdminLayout>
  );
};

export default AdminUsersPage;