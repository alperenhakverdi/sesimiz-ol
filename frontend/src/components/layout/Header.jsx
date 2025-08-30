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

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })

  const NavLinks = () => (
    <>
      <Link as={RouterLink} to="/" _hover={{ color: 'brand.500' }}>
        Ana Sayfa
      </Link>
      <Link as={RouterLink} to="/hikayeler" _hover={{ color: 'brand.500' }}>
        Hikâyeler
      </Link>
      <Link as={RouterLink} to="/hakkinda" _hover={{ color: 'brand.500' }}>
        Hakkında
      </Link>
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
              color="brand.500"
              _hover={{ textDecoration: 'none', color: 'brand.600' }}
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
                <Button 
                  variant="outline" 
                  colorScheme="brand"
                  as={RouterLink}
                  to="/"
                  size="sm"
                >
                  Hikâyeleri Gör
                </Button>
                <Button 
                  colorScheme="brand" 
                  leftIcon={<AddIcon />}
                  as={RouterLink}
                  to="/hikaye-olustur"
                  size="sm"
                >
                  Hikâyeni Paylaş
                </Button>
              </HStack>
            </HStack>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <HStack spacing={2}>
              <Button 
                colorScheme="brand" 
                leftIcon={<AddIcon />}
                as={RouterLink}
                to="/hikaye-olustur"
                size="sm"
              >
                Paylaş
              </Button>
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
                <Heading size="md" color="brand.500">
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
                      _hover={{ color: 'brand.500' }}
                      onClick={onClose}
                    >
                      Ana Sayfa
                    </Link>
                    <Link 
                      as={RouterLink} 
                      to="/hikayeler" 
                      fontSize="lg"
                      fontWeight="medium"
                      _hover={{ color: 'brand.500' }}
                      onClick={onClose}
                    >
                      Hikâyeler
                    </Link>
                    <Link 
                      as={RouterLink} 
                      to="/hakkinda" 
                      fontSize="lg"
                      fontWeight="medium"
                      _hover={{ color: 'brand.500' }}
                      onClick={onClose}
                    >
                      Hakkında
                    </Link>
                  </VStack>
                  
                  <Box pt={4} borderTopWidth="1px">
                    <Button 
                      variant="outline" 
                      colorScheme="brand"
                      as={RouterLink}
                      to="/"
                      w="full"
                      mb={3}
                      onClick={onClose}
                    >
                      Hikâyeleri Gör
                    </Button>
                    <Button 
                      colorScheme="brand" 
                      leftIcon={<AddIcon />}
                      as={RouterLink}
                      to="/hikaye-olustur"
                      w="full"
                      onClick={onClose}
                    >
                      Hikâyeni Paylaş
                    </Button>
                  </Box>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </Flex>
      </Container>
    </Box>
  )
}

export default Header