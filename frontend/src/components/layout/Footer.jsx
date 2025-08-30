import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Link,
  Divider,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

const Footer = () => {
  return (
    <Box bg="gray.800" color="white" py={8} mt="auto">
      <Container maxW="container.xl" px={4}>
        <VStack spacing={6}>
          {/* Main Footer Content */}
          <VStack spacing={4} textAlign="center">
            <Text fontSize="lg" fontWeight="bold" color="brand.300">
              Sesimiz Ol
            </Text>
            <Text fontSize="sm" color="gray.300" maxW="md">
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
              to="/hakkinda"
              color="gray.300"
              _hover={{ color: 'brand.300' }}
            >
              Hakkında
            </Link>
            <Link 
              as={RouterLink} 
              to="/gizlilik"
              color="gray.300"
              _hover={{ color: 'brand.300' }}
            >
              Gizlilik
            </Link>
            <Link 
              as={RouterLink} 
              to="/destek"
              color="gray.300"
              _hover={{ color: 'brand.300' }}
            >
              Destek
            </Link>
            <Link 
              as={RouterLink} 
              to="/iletisim"
              color="gray.300"
              _hover={{ color: 'brand.300' }}
            >
              İletişim
            </Link>
          </HStack>

          <Divider borderColor="gray.600" />

          {/* Bottom Footer */}
          <VStack spacing={2} textAlign="center">
            <Text fontSize="xs" color="gray.400">
              © 2025 Sesimiz Ol. Tüm hakları saklıdır.
            </Text>
            <Text fontSize="xs" color="gray.500">
              Bu platform kadınların güvenle hikâyelerini paylaşmaları için tasarlanmıştır.
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}

export default Footer