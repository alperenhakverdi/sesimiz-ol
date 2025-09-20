import { useState } from 'react'
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

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
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

      {/* Main Content */}
      <Box ml={{ base: 0, lg: 60 }} transition="margin-left 0.3s ease">
        {/* Header */}
        <AdminHeader onOpen={onOpen} />

        {/* Page Content */}
        <Box as="main" p={6}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default AdminLayout