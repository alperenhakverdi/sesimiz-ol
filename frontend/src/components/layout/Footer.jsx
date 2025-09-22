import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Link,
  Divider,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

const Footer = () => {
  const bg = useColorModeValue('gray.800', 'neutral.900')
  const textColor = useColorModeValue('white', 'neutral.100')
  const brandColor = useColorModeValue('brand.300', 'brand.200')
  const descColor = useColorModeValue('gray.300', 'neutral.300')
  const linkColor = useColorModeValue('gray.300', 'neutral.400')
  const linkHoverColor = useColorModeValue('accent.300', 'accent.200')
  const dividerColor = useColorModeValue('gray.600', 'neutral.700')
  const copyrightColor = useColorModeValue('gray.400', 'neutral.500')
  const subTextColor = useColorModeValue('gray.500', 'neutral.600')

  return (
    <Box bg={bg} color={textColor} py={8} mt="auto">
      <Container maxW="container.xl" px={4}>
        <VStack spacing={6}>
          {/* Main Footer Content */}
          <VStack spacing={4} textAlign="center">
            <Text fontSize="lg" fontWeight="bold" color={brandColor}>
              Sesimiz Ol
            </Text>
            <Text fontSize="sm" color={descColor} maxW="md">
              Kadınların hikâyelerini güvenle paylaşabilecekleri anonim platform. 
              Sesimiz birleşsin, hikâyelerimiz duyulsun.
            </Text>
          </VStack>

          {/* Footer Links */}
          <HStack 
            spacing={6} 
            flexWrap="wrap" 
            justify="center"
            fontSize="sm"
          >
            <Link 
              as={RouterLink} 
              to="/stklar"
              color={linkColor}
              _hover={{ color: linkHoverColor, textDecoration: 'underline' }}
            >
              STK'lar
            </Link>
            <Link 
              as={RouterLink} 
              to="/topluluk"
              color={linkColor}
              _hover={{ color: linkHoverColor, textDecoration: 'underline' }}
            >
              Topluluk
            </Link>
            <Link 
              as={RouterLink} 
              to="/duyurular"
              color={linkColor}
              _hover={{ color: linkHoverColor, textDecoration: 'underline' }}
            >
              Duyurular
            </Link>
            <Link 
              as={RouterLink} 
              to="/hakkinda"
              color={linkColor}
              _hover={{ color: linkHoverColor, textDecoration: 'underline' }}
            >
              Hakkında
            </Link>
            <Link 
              as={RouterLink} 
              to="/gizlilik"
              color={linkColor}
              _hover={{ color: linkHoverColor, textDecoration: 'underline' }}
            >
              Gizlilik
            </Link>
            <Link 
              as={RouterLink} 
              to="/destek"
              color={linkColor}
              _hover={{ color: linkHoverColor, textDecoration: 'underline' }}
            >
              Destek
            </Link>
            <Link 
              as={RouterLink} 
              to="/iletisim"
              color={linkColor}
              _hover={{ color: linkHoverColor, textDecoration: 'underline' }}
            >
              İletişim
            </Link>
          </HStack>

          <Divider borderColor={dividerColor} />

          {/* Bottom Footer */}
          <VStack spacing={2} textAlign="center">
            <Text fontSize="xs" color={copyrightColor}>
              © 2025 Sesimiz Ol. Tüm hakları saklıdır.
            </Text>
            <Text fontSize="xs" color={subTextColor}>
              Bu platform kadınların güvenle hikâyelerini paylaşmaları için tasarlanmıştır.
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}

export default Footer