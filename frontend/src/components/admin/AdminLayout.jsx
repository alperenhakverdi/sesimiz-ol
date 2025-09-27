import {
  Box,
  Drawer,
  DrawerContent,
  useDisclosure,
  useColorModeValue,
  Flex,
  Center,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  VStack,
  Text
} from '@chakra-ui/react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import AdminMobileNav from './AdminMobileNav'

const AdminLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center minH="100vh" bg={bgColor}>
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Yetkilendirme kontrol ediliyor...</Text>
        </VStack>
      </Center>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/giris" replace />
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Center minH="100vh" bg={bgColor}>
        <VStack spacing={6} maxW="md" textAlign="center">
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </Alert>
          <Button as="a" href="/" colorScheme="brand">
            Ana Sayfaya Dön
          </Button>
        </VStack>
      </Center>
    )
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Desktop Sidebar */}
      <AdminSidebar
        onClose={() => onClose}
        display={{ base: 'none', lg: 'block' }}
      />

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <AdminSidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main Content Area */}
      <Flex direction="column" ml={{ base: 0, lg: 60 }} minH="100vh">
        {/* Header */}
        <AdminHeader onOpen={onOpen} />

        {/* Page Content */}
        <Box as="main" flex="1" p={{ base: 4, md: 6, lg: 8 }}>
          {children}
        </Box>
      </Flex>
    </Box>
  )
}

export default AdminLayout