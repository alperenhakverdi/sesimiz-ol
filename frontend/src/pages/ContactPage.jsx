import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  HStack,
  Icon,
  SimpleGrid,
  Button,
  Link,
  Divider,
  Alert,
  AlertIcon,
  Card,
  CardBody
} from '@chakra-ui/react'
import { 
  EmailIcon, 
  InfoIcon, 
  WarningIcon,
  ExternalLinkIcon,
  ChatIcon,
  QuestionOutlineIcon
} from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'

const ContactPage = () => {
  const contactOptions = [
    {
      icon: ChatIcon,
      title: "Community Destek",
      description: "Platform kullanımı ve genel sorular için destek sayfamızı ziyaret edin",
      action: "Destek Sayfası",
      link: "/destek",
      color: "accent.500"
    },
    {
      icon: InfoIcon,
      title: "Genel Bilgi",
      description: "Platform hakkında detaylı bilgi almak için hakkında sayfamızı inceleyin",
      action: "Hakkında Sayfası", 
      link: "/hakkinda",
      color: "brand.500"
    },
    {
      icon: QuestionOutlineIcon,
      title: "Gizlilik Politikası",
      description: "Veri işleme ve gizlilik ile ilgili sorularınız için",
      action: "Gizlilik Politikası",
      link: "/gizlilik", 
      color: "neutral.500"
    }
  ]

  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={12} align="stretch">
        {/* Header Section */}
        <ProgressiveLoader delay={200} type="fade">
          <VStack spacing={6} textAlign="center">
          <HStack spacing={3} justify="center">
            <Icon as={EmailIcon} boxSize={8} color="accent.500" />
            <Heading as="h1" size="xl" color="neutral.800">
              İletişim
            </Heading>
          </HStack>
          
          <VStack spacing={4} maxW="2xl">
            <Text fontSize="lg" color="neutral.600" lineHeight="tall">
              **Sesimiz Ol** platformu ile ilgili sorularınız, önerileriniz veya 
              yardım talebiniz için aşağıdaki seçenekleri kullanabilirsiniz.
            </Text>
            <Text fontSize="md" color="neutral.500">
              Güvenli ve anonim bir ortam yaratmak için buradayız.
            </Text>
          </VStack>
          </VStack>
        </ProgressiveLoader>

        {/* Contact Options */}
        <ProgressiveLoader delay={400} type="fade">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {contactOptions.map((option, index) => (
            <Card 
              key={index}
              variant="outline"
              borderColor="neutral.200"
              _hover={{
                borderColor: option.color,
                transform: "translateY(-2px)",
                shadow: "md"
              }}
              transition="all 0.2s"
            >
              <CardBody p={6}>
                <VStack spacing={4} align="center" textAlign="center" h="full">
                  <Icon 
                    as={option.icon} 
                    boxSize={10} 
                    color={option.color}
                  />
                  <VStack spacing={2}>
                    <Text fontWeight="bold" fontSize="lg" color="neutral.800">
                      {option.title}
                    </Text>
                    <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                      {option.description}
                    </Text>
                  </VStack>
                  <Button
                    as={RouterLink}
                    to={option.link}
                    colorScheme={option.color.split('.')[0]}
                    variant="outline"
                    size="sm"
                    mt="auto"
                  >
                    {option.action}
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
          </SimpleGrid>
        </ProgressiveLoader>

        <Divider borderColor="neutral.300" />

        {/* Emergency Support Notice */}
        <ProgressiveLoader delay={600} type="fade">
          <Box>
          <Alert 
            status="info" 
            borderRadius="lg"
            bg="accent.50"
            borderColor="accent.200"
            borderWidth="1px"
          >
            <AlertIcon color="accent.500" />
            <VStack spacing={2} align="start" flex="1">
              <Text fontWeight="medium" color="accent.700">
                Acil Destek İhtiyacınız mı var?
              </Text>
              <Text fontSize="sm" color="accent.600">
                Acil psikolojik destek ve kriz hatları için destek sayfamızı ziyaret edin. 
                7/24 ulaşabileceğiniz profesyonel yardım hatları listelenmiştir.
              </Text>
              <Button
                as={RouterLink}
                to="/destek"
                colorScheme="accent"
                size="sm"
                rightIcon={<ExternalLinkIcon />}
                mt={2}
              >
                Acil Destek Hatları
              </Button>
            </VStack>
          </Alert>
          </Box>
        </ProgressiveLoader>

        {/* Platform Guidelines */}
        <ProgressiveLoader delay={800} type="fade">
          <Box bg="neutral.50" p={8} borderRadius="lg" borderWidth="1px" borderColor="neutral.200">
          <VStack spacing={6} align="stretch">
            <Heading as="h3" size="md" color="neutral.800" textAlign="center">
              Platform Kuralları ve İletişim İlkeleri
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <VStack spacing={3} align="start">
                <HStack>
                  <Icon as={InfoIcon} color="brand.500" />
                  <Text fontWeight="medium" color="neutral.800">
                    Saygılı İletişim
                  </Text>
                </HStack>
                <Text fontSize="sm" color="neutral.600" pl={6}>
                  Tüm kullanıcılarımıza saygılı ve anlayışlı yaklaşım sergileyin.
                </Text>
              </VStack>

              <VStack spacing={3} align="start">
                <HStack>
                  <Icon as={WarningIcon} color="orange.500" />
                  <Text fontWeight="medium" color="neutral.800">
                    Anonim Güvenlik
                  </Text>
                </HStack>
                <Text fontSize="sm" color="neutral.600" pl={6}>
                  Kişisel bilgilerinizi koruyun ve başkalarının anonimliğine saygı gösterin.
                </Text>
              </VStack>
            </SimpleGrid>

            <Divider borderColor="neutral.300" />

            <Text fontSize="xs" color="neutral.500" textAlign="center">
              Bu platform kadınların güvenle hikâyelerini paylaşmaları için tasarlanmıştır. 
              Topluluk kurallarımıza uygun davranış gösterilmesi tüm kullanıcılarımızdan beklenir.
            </Text>
          </VStack>
          </Box>
        </ProgressiveLoader>

        {/* Back to Stories */}
        <ProgressiveLoader delay={1000} type="fade">
          <VStack spacing={4} textAlign="center" py={8}>
          <Text fontSize="lg" color="neutral.600">
            Hikâyeleri keşfetmeye hazır mısın?
          </Text>
          <HStack spacing={4}>
            <Button 
              variant="outline" 
              colorScheme="gray"
              as={RouterLink}
              to="/"
            >
              Ana Sayfaya Dön
            </Button>
            <Button 
              colorScheme="brand" 
              as={RouterLink}
              to="/hikayeler"
            >
              Hikâyeleri Keşfet
            </Button>
          </HStack>
          </VStack>
        </ProgressiveLoader>
      </VStack>
    </Container>
  )
}

export default ContactPage