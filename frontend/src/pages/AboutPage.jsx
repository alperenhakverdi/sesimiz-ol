import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Link,
  Alert,
  AlertIcon,
  Button,
  Icon,
  HStack
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { AddIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'

const AboutPage = () => {
  const supportNumbers = [
    {
      name: 'ALO 183 Aile Danışma Hattı',
      number: '183',
      description: '7/24 aile danışmanlığı ve kadın destek hattı'
    },
    {
      name: 'Mor Çatı Kadın Danışma Merkezi',
      number: '0212 292 52 31',
      description: 'Kadına yönelik şiddet danışma hattı'
    },
    {
      name: 'Kadın Dayanışma Vakfı',
      number: '0212 256 13 59',
      description: 'Hukuki ve psikolojik destek hattı'
    }
  ]

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={12} align="stretch">
        {/* Hero Section */}
        <ProgressiveLoader delay={200} type="fade">
          <VStack spacing={6} textAlign="center">
            <Heading as="h1" size="2xl" color="accent.500">
              Hakkımızda
            </Heading>
            <Text fontSize="xl" color="primary.600" maxW="2xl">
              "Sesimiz Ol", kadınların hikâyelerini güvenle paylaşabilecekleri 
              anonim bir dijital platformdur.
            </Text>
          </VStack>
        </ProgressiveLoader>

        {/* Mission Section */}
        <ProgressiveLoader delay={400} type="fade">
          <Box bg="white" p={8} borderRadius="lg" shadow="sm">
            <VStack spacing={6} align="start">
              <Heading as="h2" size="lg" color="accent.500">
                Misyonumuz
              </Heading>
              <VStack spacing={4} align="start">
                <Text fontSize="lg" lineHeight="tall">
                  Türkiye'de kadınların yaşadığı deneyimlerin sesini duyurmak, 
                  hikâyelerini paylaşmaya çekindikleri konularda güvenli bir alan oluşturmak.
                </Text>
                <Text>
                  Platform üzerinde paylaşılan hikâyeler anonimdir ve kişisel bilgiler korunur. 
                  Amacımız, kadınları güçlendirmek ve dayanışmayı artırmaktır.
                </Text>
              </VStack>
            </VStack>
          </Box>
        </ProgressiveLoader>

        {/* Features Section */}
        <ProgressiveLoader delay={600} type="fade">
          <VStack spacing={6} align="stretch">
            <Heading as="h2" size="lg" textAlign="center" color="primary.700">
              Platform Özellikleri
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Card>
                <CardBody textAlign="center">
                  <VStack spacing={3}>
                    <Badge colorScheme="accent" fontSize="sm" px={3} py={1}>
                      Anonimlik
                    </Badge>
                    <Heading size="md">Güvenli Paylaşım</Heading>
                    <Text fontSize="sm" color="primary.600">
                      Sadece takma isim ile kayıt, kişisel bilgi alınmaz
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody textAlign="center">
                  <VStack spacing={3}>
                    <Badge colorScheme="accent" fontSize="sm" px={3} py={1}>
                      Topluluk
                    </Badge>
                    <Heading size="md">Dayanışma</Heading>
                    <Text fontSize="sm" color="primary.600">
                      Benzer deneyimleri olan kadınlarla bağlantı kurma
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody textAlign="center">
                  <VStack spacing={3}>
                    <Badge colorScheme="accent" fontSize="sm" px={3} py={1}>
                      Güvenlik
                    </Badge>
                    <Heading size="md">Gizlilik</Heading>
                    <Text fontSize="sm" color="primary.600">
                      KVKK uyumlu, veriler 3. taraflarla paylaşılmaz
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>
        </ProgressiveLoader>

        {/* Support Section */}
        <ProgressiveLoader delay={800} type="fade">
          <Box bg="accent.50" p={8} borderRadius="lg">
          <VStack spacing={6} align="stretch">
            <VStack spacing={3} textAlign="center">
              <Heading as="h2" size="lg" color="accent.600">
                Destek Hatları
              </Heading>
              <Text color="accent.500">
                Profesyonel yardıma ihtiyacınız varsa aşağıdaki destek hatlarından yararlanabilirsiniz
              </Text>
            </VStack>
            
            <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
              {supportNumbers.map((support, index) => (
                <Box key={index} bg="white" p={6} borderRadius="lg" border="1px" borderColor="accent.200" shadow="sm">
                  <VStack align="start" spacing={3} flex="1">
                    <HStack>
                      <Box w={3} h={3} bg="accent.500" borderRadius="full" />
                      <Text fontWeight="bold" color="accent.700">{support.name}</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Icon as={PhoneIcon} boxSize={4} color="accent.500" />
                      <Link href={`tel:${support.number}`} color="accent.600" fontWeight="medium" fontSize="lg">
                        {support.number}
                      </Link>
                    </HStack>
                    <Text fontSize="sm" color="primary.600" pl={6}>
                      {support.description}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
          </Box>
        </ProgressiveLoader>

        {/* Privacy Notice */}
        <ProgressiveLoader delay={1000} type="fade">
          <Box bg="accent.50" p={6} borderRadius="lg" border="1px" borderColor="accent.200">
          <VStack align="start" spacing={3}>
            <HStack>
              <Box w={4} h={4} bg="accent.500" borderRadius="full" />
              <Text fontWeight="bold" color="accent.700">Gizlilik Taahhüdü</Text>
            </HStack>
            <Text fontSize="sm" color="primary.600">
              Bu platformda paylaşılan tüm hikâyeler anonimdir. Kişisel verileriniz korunur 
              ve hiçbir şekilde 3. taraflarla paylaşılmaz. Güvenliğiniz bizim önceliğimizdir.
            </Text>
          </VStack>
          </Box>
        </ProgressiveLoader>

      </VStack>
    </Container>
  )
}

export default AboutPage