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
import { FiMoreVertical, FiEye, FiEdit, FiPlus, FiSend, FiTrash2 } from 'react-icons/fi';
import AdminLayout from '../components/admin/AdminLayout';
import AnnouncementCreateModal from '../components/admin/modals/AnnouncementCreateModal';
import AnnouncementDetailModal from '../components/admin/modals/AnnouncementDetailModal';

const AnnouncementStatusBadge = ({ status }) => {
  const statusConfig = {
    DRAFT: { colorScheme: 'gray', label: 'Taslak' },
    SCHEDULED: { colorScheme: 'yellow', label: 'Zamanlandı' },
    SENT: { colorScheme: 'green', label: 'Gönderildi' },
    CANCELLED: { colorScheme: 'red', label: 'İptal Edildi' }
  };

  const config = statusConfig[status] || statusConfig.DRAFT;
  return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
};

const AnnouncementTypeBadge = ({ type }) => {
  const typeConfig = {
    GENERAL: { colorScheme: 'blue', label: 'Genel' },
    USER: { colorScheme: 'purple', label: 'Kullanıcılar' },
    ORGANIZATION: { colorScheme: 'teal', label: 'STK\'lar' },
    ADMIN: { colorScheme: 'orange', label: 'Adminler' }
  };

  const config = typeConfig[type] || typeConfig.GENERAL;
  return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
};

const AnnouncementActionsMenu = ({ announcement, onView, onEdit, onSend, onDelete }) => {
  const isDraft = announcement.status === 'DRAFT';
  const isScheduled = announcement.status === 'SCHEDULED';

  return (
    <Menu>
      <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
      <MenuList>
        <MenuItem icon={<FiEye />} onClick={() => onView(announcement)}>
          Detayları Görüntüle
        </MenuItem>
        {(isDraft || isScheduled) && (
          <MenuItem icon={<FiEdit />} onClick={() => onEdit(announcement)}>
            Düzenle
          </MenuItem>
        )}
        {isDraft && (
          <MenuItem icon={<FiSend />} onClick={() => onSend(announcement)} color="green.500">
            Gönder
          </MenuItem>
        )}
        {(isDraft || isScheduled) && (
          <MenuItem icon={<FiTrash2 />} onClick={() => onDelete(announcement)} color="red.500">
            Sil
          </MenuItem>
        )}
      </MenuList>
    </Menu>
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

      // Mock data since announcement system is not implemented yet
      const mockAnnouncements = [
        {
          id: '1',
          title: 'Platformda Yeni Özellikler',
          content: 'Sevgili kullanıcılarımız, platformumuzda yeni özellikler eklendi...',
          type: 'GENERAL',
          status: 'SENT',
          targetAudience: 'all',
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          recipientCount: 245,
          readCount: 156
        },
        {
          id: '2',
          title: 'STK Başvuru Süreci Güncellendi',
          content: 'STK başvuru sürecinde önemli değişiklikler yapıldı...',
          type: 'ORGANIZATION',
          status: 'SCHEDULED',
          targetAudience: 'organizations',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          recipientCount: 15,
          readCount: 0
        },
        {
          id: '3',
          title: 'Bakım Duyurusu',
          content: 'Bu pazartesi gece 02:00-04:00 arası bakım çalışması...',
          type: 'USER',
          status: 'DRAFT',
          targetAudience: 'users',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          recipientCount: 0,
          readCount: 0
        }
      ];

      // Filter by status if provided
      const filteredAnnouncements = status
        ? mockAnnouncements.filter(ann => ann.status === status)
        : mockAnnouncements;

      setAnnouncements(filteredAnnouncements);
      setPagination({
        page,
        limit: 20,
        total: filteredAnnouncements.length,
        totalPages: Math.ceil(filteredAnnouncements.length / 20)
      });
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

  const handleCreateAnnouncement = () => {
    setSelectedAnnouncement(null);
    createModal.onOpen();
  };

  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    detailModal.onOpen();
  };

  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    createModal.onOpen();
  };

  const handleSendAnnouncement = async (announcement) => {
    try {
      // Mock send
      const updatedAnn = {
        ...announcement,
        status: 'SENT',
        sentAt: new Date().toISOString(),
        readCount: 0
      };

      setAnnouncements(prevAnns =>
        prevAnns.map(ann =>
          ann.id === announcement.id ? updatedAnn : ann
        )
      );

      toast({
        title: 'Başarılı',
        description: `"${announcement.title}" duyurusu gönderildi`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message || 'Duyuru gönderilemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteAnnouncement = async (announcement) => {
    try {
      // Mock delete
      setAnnouncements(prevAnns =>
        prevAnns.filter(ann => ann.id !== announcement.id)
      );

      toast({
        title: 'Başarılı',
        description: `"${announcement.title}" duyurusu silindi`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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

  const handleAnnouncementUpdate = (updatedAnnouncement) => {
    if (updatedAnnouncement.id) {
      // Update existing
      setAnnouncements(prevAnns =>
        prevAnns.map(ann =>
          ann.id === updatedAnnouncement.id ? { ...ann, ...updatedAnnouncement } : ann
        )
      );
    } else {
      // Add new
      const newAnnouncement = {
        ...updatedAnnouncement,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        recipientCount: 0,
        readCount: 0
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusCounts = () => {
    const draft = announcements.filter(a => a.status === 'DRAFT').length;
    const scheduled = announcements.filter(a => a.status === 'SCHEDULED').length;
    const sent = announcements.filter(a => a.status === 'SENT').length;
    return { draft, scheduled, sent };
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const statusCounts = getStatusCounts();

  return (
    <AdminLayout>
      <VStack align="start" spacing={6}>
        <HStack justify="space-between" w="full">
          <Heading size="lg" color="brand.600">
            Duyuru Yönetimi
          </Heading>
          <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={handleCreateAnnouncement}>
            Yeni Duyuru
          </Button>
        </HStack>

        {/* Status Summary */}
        <HStack spacing={4}>
          <Badge colorScheme="gray" px={3} py={1}>
            {statusCounts.draft} Taslak
          </Badge>
          <Badge colorScheme="yellow" px={3} py={1}>
            {statusCounts.scheduled} Zamanlandı
          </Badge>
          <Badge colorScheme="green" px={3} py={1}>
            {statusCounts.sent} Gönderildi
          </Badge>
        </HStack>

        {/* Filters */}
        <HStack spacing={4} w="full">
          <Select
            placeholder="Tüm Durumlar"
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            w="200px"
          >
            <option value="DRAFT">Taslak</option>
            <option value="SCHEDULED">Zamanlandı</option>
            <option value="SENT">Gönderildi</option>
            <option value="CANCELLED">İptal Edildi</option>
          </Select>
        </HStack>

        {/* Announcements Table */}
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
                  <Th>Duyuru</Th>
                  <Th>Tip</Th>
                  <Th>Durum</Th>
                  <Th>Alıcı Sayısı</Th>
                  <Th>Okunma</Th>
                  <Th>Tarih</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {announcements.map((announcement) => (
                  <Tr key={announcement.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" noOfLines={1}>
                          {announcement.title}
                        </Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {announcement.content}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <AnnouncementTypeBadge type={announcement.type} />
                    </Td>
                    <Td>
                      <AnnouncementStatusBadge status={announcement.status} />
                    </Td>
                    <Td>{announcement.recipientCount}</Td>
                    <Td>
                      {announcement.status === 'SENT' ? (
                        <Text fontSize="sm">
                          {announcement.readCount} / {announcement.recipientCount}
                        </Text>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>
                      {announcement.status === 'SENT'
                        ? formatDate(announcement.sentAt)
                        : announcement.status === 'SCHEDULED'
                        ? formatDate(announcement.scheduledAt)
                        : formatDate(announcement.createdAt)
                      }
                    </Td>
                    <Td>
                      <AnnouncementActionsMenu
                        announcement={announcement}
                        onView={handleViewAnnouncement}
                        onEdit={handleEditAnnouncement}
                        onSend={handleSendAnnouncement}
                        onDelete={handleDeleteAnnouncement}
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
              onClick={() => fetchAnnouncements(pagination.page - 1, statusFilter)}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <Text fontSize="sm">
              Sayfa {pagination.page} / {pagination.totalPages}
            </Text>
            <Button
              size="sm"
              onClick={() => fetchAnnouncements(pagination.page + 1, statusFilter)}
              disabled={pagination.page === pagination.totalPages}
            >
              Sonraki
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Modals */}
      <AnnouncementCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        announcement={selectedAnnouncement}
        onUpdate={handleAnnouncementUpdate}
      />

      {selectedAnnouncement && (
        <AnnouncementDetailModal
          isOpen={detailModal.isOpen}
          onClose={detailModal.onClose}
          announcement={selectedAnnouncement}
        />
      )}
    </AdminLayout>
  );
};

export default AdminAnnouncementsPage;
