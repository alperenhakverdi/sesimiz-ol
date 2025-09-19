import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Button,
  Link,
  useBreakpointValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { AddIcon, HamburgerIcon } from '@chakra-ui/icons'
import { useAuth } from '../../contexts/AuthContext'
import { useDisclosure as useLoginDisclosure } from '@chakra-ui/react'
import AuthButton from '../auth/AuthButton'
import LoginModal from '../auth/LoginModal'
import AnimatedButton from '../animations/AnimatedButton'

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useLoginDisclosure()
  const { isAuthenticated, isAdmin } = useAuth()
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  const handleShareClick = () => {
    if (!isAuthenticated) {
      onLoginOpen()
    }
  }

  const NavLinks = () => (
    <>
      <Link as={RouterLink} to="/" color="neutral.800" _hover={{ color: 'accent.600', textDecoration: 'underline' }}>
        Ana Sayfa
      </Link>
      <Link as={RouterLink} to="/hikayeler" color="neutral.800" _hover={{ color: 'accent.600', textDecoration: 'underline' }}>
        Hikâyeler
      </Link>
      <Link as={RouterLink} to="/hakkinda" color="neutral.800" _hover={{ color: 'accent.600', textDecoration: 'underline' }}>
        Hakkında
      </Link>
      {isAdmin && (
        <Link as={RouterLink} to="/admin/dashboard" color="neutral.800" _hover={{ color: 'accent.600', textDecoration: 'underline' }}>
          Admin Paneli
        </Link>
      )}
    </>
  )

  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" position="sticky" top="0" zIndex="sticky">
      <Container maxW="container.xl" px={4}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <Box>
            <Heading 
              as={RouterLink} 
              to="/" 
              size="lg" 
              color="accent.500"
              _hover={{ textDecoration: 'none', color: 'accent.600' }}
              fontWeight="bold"
            >
              Sesimiz Ol
            </Heading>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <HStack spacing={8} alignItems="center">
              <HStack as="nav" spacing={4}>
                <NavLinks />
              </HStack>
              
              <HStack spacing={4}>
                <AuthButton size="sm" />
                <AnimatedButton 
                  colorScheme="accent" 
                  leftIcon={<AddIcon />}
                  as={isAuthenticated ? RouterLink : 'button'}
                  to={isAuthenticated ? "/hikaye-olustur" : undefined}
                  onClick={!isAuthenticated ? handleShareClick : undefined}
                  size="sm"
                >
                  Hikâyeni Paylaş
                </AnimatedButton>
              </HStack>
            </HStack>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <HStack spacing={2}>
              <AuthButton size="sm" />
              <AnimatedButton 
                colorScheme="brand" 
                leftIcon={<AddIcon />}
                as={isAuthenticated ? RouterLink : 'button'}
                to={isAuthenticated ? "/hikaye-olustur" : undefined}
                onClick={!isAuthenticated ? handleShareClick : undefined}
                size="sm"
              >
                Paylaş
              </AnimatedButton>
              <IconButton
                size="sm"
                icon={<HamburgerIcon />}
                aria-label="Menü"
                onClick={onOpen}
              />
            </HStack>
          )}

          {/* Mobile Drawer */}
          <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader borderBottomWidth="1px">
                <Heading size="md" color="accent.500">
                  Sesimiz Ol
                </Heading>
              </DrawerHeader>
              <DrawerBody>
                <VStack spacing={6} align="stretch" pt={4}>
                  <VStack spacing={4} align="stretch">
                    <Link 
                      as={RouterLink} 
                      to="/" 
                      fontSize="lg"
                      fontWeight="medium"
                      color="neutral.800"
                      _hover={{ color: 'accent.600', textDecoration: 'underline' }}
                      onClick={onClose}
                    >
                      Ana Sayfa
                    </Link>
                    <Link 
                      as={RouterLink} 
                      to="/hikayeler" 
                      fontSize="lg"
                      fontWeight="medium"
                      color="neutral.800"
                      _hover={{ color: 'accent.600', textDecoration: 'underline' }}
                      onClick={onClose}
                    >
                      Hikâyeler
                    </Link>
                    <Link 
                      as={RouterLink} 
                      to="/hakkinda" 
                      fontSize="lg"
                      fontWeight="medium"
                      color="neutral.800"
                      _hover={{ color: 'accent.600', textDecoration: 'underline' }}
                      onClick={onClose}
                    >
                      Hakkında
                    </Link>
                    {isAdmin && (
                      <Link 
                        as={RouterLink} 
                        to="/admin/dashboard" 
                        fontSize="lg"
                        fontWeight="medium"
                        color="neutral.800"
                        _hover={{ color: 'accent.600', textDecoration: 'underline' }}
                        onClick={onClose}
                      >
                        Admin Paneli
                      </Link>
                    )}
                  </VStack>
                  
                  <Box pt={4} borderTopWidth="1px">
                    <Box mb={3}>
                      <AuthButton size="md" />
                    </Box>
                    <AnimatedButton 
                      colorScheme="accent" 
                      leftIcon={<AddIcon />}
                      as={isAuthenticated ? RouterLink : 'button'}
                      to={isAuthenticated ? "/hikaye-olustur" : undefined}
                      onClick={isAuthenticated ? onClose : () => { onClose(); handleShareClick(); }}
                      w="full"
                    >
                      Hikâyeni Paylaş
                    </AnimatedButton>
                  </Box>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
          
          <LoginModal isOpen={isLoginOpen} onClose={onLoginClose} />
        </Flex>
      </Container>
    </Box>
  )
}

export default Header
