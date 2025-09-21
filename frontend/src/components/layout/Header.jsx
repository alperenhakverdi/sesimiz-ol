import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Button,
  Link,
  useBreakpointValue,
  useColorModeValue,
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
import { FiMessageCircle } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { useDisclosure as useLoginDisclosure } from '@chakra-ui/react'
import AuthButton from '../auth/AuthButton'
import LoginModal from '../auth/LoginModal'
import AnimatedButton from '../animations/AnimatedButton'
import NotificationBell from '../notifications/NotificationBell'
import ColorModeToggle from '../common/ColorModeToggle'

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useLoginDisclosure()
  const { isAuthenticated, isAdmin } = useAuth()
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Color mode values
  const bg = useColorModeValue('white', 'neutral.800')
  const borderColor = useColorModeValue('gray.200', 'neutral.700')
  const linkColor = useColorModeValue('neutral.800', 'neutral.200')
  const linkHoverColor = useColorModeValue('accent.600', 'accent.400')
  
  const handleShareClick = () => {
    if (!isAuthenticated) {
      onLoginOpen()
    }
  }

  const NavLinks = () => (
    <>
      <Link as={RouterLink} to="/" color={linkColor} _hover={{ color: linkHoverColor, textDecoration: 'underline' }}>
        Ana Sayfa
      </Link>
      <Link as={RouterLink} to="/hikayeler" color={linkColor} _hover={{ color: linkHoverColor, textDecoration: 'underline' }}>
        Hikâyeler
      </Link>
      <Link as={RouterLink} to="/hakkinda" color={linkColor} _hover={{ color: linkHoverColor, textDecoration: 'underline' }}>
        Hakkında
      </Link>
      {isAdmin && (
        <Link as={RouterLink} to="/admin/dashboard" color={linkColor} _hover={{ color: linkHoverColor, textDecoration: 'underline' }}>
          Admin Paneli
        </Link>
      )}
    </>
  )

  return (
    <Box bg={bg} borderBottom="1px" borderColor={borderColor} position="sticky" top="0" zIndex="sticky">
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
                {isAuthenticated && (
                  <IconButton
                    as={RouterLink}
                    to="/mesajlar"
                    icon={<FiMessageCircle />}
                    variant="ghost"
                    size="md"
                    aria-label="Mesajlar"
                    color={linkColor}
                    _hover={{ color: linkHoverColor, bg: useColorModeValue('gray.100', 'neutral.700') }}
                    _focus={{ boxShadow: 'outline' }}
                    minW="40px"
                    minH="40px"
                  />
                )}
                {isAuthenticated && <NotificationBell />}
                <ColorModeToggle size="sm" />
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
              {isAuthenticated && (
                <IconButton
                  as={RouterLink}
                  to="/mesajlar"
                  icon={<FiMessageCircle />}
                  variant="ghost"
                  size="lg"
                  aria-label="Mesajlar"
                  color={linkColor}
                  _hover={{ color: linkHoverColor, bg: useColorModeValue('gray.100', 'neutral.700') }}
                  _focus={{ boxShadow: 'outline' }}
                  _active={{ bg: useColorModeValue('gray.200', 'neutral.600') }}
                  minW="44px"
                  minH="44px"
                />
              )}
              {isAuthenticated && <NotificationBell />}
              <ColorModeToggle size="sm" />
              <AuthButton size="sm" />
              <AnimatedButton
                colorScheme="accent"
                leftIcon={<AddIcon />}
                as={isAuthenticated ? RouterLink : 'button'}
                to={isAuthenticated ? "/hikaye-olustur" : undefined}
                onClick={!isAuthenticated ? handleShareClick : undefined}
                size="sm"
              >
                Paylaş
              </AnimatedButton>
              <IconButton
                size="lg"
                icon={<HamburgerIcon />}
                aria-label="Menü"
                onClick={onOpen}
                variant="ghost"
                color={linkColor}
                _hover={{ color: linkHoverColor, bg: useColorModeValue('gray.100', 'neutral.700') }}
                _focus={{ boxShadow: 'outline' }}
                _active={{ bg: useColorModeValue('gray.200', 'neutral.600') }}
                borderRadius="md"
                minW="44px"
                minH="44px"
              />
            </HStack>
          )}

          {/* Mobile Drawer */}
          <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
            <DrawerOverlay bg={useColorModeValue('blackAlpha.600', 'blackAlpha.800')} />
            <DrawerContent bg={useColorModeValue('white', 'neutral.800')} maxW="320px">
              <DrawerCloseButton
                size="lg"
                color={linkColor}
                _hover={{ color: linkHoverColor, bg: useColorModeValue('gray.100', 'neutral.700') }}
                _focus={{ boxShadow: 'outline' }}
                top="16px"
                right="16px"
              />
              <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} py={6}>
                <Heading size="md" color="accent.500">
                  Sesimiz Ol
                </Heading>
              </DrawerHeader>
              <DrawerBody py={6}>
                <VStack spacing={6} align="stretch">
                  <VStack spacing={6} align="stretch">
                    <Link
                      as={RouterLink}
                      to="/"
                      fontSize="xl"
                      fontWeight="semibold"
                      color={linkColor}
                      _hover={{ color: linkHoverColor, textDecoration: 'none', bg: useColorModeValue('gray.50', 'neutral.700') }}
                      _focus={{ boxShadow: 'outline' }}
                      onClick={onClose}
                      p={3}
                      borderRadius="lg"
                      transition="all 0.2s"
                      minH="56px"
                      display="flex"
                      alignItems="center"
                    >
                      Ana Sayfa
                    </Link>
                    <Link
                      as={RouterLink}
                      to="/hikayeler"
                      fontSize="xl"
                      fontWeight="semibold"
                      color={linkColor}
                      _hover={{ color: linkHoverColor, textDecoration: 'none', bg: useColorModeValue('gray.50', 'neutral.700') }}
                      _focus={{ boxShadow: 'outline' }}
                      onClick={onClose}
                      p={3}
                      borderRadius="lg"
                      transition="all 0.2s"
                      minH="56px"
                      display="flex"
                      alignItems="center"
                    >
                      Hikâyeler
                    </Link>
                    <Link
                      as={RouterLink}
                      to="/hakkinda"
                      fontSize="xl"
                      fontWeight="semibold"
                      color={linkColor}
                      _hover={{ color: linkHoverColor, textDecoration: 'none', bg: useColorModeValue('gray.50', 'neutral.700') }}
                      _focus={{ boxShadow: 'outline' }}
                      onClick={onClose}
                      p={3}
                      borderRadius="lg"
                      transition="all 0.2s"
                      minH="56px"
                      display="flex"
                      alignItems="center"
                    >
                      Hakkında
                    </Link>
                    {isAuthenticated && (
                      <Link
                        as={RouterLink}
                        to="/mesajlar"
                        fontSize="xl"
                        fontWeight="semibold"
                        color={linkColor}
                        _hover={{ color: linkHoverColor, textDecoration: 'none', bg: useColorModeValue('gray.50', 'neutral.700') }}
                        _focus={{ boxShadow: 'outline' }}
                        onClick={onClose}
                        p={3}
                        borderRadius="lg"
                        transition="all 0.2s"
                        minH="56px"
                        display="flex"
                        alignItems="center"
                      >
                        Mesajlar
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        as={RouterLink}
                        to="/admin/dashboard"
                        fontSize="xl"
                        fontWeight="semibold"
                        color={linkColor}
                        _hover={{ color: linkHoverColor, textDecoration: 'none', bg: useColorModeValue('gray.50', 'neutral.700') }}
                        _focus={{ boxShadow: 'outline' }}
                        onClick={onClose}
                        p={3}
                        borderRadius="lg"
                        transition="all 0.2s"
                        minH="56px"
                        display="flex"
                        alignItems="center"
                      >
                        Admin Paneli
                      </Link>
                    )}
                  </VStack>

                  <Box pt={6} borderTopWidth="1px" borderColor={borderColor}>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <ColorModeToggle size="lg" />
                        <AuthButton size="md" />
                      </HStack>
                      <AnimatedButton
                        colorScheme="accent"
                        leftIcon={<AddIcon />}
                        as={isAuthenticated ? RouterLink : 'button'}
                        to={isAuthenticated ? "/hikaye-olustur" : undefined}
                        onClick={isAuthenticated ? onClose : () => { onClose(); handleShareClick(); }}
                        w="full"
                        size="lg"
                        minH="56px"
                        fontSize="lg"
                        fontWeight="semibold"
                      >
                        Hikâyeni Paylaş
                      </AnimatedButton>
                    </VStack>
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
