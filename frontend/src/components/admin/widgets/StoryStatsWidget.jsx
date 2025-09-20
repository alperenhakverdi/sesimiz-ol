import React, { useState, useEffect } from 'react';
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FiFileText, FiEdit, FiEye } from 'react-icons/fi';

const StatCard = ({ title, value, change, changeType, icon, color }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={bgColor}
      p={6}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <Stat>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <StatLabel fontSize="sm" fontWeight="medium" color="gray.600">
              {title}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={color}>
              {value?.toLocaleString() || 0}
            </StatNumber>
          </Box>
          <Icon
            as={icon}
            w={8}
            h={8}
            color={color}
            bg={`${color.split('.')[0]}.50`}
            p={2}
            borderRadius="md"
          />
        </Box>
        {change !== undefined && (
          <StatHelpText mb={0} mt={2}>
            <StatArrow type={changeType} />
            {Math.abs(change)}% son 30 gün
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
};

const StoryStatsWidget = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStoryStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/admin/metrics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Hikaye istatistikleri yüklenemedi');
        }

        const data = await response.json();

        if (data.success) {
          setStats(data.data.stories);
        } else {
          throw new Error(data.error?.message || 'Veri yüklenemedi');
        }
      } catch (err) {
        console.error('Story stats error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryStats();
  }, []);

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="lg" color="brand.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
      <StatCard
        title="Toplam Hikaye"
        value={stats?.total}
        icon={FiFileText}
        color="purple.500"
      />
      <StatCard
        title="Bugün Yazılan"
        value={stats?.today}
        icon={FiEdit}
        color="orange.500"
      />
      <StatCard
        title="Toplam Görüntüleme"
        value={stats?.totalViews}
        icon={FiEye}
        color="teal.500"
      />
    </SimpleGrid>
  );
};

export default StoryStatsWidget;