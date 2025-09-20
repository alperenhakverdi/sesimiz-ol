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
  FiMegaphone
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

const LinkItems = [
  { name: 'Dashboard', icon: FiHome, href: '/admin/dashboard' },
  { name: 'Kullanıcılar', icon: FiUsers, href: '/admin/users' },
  { name: 'Hikayeler', icon: FiFileText, href: '/admin/stories' },
  { name: 'STK\'lar', icon: FiHeart, href: '/admin/organizations' },
  { name: 'Feature Flags', icon: FiFlag, href: '/admin/feature-flags' },
  { name: 'Duyurular', icon: FiMegaphone, href: '/admin/announcements' },
  { name: 'Ayarlar', icon: FiSettings, href: '/admin/settings' }
]

const AdminSidebar = ({ onClose, ...rest }) => {
  const { user } = useAuth()
  const location = useLocation()

  const sidebarBg = useColorModeValue('white', 'gray.900')
  const sidebarBorderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box
      transition="3s ease"
      bg={sidebarBg}
      borderRight="1px"
      borderRightColor={sidebarBorderColor}
      w={{ base: 'full', lg: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <HStack spacing={3}>
          <Avatar size="sm" name="Admin" bg="brand.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="bold">
              Admin Panel
            </Text>
            <Badge size="sm" colorScheme="brand">
              {user?.nickname}
            </Badge>
          </VStack>
        </HStack>
        <CloseButton display={{ base: 'flex', lg: 'none' }} onClick={onClose} />
      </Flex>

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
  const inactiveColor = useColorModeValue('gray.600', 'gray.300')

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
          bg: 'brand.50',
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
