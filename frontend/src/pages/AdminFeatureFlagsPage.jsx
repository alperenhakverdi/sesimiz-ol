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
  Switch,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Flex,
  useToast,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea
} from '@chakra-ui/react';
import { FiPlus, FiEdit } from 'react-icons/fi';
import AdminLayout from '../components/admin/AdminLayout';
import FeatureFlagEditModal from '../components/admin/modals/FeatureFlagEditModal';

const FeatureFlagPage = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFlag, setSelectedFlag] = useState(null);

  const toast = useToast();
  const editModal = useDisclosure();

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/feature-flags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Feature flag\'ları yüklenemedi');
      }

      const data = await response.json();

      if (data.success) {
        // Combine database flags with defaults
        const dbFlags = data.data.flags || [];
        const defaults = data.data.defaults || {};

        // Create a unified flag list
        const flagList = Object.keys(defaults).map(key => {
          const dbFlag = dbFlags.find(f => f.key === key);
          return {
            key,
            enabled: dbFlag ? dbFlag.enabled : defaults[key].enabled,
            description: dbFlag ? dbFlag.description : defaults[key].description,
            rolloutStatus: dbFlag ? dbFlag.rolloutStatus : null,
            isDefault: !dbFlag
          };
        });

        setFlags(flagList);
      } else {
        throw new Error(data.error?.message || 'Veri yüklenemedi');
      }
    } catch (err) {
      console.error('Feature flags error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (key, enabled) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) {
        throw new Error('Feature flag güncellenemedi');
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setFlags(prevFlags =>
          prevFlags.map(flag =>
            flag.key === key ? { ...flag, enabled, isDefault: false } : flag
          )
        );

        toast({
          title: 'Başarılı',
          description: `${key} feature flag'ı ${enabled ? 'aktif' : 'pasif'} edildi`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error?.message || 'Güncelleme başarısız');
      }
    } catch (err) {
      console.error('Toggle feature flag error:', err);
      toast({
        title: 'Hata',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditFlag = (flag) => {
    setSelectedFlag(flag);
    editModal.onOpen();
  };

  const handleFlagUpdate = (updatedFlag) => {
    setFlags(prevFlags =>
      prevFlags.map(flag =>
        flag.key === updatedFlag.key ? { ...flag, ...updatedFlag, isDefault: false } : flag
      )
    );
  };

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const activeFlags = flags.filter(flag => flag.enabled);
  const inactiveFlags = flags.filter(flag => !flag.enabled);

  return (
    <AdminLayout>
      <VStack align="start" spacing={6}>
        <HStack justify="space-between" w="full">
          <Heading size="lg" color="brand.600">
            Feature Flag Yönetimi
          </Heading>
          <Button leftIcon={<FiPlus />} colorScheme="brand" isDisabled>
            Yeni Flag (Yakında)
          </Button>
        </HStack>

        {/* Status Summary */}
        <HStack spacing={4}>
          <Badge colorScheme="green" px={3} py={1}>
            {activeFlags.length} Aktif
          </Badge>
          <Badge colorScheme="red" px={3} py={1}>
            {inactiveFlags.length} Pasif
          </Badge>
        </HStack>

        {/* Feature Flags Table */}
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
                  <Th>Flag Adı</Th>
                  <Th>Açıklama</Th>
                  <Th>Durum</Th>
                  <Th>Kaynak</Th>
                  <Th>Rollout Durumu</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {flags.map((flag) => (
                  <Tr key={flag.key}>
                    <Td>
                      <Text fontFamily="mono" fontWeight="medium">
                        {flag.key}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" noOfLines={2}>
                        {flag.description}
                      </Text>
                    </Td>
                    <Td>
                      <HStack>
                        <Switch
                          isChecked={flag.enabled}
                          onChange={(e) => handleToggleFlag(flag.key, e.target.checked)}
                          colorScheme="brand"
                          size="md"
                        />
                        <Badge colorScheme={flag.enabled ? 'green' : 'red'}>
                          {flag.enabled ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge variant={flag.isDefault ? 'outline' : 'solid'}>
                        {flag.isDefault ? 'Varsayılan' : 'Özelleştirilmiş'}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.600">
                        {flag.rolloutStatus || '-'}
                      </Text>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        leftIcon={<FiEdit />}
                        onClick={() => handleEditFlag(flag)}
                      >
                        Düzenle
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Info Alert */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">
              Feature Flag Bilgileri:
            </Text>
            <Text fontSize="sm">
              • Feature flag'lar sistem özelliklerini açıp kapatmanıza olanak sağlar
              <br />• Değişiklikler anında etkili olur
              <br />• Varsayılan flag'lar kod ile tanımlanmış, özelleştirilmiş olanlar veritabanında saklanır
            </Text>
          </VStack>
        </Alert>
      </VStack>

      {/* Modals */}
      {selectedFlag && (
        <FeatureFlagEditModal
          isOpen={editModal.isOpen}
          onClose={editModal.onClose}
          flag={selectedFlag}
          onUpdate={handleFlagUpdate}
        />
      )}
    </AdminLayout>
  );
};

export default FeatureFlagPage;