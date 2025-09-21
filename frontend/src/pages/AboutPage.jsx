import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  Button,
  Icon
} from '@chakra-ui/react'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'
import { PhoneIcon, LockIcon } from '@chakra-ui/icons'

const features = [
  {
    title: 'Güvenli Paylaşım',
    description: 'Sadece takma isim ile kayıt, kişisel bilgi alınmaz.',
    icon: (
      <Icon
        viewBox="0 0 24 24"
        boxSize={6}
        color="accent.500"
        data-testid="feature-privacy-icon"
      >
        <path
          fill="currentColor"
          d="M12 3C7.03 3 3 5.17 3 8v3c0 3.31 4.03 5.64 9 6 4.97-.36 9-2.69 9-6V8c0-2.83-4.03-5-9-5zm0 10c-2.21 0-4-.9-4-2s1.79-2 4-2 4 .9 4 2-1.79 2-4 2z"
        />
      </Icon>
    )
  },
  {
    title: 'Dayanışma',
    description: 'Benzer deneyimleri olan kadınlarla bağlantı kurma.',
    icon: (
      <Icon viewBox="0 0 24 24" boxSize={6} color="accent.500">
        <path
          fill="currentColor"
          d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm8 2c-1.82 0-5.5.93-6 2.75C9.5 13.93 5.82 13 4 13c-2.33 0-7 1.17-7 3.5V19h24v-2.5c0-2.33-4.67-3.5-7-3.5z"
        />
      </Icon>
    )
  },
  {
    title: 'Gizlilik',
    description: 'KVKK uyumlu, veriler 3. taraflarla paylaşılmaz.',
    icon: <LockIcon boxSize={6} color="accent.500" />
  }
]

const supportContacts = [
  {
    name: 'ALO 183 Aile Danışma Hattı',
    number: '183',
    description: '7/24 aile danışmanlığı ve kadın destek hattı.'
  },
  {
    name: 'Mor Çatı Kadın Danışma Merkezi',
    number: '0212 292 52 31',
    description: 'Kadına yönelik şiddet danışma hattı.'
  },
  {
    name: 'Kadın Dayanışma Vakfı',
    number: '0212 256 13 59',
    description: 'Hukuki ve psikolojik destek hattı.'
  }
]

const AboutPage = () => {
  return (
    <Container maxW="container.xl" py={{ base: 12, md: 20 }}>
      <VStack spacing={{ base: 12, md: 16 }} align="stretch">
        <ProgressiveLoader delay={200} type="fade">
          <VStack spacing={6} textAlign="center">
            <Heading
              as="h1"
              size="2xl"
              color="accent.600"
              fontWeight="extrabold"
            >
              Hakkımızda
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="primary.600" maxW="3xl">
              "Sesimiz Ol", kadınların hikâyelerini güvenle paylaşabilecekleri anonim bir dijital platformdur.
            </Text>
          </VStack>
        </ProgressiveLoader>

        <ProgressiveLoader delay={400} type="fade">
          <Box
            bg="white"
            p={{ base: 6, md: 10 }}
            borderRadius="2xl"
            shadow="xl"
            border="1px solid"
            borderColor="neutral.200"
          >
            <VStack spacing={4} align="start">
              <Heading as="h2" size="lg" color="accent.600">
                Misyonumuz
              </Heading>
              <Text fontSize="lg" color="primary.700" lineHeight="tall">
                Türkiye'de kadınların yaşadığı deneyimlerin sesini duyurmak, hikâyelerini paylaşmaya çekindikleri konularda güvenli bir alan oluşturmak. Platform üzerinde paylaşılan hikâyeler anonimdir ve kişisel bilgiler korunur. Amacımız, kadınları güçlendirmek ve dayanışmayı artırmaktır.
              </Text>
            </VStack>
          </Box>
        </ProgressiveLoader>

        <ProgressiveLoader delay={600} type="fade">
          <VStack spacing={8} align="stretch">
            <Heading as="h2" size="lg" textAlign="center" color="primary.700">
              Platform Özellikleri
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {features.map(feature => (
                <Card
                  key={feature.title}
                  borderTop="4px solid"
                  borderColor="accent.500"
                  bg="white"
                  shadow="md"
                >
                  <CardBody textAlign="center">
                    <VStack spacing={4}>
                      <Box
                        bg="accent.50"
                        color="accent.600"
                        p={4}
                        borderRadius="full"
                        display="inline-flex"
                      >
                        {feature.icon}
                      </Box>
                      <Heading size="md" color="primary.800">
                        {feature.title}
                      </Heading>
                      <Text fontSize="sm" color="primary.600">
                        {feature.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </ProgressiveLoader>

        <ProgressiveLoader delay={800} type="fade">
          <Box
            bg="accent.50"
            p={{ base: 6, md: 10 }}
            borderRadius="2xl"
            border="1px solid"
            borderColor="accent.100"
          >
            <VStack spacing={6}>
              <VStack spacing={3} textAlign="center">
                <Heading as="h2" size="lg" color="accent.600">
                  Destek Hatları
                </Heading>
                <Text color="accent.500">
                  Profesyonel yardıma ihtiyacınız varsa aşağıdaki destek hatlarından yararlanabilirsiniz
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
                {supportContacts.map(contact => (
                  <Box
                    key={contact.name}
                    bg="white"
                    p={6}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="accent.100"
                    shadow="sm"
                    h="full"
                  >
                    <VStack align="start" spacing={3}>
                      <HStack spacing={3}>
                        <PhoneIcon color="accent.500" />
                        <Text fontWeight="bold" color="accent.700">
                          {contact.name}
                        </Text>
                      </HStack>
                      <Text fontSize="lg" fontWeight="semibold" color="accent.600">
                        {contact.number}
                      </Text>
                      <Text fontSize="sm" color="primary.600">
                        {contact.description}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>
        </ProgressiveLoader>

        <ProgressiveLoader delay={1000} type="fade">
          <Box
            bg="white"
            p={{ base: 6, md: 8 }}
            borderRadius="2xl"
            border="1px solid"
            borderColor="accent.100"
            shadow="md"
          >
            <HStack spacing={4} align="start">
              <Box color="accent.600" pt={1}>
                <LockIcon boxSize={6} />
              </Box>
              <VStack align="start" spacing={3}>
                <Text fontWeight="bold" color="accent.700" fontSize="lg">
                  Gizlilik Taahhüdü
                </Text>
                <Text fontSize="sm" color="primary.600">
                  Bu platformda paylaşılan tüm hikayeler anonimdir. Kişisel verileriniz korunur ve hiçbir şekilde 3. taraflarla paylaşılmaz. Güvenliğiniz bizim önceliğimizdir.
                </Text>
              </VStack>
            </HStack>
          </Box>
        </ProgressiveLoader>
      </VStack>
    </Container>
  )
}

export default AboutPage
