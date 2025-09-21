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
  Avatar,
  Text,
  Flex,
  useToast,
  useDisclosure,
  Checkbox
} from '@chakra-ui/react';
import { FiMoreVertical, FiEye, FiCheck, FiX, FiCheckSquare } from 'react-icons/fi';
import AdminLayout from '../components/admin/AdminLayout';
import StoryReviewModal from '../components/admin/modals/StoryReviewModal';
import BulkStoryActionsModal from '../components/admin/modals/BulkStoryActionsModal';

const StoryStatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: { colorScheme: 'yellow', label: 'Bekliyor' },
    APPROVED: { colorScheme: 'green', label: 'Onaylandı' },
    REJECTED: { colorScheme: 'red', label: 'Reddedildi' }
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
};

const StoryActionsMenu = ({ story, onReview, onApprove, onReject }) => {
  const isPending = story.status === 'PENDING';

  return (
    <Menu>
      <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
      <MenuList>
        <MenuItem icon={<FiEye />} onClick={() => onReview(story)}>
          İncele
        </MenuItem>
        {isPending && (
          <>
            <MenuItem icon={<FiCheck />} onClick={() => onApprove(story)} color="green.500">
              Onayla
            </MenuItem>
            <MenuItem icon={<FiX />} onClick={() => onReject(story)} color="red.500">
              Reddet
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
};

const AdminStoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStories, setSelectedStories] = useState(new Set());
  const [selectedStory, setSelectedStory] = useState(null);

  const toast = useToast();
  const reviewModal = useDisclosure();
  const bulkActionsModal = useDisclosure();

  const fetchStories = async (page = 1, status = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/stories', {
        params: {
          page,
          limit: 20,
          status: status || undefined
        }
      });

      if (response.data.success) {
        setStories(response.data.stories);
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        });
      } else {
        throw new Error(response.data.error?.message || 'Hikayeler yüklenemedi');
      }
    } catch (error) {
      console.error('Fetch stories error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (statusValue) => {
    setStatusFilter(statusValue);
    fetchStories(1, statusValue);
  };

  const handleStoryReview = (story) => {
    setSelectedStory(story);
    reviewModal.onOpen();
  };

  const handleQuickApprove = async (story) => {
    try {
      // Mock approval - in real implementation would call API
      toast({
        title: 'Başarılı',
        description: `"${story.title}" hikayesi onaylandı`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update local state
      setStories(prevStories =>
        prevStories.map(s =>
          s.id === story.id ? { ...s, status: 'APPROVED' } : s
        )
      );
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message || 'Hikaye onaylanamadı',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleQuickReject = async (story) => {
    try {
      // Mock rejection - in real implementation would call API
      toast({
        title: 'Başarılı',
        description: `"${story.title}" hikayesi reddedildi`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update local state
      setStories(prevStories =>
        prevStories.map(s =>
          s.id === story.id ? { ...s, status: 'REJECTED' } : s
        )
      );
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message || 'Hikaye reddedilemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSelectStory = (storyId, isSelected) => {
    const newSelected = new Set(selectedStories);
    if (isSelected) {
      newSelected.add(storyId);
    } else {
      newSelected.delete(storyId);
    }
    setSelectedStories(newSelected);
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedStories(new Set(stories.map(s => s.id)));
    } else {
      setSelectedStories(new Set());
    }
  };

  const handleBulkActions = () => {
    bulkActionsModal.onOpen();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusCounts = () => {
    const pending = stories.filter(s => s.status === 'PENDING').length;
    const approved = stories.filter(s => s.status === 'APPROVED').length;
    const rejected = stories.filter(s => s.status === 'REJECTED').length;
    return { pending, approved, rejected };
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const statusCounts = getStatusCounts();

  return (
    <AdminLayout>
      <VStack align="start" spacing={6}>
        <Heading size="lg" color="brand.600">
          Hikaye Moderasyonu
        </Heading>

        {/* Status Summary */}
        <HStack spacing={4}>
          <Badge colorScheme="yellow" px={3} py={1}>
            {statusCounts.pending} Bekliyor
          </Badge>
          <Badge colorScheme="green" px={3} py={1}>
            {statusCounts.approved} Onaylandı
          </Badge>
          <Badge colorScheme="red" px={3} py={1}>
            {statusCounts.rejected} Reddedildi
          </Badge>
        </HStack>

        {/* Filters and Actions */}
        <HStack spacing={4} w="full" justify="space-between">
          <HStack spacing={4}>
            <Select
              placeholder="Tüm Durumlar"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              w="200px"
            >
              <option value="PENDING">Bekleyen</option>
              <option value="APPROVED">Onaylanan</option>
              <option value="REJECTED">Reddedilen</option>
            </Select>
          </HStack>

          {selectedStories.size > 0 && (
            <Button
              leftIcon={<FiCheckSquare />}
              colorScheme="brand"
              onClick={handleBulkActions}
            >
              Toplu İşlem ({selectedStories.size})
            </Button>
          )}
        </HStack>

        {/* Stories Table */}
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
                  <Th>
                    <Checkbox
                      isChecked={selectedStories.size === stories.length && stories.length > 0}
                      isIndeterminate={selectedStories.size > 0 && selectedStories.size < stories.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </Th>
                  <Th>Hikaye</Th>
                  <Th>Yazar</Th>
                  <Th>Durum</Th>
                  <Th>Görüntüleme</Th>
                  <Th>Tarih</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stories.map((story) => (
                  <Tr key={story.id}>
                    <Td>
                      <Checkbox
                        isChecked={selectedStories.has(story.id)}
                        onChange={(e) => handleSelectStory(story.id, e.target.checked)}
                      />
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" noOfLines={1}>
                          {story.title}
                        </Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {story.content}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack>
                        <Avatar size="sm" name={story.authorNickname} src={story.authorAvatar} />
                        <Text>{story.authorNickname}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <StoryStatusBadge status={story.status} />
                    </Td>
                    <Td>{story.viewCount}</Td>
                    <Td>{formatDate(story.createdAt)}</Td>
                    <Td>
                      <StoryActionsMenu
                        story={story}
                        onReview={handleStoryReview}
                        onApprove={handleQuickApprove}
                        onReject={handleQuickReject}
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
              onClick={() => fetchStories(pagination.page - 1, statusFilter)}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <Text fontSize="sm">
              Sayfa {pagination.page} / {pagination.totalPages}
            </Text>
            <Button
              size="sm"
              onClick={() => fetchStories(pagination.page + 1, statusFilter)}
              disabled={pagination.page === pagination.totalPages}
            >
              Sonraki
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Modals */}
      {selectedStory && (
        <StoryReviewModal
          isOpen={reviewModal.isOpen}
          onClose={reviewModal.onClose}
          story={selectedStory}
          onUpdate={(updatedStory) => {
            setStories(prevStories =>
              prevStories.map(s =>
                s.id === updatedStory.id ? { ...s, ...updatedStory } : s
              )
            );
          }}
        />
      )}

      <BulkStoryActionsModal
        isOpen={bulkActionsModal.isOpen}
        onClose={bulkActionsModal.onClose}
        selectedStoryIds={Array.from(selectedStories)}
        stories={stories}
        onUpdate={(updatedStories) => {
          setStories(prevStories =>
            prevStories.map(story => {
              const updated = updatedStories.find(u => u.id === story.id);
              return updated ? { ...story, ...updated } : story;
            })
          );
          setSelectedStories(new Set());
        }}
      />
    </AdminLayout>
  );
};

export default AdminStoriesPage;
