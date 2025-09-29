import {
  IconButton,
  Avatar,
  Box,
  Flex,
  HStack,
  VStack,
  useColorModeValue,
  Text,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from '@chakra-ui/react'
import { FiMenu, FiChevronDown, FiLogOut, FiUser, FiHome } from 'react-icons/fi'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean)

  const breadcrumbMap = {
    admin: 'Admin',
    dashboard: 'Dashboard',
    users: 'Kullanıcılar',
    stories: 'Hikayeler',
    organizations: 'STK\'lar',
    'feature-flags': 'Feature Flags',
    settings: 'Ayarlar'
  }

  return paths.map((path, index) => ({
    label: breadcrumbMap[path] || path,
    href: `/${paths.slice(0, index + 1).join('/')}`
  }))
}

const AdminHeader = ({ onOpen, ...rest }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const breadcrumbs = getBreadcrumbs(location.pathname)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <Flex
      ml={{ base: 0, lg: 0 }}
      px={{ base: 4, lg: 6 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'neutral.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('neutral.200', 'neutral.700')}
      justifyContent={{ base: 'space-between', lg: 'space-between' }}
      position="sticky"
      top={0}
      zIndex={1}
      {...rest}
    >
      {/* Mobile menu button */}
      <IconButton
        display={{ base: 'flex', lg: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      {/* Breadcrumb */}
      <Box flex="1" display={{ base: 'none', lg: 'block' }}>
        <Breadcrumb spacing="8px" separator="/">
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/">
              <HStack spacing={2}>
                <FiHome />
                <Text color={useColorModeValue('neutral.700','neutral.300')}>Ana Sayfa</Text>
              </HStack>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
              <BreadcrumbLink
                as={RouterLink}
                to={crumb.href}
                color={index === breadcrumbs.length - 1 ? 'brand.600' : useColorModeValue('neutral.700','neutral.300')}
                fontWeight={index === breadcrumbs.length - 1 ? 'semibold' : 'normal'}
              >
                {crumb.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      </Box>

      {/* User menu */}
      <HStack spacing={{ base: '2', lg: '6' }}>
        <Flex alignItems="center">
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: 'none' }}
            >
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  name={user?.nickname}
                  src={user?.avatar}
                  bg="brand.500"
                />
                <VStack
                  display={{ base: 'none', lg: 'flex' }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="sm" fontWeight="semibold">
                    {user?.nickname}
                  </Text>
                  <Text fontSize="xs" color={useColorModeValue('neutral.700','neutral.300')}>
                    Admin
                  </Text>
                </VStack>
                <Box display={{ base: 'none', lg: 'flex' }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'neutral.900')}
              borderColor={useColorModeValue('neutral.200', 'neutral.700')}
            >
              <MenuItem icon={<FiUser />} as={RouterLink} to="/ayarlar">
                Profil Ayarları
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Çıkış Yap
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  )
}

export default AdminHeader