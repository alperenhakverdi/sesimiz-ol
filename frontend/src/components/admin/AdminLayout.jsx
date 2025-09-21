import {
  Box,
  Drawer,
  DrawerContent,
  useDisclosure,
  useColorModeValue,
  Flex
} from '@chakra-ui/react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import AdminMobileNav from './AdminMobileNav'

const AdminLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bgColor = useColorModeValue('gray.50', 'gray.900')

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