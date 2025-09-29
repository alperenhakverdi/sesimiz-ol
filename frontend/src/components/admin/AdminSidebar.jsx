import {
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiSettings,
  FiFlag,
  FiHeart,
  FiBell
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

const LinkItems = [
  { name: 'Dashboard', icon: FiHome, href: '/admin/dashboard' },
  { name: 'Kullanıcılar', icon: FiUsers, href: '/admin/users' },
  { name: 'Hikayeler', icon: FiFileText, href: '/admin/stories' },
  { name: 'STK\'lar', icon: FiHeart, href: '/admin/organizations' },
  { name: 'Feature Flags', icon: FiFlag, href: '/admin/feature-flags' },
  { name: 'Duyurular', icon: FiBell, href: '/admin/announcements' },
  { name: 'Ayarlar', icon: FiSettings, href: '/admin/settings' }
]

const AdminSidebar = ({ onClose, ...rest }) => {
  const { user } = useAuth()
  const location = useLocation()

  const sidebarBg = useColorModeValue('white', 'neutral.900')
  const sidebarBorderColor = useColorModeValue('neutral.200', 'neutral.700')

  return (
    <Box
      transition="0.3s ease"
      bg={sidebarBg}
      borderRight="1px"
      borderRightColor={sidebarBorderColor}
      w={{ base: 'full', lg: 60 }}
      pos="fixed"
      h="100vh"
      overflowY="auto"
      zIndex={2}
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="6" justifyContent="space-between">
        <HStack spacing={3} as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          <Text fontSize="xl" fontWeight="bold" color="brand.500">
            Sesimiz Ol
          </Text>
        </HStack>
        <CloseButton display={{ base: 'flex', lg: 'none' }} onClick={onClose} />
      </Flex>

      {/* Admin User Info */}
      <Box mx="6" mb="6" p="4" bg={useColorModeValue('neutral.100', 'neutral.800')} borderRadius="lg">
        <HStack spacing={3}>
          <Avatar size="sm" name={user?.nickname} src={user?.avatar} bg="brand.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="semibold">
              {user?.nickname}
            </Text>
            <Badge size="sm" colorScheme="brand" variant="subtle">
              Admin
            </Badge>
          </VStack>
        </HStack>
      </Box>

      <VStack align="stretch" spacing={1} px={4}>
        {LinkItems.map((link) => (
          <NavItem
            key={link.name}
            icon={link.icon}
            href={link.href}
            isActive={location.pathname === link.href}
            onClick={onClose}
          >
            {link.name}
          </NavItem>
        ))}
      </VStack>
    </Box>
  )
}

const NavItem = ({ icon, children, href, isActive, onClick, ...rest }) => {
  const inactiveColor = useColorModeValue('neutral.700', 'neutral.300')

  return (
    <Box
      as={RouterLink}
      to={href}
      onClick={onClick}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="3"
        mx="2"
        borderRadius="md"
        role="group"
        cursor="pointer"
        bg={isActive ? 'brand.50' : 'transparent'}
        color={isActive ? 'brand.600' : inactiveColor}
        borderLeft={isActive ? '3px solid' : '3px solid transparent'}
        borderLeftColor={isActive ? 'brand.500' : 'transparent'}
        _hover={{
          bg: useColorModeValue('brand.50','neutral.800'),
          color: 'brand.600'
        }}
        transition="all 0.2s"
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            as={icon}
          />
        )}
        <Text fontWeight={isActive ? 'semibold' : 'medium'}>
          {children}
        </Text>
      </Flex>
    </Box>
  )
}

export default AdminSidebar