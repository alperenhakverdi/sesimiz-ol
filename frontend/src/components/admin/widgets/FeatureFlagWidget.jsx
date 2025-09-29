import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Switch,
  Text,
  Badge,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Flex,
  Divider
} from '@chakra-ui/react';
import api from '../../../services/api';

const FeatureFlagItem = ({ flag, onToggle }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const bgColor = useColorModeValue('white', 'neutral.800');
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggle(flag.key, !flag.enabled);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="md"
      border="1px"
      borderColor={borderColor}
    >
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={1} flex="1">
          <HStack>
            <Text fontWeight="semibold" fontSize="sm">
              {flag.key}
            </Text>
            <Badge
              colorScheme={flag.enabled ? 'green' : 'red'}
              size="sm"
            >
              {flag.enabled ? 'Aktif' : 'Pasif'}
            </Badge>
          </HStack>
          {flag.description && (
            <Text fontSize="xs" color={useColorModeValue('neutral.600','neutral.300')} noOfLines={2}>
              {flag.description}
            </Text>
          )}
        </VStack>
        <Switch
          isChecked={flag.enabled}
          onChange={handleToggle}
          isDisabled={isUpdating}
          colorScheme="brand"
          size="sm"
        />
      </Flex>
    </Box>
  );
};

const FeatureFlagWidget = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'neutral.800');
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');

  const fetchFeatureFlags = async () => {
    try {
      setError(null);

      const response = await api.get('/admin/feature-flags');

      if (response.success) {
        // Combine database flags with defaults
        const dbFlags = response.data.flags || [];
        const defaults = response.data.defaults || {};

        // Create a unified flag list
        const flagList = Object.keys(defaults).map(key => {
          const dbFlag = dbFlags.find(f => f.key === key);
          return {
            key,
            enabled: dbFlag ? dbFlag.enabled : defaults[key].enabled,
            description: dbFlag ? dbFlag.description : defaults[key].description,
            rolloutStatus: dbFlag ? dbFlag.rolloutStatus : null
          };
        });

        setFlags(flagList);
      } else {
        throw new Error(response.error?.message || 'Veri yüklenemedi');
      }
    } catch (error) {
      setError(error.message || 'Feature flag\'ları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (key, enabled) => {
    try {
      const response = await api.patch(`/admin/feature-flags/${key}`, { enabled });

      if (response.success) {
        // Update local state
        setFlags(prevFlags =>
          prevFlags.map(flag =>
            flag.key === key ? { ...flag, enabled } : flag
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
        throw new Error(response.error?.message || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Toggle feature flag error:', error);
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  if (loading) {
    return (
      <Box
        p={6}
        bg={bgColor}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        shadow="sm"
      >
        <Heading size="md" mb={4}>Feature Flag Durumları</Heading>
        <Flex justify="center" py={8}>
          <Spinner size="lg" color="brand.500" />
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        p={6}
        bg={bgColor}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        shadow="sm"
      >
        <Heading size="md" mb={4}>Feature Flag Durumları</Heading>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  const activeFlags = flags.filter(flag => flag.enabled);
  const inactiveFlags = flags.filter(flag => !flag.enabled);

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <Heading size="md" mb={4}>Feature Flag Durumları</Heading>

      <HStack spacing={4} mb={4}>
        <Badge colorScheme="green" px={2} py={1}>
          {activeFlags.length} Aktif
        </Badge>
        <Badge colorScheme="red" px={2} py={1}>
          {inactiveFlags.length} Pasif
        </Badge>
      </HStack>

      <VStack spacing={3} maxH="400px" overflowY="auto">
        {flags.map((flag) => (
          <FeatureFlagItem
            key={flag.key}
            flag={flag}
            onToggle={handleToggleFlag}
          />
        ))}
      </VStack>

      {flags.length === 0 && (
        <Text color={useColorModeValue('neutral.600','neutral.400')} textAlign="center" py={4}>
          Henüz feature flag tanımlanmamış
        </Text>
      )}
    </Box>
  );
};

export default FeatureFlagWidget;