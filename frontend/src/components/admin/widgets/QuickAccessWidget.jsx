import React from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  Button,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react';
import { FiUsers, FiFileText, FiFlag, FiHeart, FiArrowRight } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

const QuickAccessCard = ({ title, description, icon, href, stats, color = 'brand.500' }) => {
  const bgColor = useColorModeValue('white', 'neutral.800');
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');
  const hoverBg = useColorModeValue('neutral.100', 'neutral.700');

  return (
    <Box
      as={RouterLink}
      to={href}
      p={6}
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      shadow="sm"
      transition="all 0.2s"
      _hover={{
        bg: hoverBg,
        shadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: color
      }}
      cursor="pointer"
    >
      <VStack align="start" spacing={4}>
        <HStack justify="space-between" w="full">
          <Icon
            as={icon}
            w={8}
            h={8}
            color={color}
            bg={`${color.split('.')[0]}.50`}
            p={2}
            borderRadius="md"
          />
          <Icon as={FiArrowRight} w={4} h={4} color={useColorModeValue('neutral.500', 'neutral.400')} />
        </HStack>

        <VStack align="start" spacing={2} flex="1">
          <Text fontWeight="bold" fontSize="lg" color={useColorModeValue(color, 'accent.300')}>
            {title}
          </Text>
          <Text fontSize="sm" color={useColorModeValue('neutral.600', 'neutral.300')} lineHeight="short">
            {description}
          </Text>
        </VStack>

        {stats && (
          <Box w="full">
            <Stat>
              <StatLabel fontSize="xs" color={useColorModeValue('neutral.600', 'neutral.400')}>
                {stats.label}
              </StatLabel>
              <StatNumber fontSize="xl" color={color}>
                {stats.value?.toLocaleString() || 0}
              </StatNumber>
            </Stat>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

const QuickAccessWidget = () => {
  const bgColor = useColorModeValue('white', 'neutral.800');
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');

  const quickAccessItems = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcıları görüntüle, düzenle ve yönet',
      icon: FiUsers,
      href: '/admin/users',
      color: 'blue.500',
      stats: {
        label: 'Toplam Kullanıcı',
        value: '-' // Will be populated from metrics if needed
      }
    },
    {
      title: 'Hikaye Moderasyonu',
      description: 'Hikayeleri incele, onayla veya reddet',
      icon: FiFileText,
      href: '/admin/stories',
      color: 'purple.500',
      stats: {
        label: 'Bekleyen Hikaye',
        value: '-'
      }
    },
    {
      title: 'Feature Flags',
      description: 'Özellik bayraklarını yönet ve kontrol et',
      icon: FiFlag,
      href: '/admin/feature-flags',
      color: 'orange.500',
      stats: {
        label: 'Aktif Flag',
        value: '-'
      }
    },
    {
      title: 'STK Yönetimi',
      description: 'Sivil toplum kuruluşlarını yönet',
      icon: FiHeart,
      href: '/admin/organizations',
      color: 'pink.500',
      stats: {
        label: 'Kayıtlı STK',
        value: '-'
      }
    }
  ];

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <Heading size="md" mb={6}>Hızlı Erişim</Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {quickAccessItems.map((item) => (
          <QuickAccessCard
            key={item.href}
            title={item.title}
            description={item.description}
            icon={item.icon}
            href={item.href}
            color={item.color}
            stats={item.stats}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default QuickAccessWidget;