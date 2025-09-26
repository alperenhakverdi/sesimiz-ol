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
import { FiUsers, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import api from '../../../services/api';

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

const UserStatsWidget = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/admin/metrics');

        if (response.success) {
          setStats(response.data.users);
        } else {
          throw new Error(response.error?.message || 'Veri yüklenemedi');
        }
      } catch (error) {
        setError(error.message || 'Kullanıcı istatistikleri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
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
        title="Toplam Kullanıcı"
        value={stats?.total}
        icon={FiUsers}
        color="brand.500"
      />
      <StatCard
        title="Bugün Katılan"
        value={stats?.today}
        icon={FiUserPlus}
        color="green.500"
      />
      <StatCard
        title="Aktif Kullanıcı"
        value={stats?.active}
        icon={FiUserCheck}
        color="blue.500"
      />
    </SimpleGrid>
  );
};

export default UserStatsWidget;
