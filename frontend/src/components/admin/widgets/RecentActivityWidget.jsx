import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Icon,
  Flex,
  Divider
} from '@chakra-ui/react';
import api from '../../../services/api';
import { FiUsers, FiFileText, FiClock } from 'react-icons/fi';

const ActivityIcon = ({ type }) => {
  const iconMap = {
    user_registered: FiUsers,
    story_created: FiFileText,
    default: FiClock
  };

  const colorMap = {
    user_registered: 'green.500',
    story_created: 'purple.500',
    default: 'neutral.500'
  };

  const IconComponent = iconMap[type] || iconMap.default;
  const color = colorMap[type] || colorMap.default;

  return (
    <Icon
      as={IconComponent}
      w={4}
      h={4}
      color={color}
      bg={`${color.split('.')[0]}.50`}
      p={1}
      borderRadius="sm"
    />
  );
};

const ActivityItem = ({ activity }) => {
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} dakika önce`;
    } else if (diffHours < 24) {
      return `${diffHours} saat önce`;
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  return (
    <Box py={3} borderBottom="1px" borderColor={borderColor} _last={{ borderBottom: 'none' }}>
      <HStack spacing={3} align="start">
        <ActivityIcon type={activity.type} />
        <Avatar
          size="sm"
          name={activity.user?.nickname}
          src={activity.user?.avatar}
          bg="brand.500"
        />
        <VStack align="start" spacing={1} flex="1">
          <Text fontSize="sm" fontWeight="medium" lineHeight="short">
            {activity.title}
          </Text>
          <Text fontSize="xs" color={useColorModeValue('neutral.600', 'neutral.300')} lineHeight="short">
            {activity.description}
          </Text>
          <Text fontSize="xs" color={useColorModeValue('neutral.600', 'neutral.400')}>
            {formatTime(activity.timestamp)}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

const RecentActivityWidget = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('white', 'neutral.800');
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/admin/metrics');

        if (response.success) {
          setActivities(response.data.recentActivity || []);
        } else {
          throw new Error(response.error?.message || 'Veri yüklenemedi');
        }
      } catch (error) {
        setError(error.message || 'Son aktiviteler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
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
        <Heading size="md" mb={4}>Son Aktiviteler</Heading>
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
        <Heading size="md" mb={4}>Son Aktiviteler</Heading>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <Heading size="md" mb={4}>Son Aktiviteler</Heading>

      {activities.length > 0 ? (
        <VStack spacing={0} maxH="400px" overflowY="auto">
          {activities.map((activity, index) => (
            <ActivityItem key={activity.id || `${activity.type}-${activity.user}-${index}`} activity={activity} />
          ))}
        </VStack>
      ) : (
        <Text color={useColorModeValue('neutral.600', 'neutral.400')} textAlign="center" py={8}>
          Henüz aktivite bulunmuyor
        </Text>
      )}
    </Box>
  );
};

export default RecentActivityWidget;