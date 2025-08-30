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
  Icon
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { AddIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons'

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
        <VStack spacing={6} textAlign="center">
          <Heading as="h1" size="2xl" color="brand.500">
            Hakkımızda
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="2xl">
            "Sesimiz Ol", kadınların hikâyelerini güvenle paylaşabilecekleri 
            anonim bir dijital platformdur.
          </Text>
        </VStack>

        {/* Mission Section */}
        <Box bg="white" p={8} borderRadius="lg" shadow="sm">
          <VStack spacing={6} align="start">
            <Heading as="h2" size="lg" color="brand.500">
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

        {/* Features Section */}
        <VStack spacing={6} align="stretch">
          <Heading as="h2" size="lg" textAlign="center" color="gray.700">
            Platform Özellikleri
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card>
              <CardBody textAlign="center">
                <VStack spacing={3}>
                  <Badge colorScheme="brand" fontSize="sm" px={3} py={1}>
                    Anonimlik
                  </Badge>
                  <Heading size="md">Güvenli Paylaşım</Heading>
                  <Text fontSize="sm" color="gray.600">
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
                  <Text fontSize="sm" color="gray.600">
                    Benzer deneyimleri olan kadınlarla bağlantı kurma
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody textAlign="center">
                <VStack spacing={3}>
                  <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                    Güvenlik
                  </Badge>
                  <Heading size="md">Gizlilik</Heading>
                  <Text fontSize="sm" color="gray.600">
                    KVKK uyumlu, veriler 3. taraflarla paylaşılmaz
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>

        {/* Support Section */}
        <Box bg="orange.50" p={8} borderRadius="lg">
          <VStack spacing={6} align="stretch">
            <VStack spacing={3} textAlign="center">
              <Heading as="h2" size="lg" color="orange.700">
                Destek Hatları
              </Heading>
              <Text color="orange.600">
                Profesyonel yardıma ihtiyacınız varsa aşağıdaki destek hatlarından yararlanabilirsiniz
              </Text>
            </VStack>
            
            <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
              {supportNumbers.map((support, index) => (
                <Alert key={index} status="info" borderRadius="md">
                  <AlertIcon />
                  <VStack align="start" spacing={1} flex="1">
                    <Text fontWeight="bold">{support.name}</Text>
                    <HStack>
                      <Icon as={PhoneIcon} boxSize={3} />
                      <Link href={`tel:${support.number}`} color="blue.600" fontWeight="medium">
                        {support.number}
                      </Link>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      {support.description}
                    </Text>
                  </VStack>
                </Alert>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Privacy Notice */}
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={2} flex="1">
            <Text fontWeight="bold">Gizlilik Taahhüdü</Text>
            <Text fontSize="sm">
              Bu platformda paylaşılan tüm hikâyeler anonimdir. Kişisel verileriniz korunur 
              ve hiçbir şekilde 3. taraflarla paylaşılmaz. Güvenliğiniz bizim önceliğimizdir.
            </Text>
          </VStack>
        </Alert>

        {/* Call to Action */}
        <VStack spacing={4} textAlign="center" py={8}>
          <Text fontSize="lg" color="gray.600">
            Sen de hikâyeni paylaşmaya hazır mısın?
          </Text>
          <Button 
            colorScheme="brand" 
            size="lg"
            leftIcon={<AddIcon />}
            as={RouterLink}
            to="/hikaye-olustur"
          >
            Hikâyeni Paylaş
          </Button>
        </VStack>
      </VStack>
    </Container>
  )
}

export default AboutPage