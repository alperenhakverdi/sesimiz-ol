import { useEffect, useState, useRef } from 'react'
import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  HStack
} from '@chakra-ui/react'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'
import { PhoneIcon, ViewOffIcon, LockIcon } from '@chakra-ui/icons'

const sanitizeHtml = rawHtml => {
  if (typeof window === 'undefined') {
    return ''
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')
  const { body } = doc

  if (!body) {
    return ''
  }

  const trustedScriptSrcPrefixes = ['https://cdn.tailwindcss.com']

  body.querySelectorAll('script').forEach(element => {
    const src = element.getAttribute('src') || ''
    const isTrustedSrc = trustedScriptSrcPrefixes.some(prefix => src.startsWith(prefix))

    if (!isTrustedSrc) {
      element.remove()
    }
  })

  body.querySelectorAll('iframe, object, embed').forEach(element => {
    element.remove()
  })

  body.querySelectorAll('*').forEach(element => {
    Array.from(element.attributes).forEach(attribute => {
      if (attribute.name.startsWith('on')) {
        element.removeAttribute(attribute.name)
        return
      }

      if ((attribute.name === 'href' || attribute.name === 'src') && attribute.value.trim().toLowerCase().startsWith('javascript:')) {
        element.removeAttribute(attribute.name)
      }
    })
  })

  return body.innerHTML.trim()
}

const AboutPage = () => {
  const [customHtml, setCustomHtml] = useState('')
  const appendedAssetsRef = useRef([])

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    const allowedScriptPrefixes = ['https://cdn.tailwindcss.com']

    const loadCustomAboutHtml = async () => {
      try {
        const response = await fetch('/ui/hakkimizda.html', {
          cache: 'no-store',
          signal: controller.signal
        })

        if (!response.ok) {
          if (response.status === 404) {
            return
          }

          throw new Error(`Failed to load custom About page: ${response.status}`)
        }

        const rawHtml = await response.text()

        if (!isMounted) {
          return
        }

        const parser = new DOMParser()
        const doc = parser.parseFromString(rawHtml, 'text/html')

        const appendAssetOnce = (selector, create) => {
          if (document.head.querySelector(selector)) {
            return null
          }
          const element = create()
          if (element) {
            document.head.appendChild(element)
            appendedAssetsRef.current.push(element)
          }
          return element
        }

        doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
          const href = link.getAttribute('href')
          if (!href) {
            link.remove()
            return
          }

          appendAssetOnce(`link[data-about-override="${href}"]`, () => {
            const el = document.createElement('link')
            el.setAttribute('rel', 'stylesheet')
            el.setAttribute('href', href)
            el.setAttribute('data-about-override', href)
            return el
          })

          link.remove()
        })

        doc.querySelectorAll('style').forEach(style => {
          const cssContent = style.textContent || ''
          if (!cssContent.trim()) {
            style.remove()
            return
          }

          const contentHash = encodeURIComponent(cssContent.trim()).slice(0, 32)
          appendAssetOnce(`style[data-about-override="${contentHash}"]`, () => {
            const el = document.createElement('style')
            el.setAttribute('data-about-override', contentHash)
            el.textContent = cssContent
            return el
          })

          style.remove()
        })

        doc.querySelectorAll('script').forEach(script => {
          const src = script.getAttribute('src')
          if (src && allowedScriptPrefixes.some(prefix => src.startsWith(prefix))) {
            appendAssetOnce(`script[data-about-override="${src}"]`, () => {
              const el = document.createElement('script')
              el.setAttribute('src', src)
              el.setAttribute('data-about-override', src)
              el.referrerPolicy = 'no-referrer'
              el.async = false
              return el
            })
          }

          script.remove()
        })

        const sanitizedHtml = sanitizeHtml(doc.body.innerHTML || '')

        if (sanitizedHtml) {
          setCustomHtml(sanitizedHtml)
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Unable to load custom About page override', error)
        }
      }
    }

    loadCustomAboutHtml()

    return () => {
      isMounted = false
      controller.abort()
      appendedAssetsRef.current.forEach(node => {
        if (node && node.parentNode) {
          node.parentNode.removeChild(node)
        }
      })
      appendedAssetsRef.current = []
    }
  }, [])

  const defaultContent = (
    <VStack spacing={12} align="stretch">
      {/* Hero Section */}
      <ProgressiveLoader delay={200} type="fade">
        <VStack spacing={6} textAlign="center">
          <Heading as="h1" size="2xl" color="accent.600">
            Hakkımızda
          </Heading>
          <Text fontSize="xl" color="primary.600" maxW="2xl">
            "Sesimiz Ol", kadınların hikâyelerini güvenle paylaşabilecekleri anonim bir dijital platformdur.
          </Text>
        </VStack>
      </ProgressiveLoader>

      {/* Mission Section */}
      <ProgressiveLoader delay={400} type="fade">
        <Box bg="white" p={8} borderRadius="lg" shadow="sm" border="1px" borderColor="neutral.200">
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

      {/* Features Section */}
      <ProgressiveLoader delay={600} type="fade">
        <VStack spacing={6} align="stretch">
          <Heading as="h2" size="lg" textAlign="center" color="primary.700">
            Platform Özellikleri
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card borderTop="4px solid" borderColor="accent.500">
              <CardBody textAlign="center">
                <VStack spacing={3}>
                  <Box bg="accent.50" color="accent.600" p={3} borderRadius="full">
                    <Icon as={ViewOffIcon} boxSize={6} />
                  </Box>
                  <Heading size="md" color="primary.800">Güvenli Paylaşım</Heading>
                  <Text fontSize="sm" color="primary.600">
                    Sadece takma isim ile kayıt, kişisel bilgi alınmaz.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card borderTop="4px solid" borderColor="accent.500">
              <CardBody textAlign="center">
                <VStack spacing={3}>
                  <Box bg="accent.50" color="accent.600" p={3} borderRadius="full">
                    {/* People/Groups icon as inline SVG */}
                    <Icon viewBox="0 0 24 24" boxSize={6}>
                      <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </Icon>
                  </Box>
                  <Heading size="md" color="primary.800">Dayanışma</Heading>
                  <Text fontSize="sm" color="primary.600">
                    Benzer deneyimleri olan kadınlarla bağlantı kurma.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card borderTop="4px solid" borderColor="accent.500">
              <CardBody textAlign="center">
                <VStack spacing={3}>
                  <Box bg="accent.50" color="accent.600" p={3} borderRadius="full">
                    <Icon as={LockIcon} boxSize={6} />
                  </Box>
                  <Heading size="md" color="primary.800">Gizlilik</Heading>
                  <Text fontSize="sm" color="primary.600">
                    KVKK uyumlu, veriler 3. taraflarla paylaşılmaz.
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

            <VStack spacing={4} align="stretch" maxW="3xl" mx="auto">
              <Box bg="white" p={6} borderRadius="lg" border="1px" borderColor="accent.200" shadow="sm">
                <HStack align="start" spacing={4}>
                  <Icon as={PhoneIcon} color="accent.500" mt={1} />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" color="accent.700">ALO 183 Aile Danışma Hattı</Text>
                    <Text fontSize="lg" fontWeight="medium" color="accent.600">183</Text>
                    <Text fontSize="sm" color="primary.600">7/24 aile danışmanlığı ve kadın destek hattı.</Text>
                  </VStack>
                </HStack>
              </Box>

              <Box bg="white" p={6} borderRadius="lg" border="1px" borderColor="accent.200" shadow="sm">
                <HStack align="start" spacing={4}>
                  <Icon as={PhoneIcon} color="accent.500" mt={1} />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" color="accent.700">Mor Çatı Kadın Danışma Merkezi</Text>
                    <Text fontSize="lg" fontWeight="medium" color="accent.600">0212 292 52 31</Text>
                    <Text fontSize="sm" color="primary.600">Kadına yönelik şiddet danışma hattı.</Text>
                  </VStack>
                </HStack>
              </Box>

              <Box bg="white" p={6} borderRadius="lg" border="1px" borderColor="accent.200" shadow="sm">
                <HStack align="start" spacing={4}>
                  <Icon as={PhoneIcon} color="accent.500" mt={1} />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" color="accent.700">Kadın Dayanışma Vakfı</Text>
                    <Text fontSize="lg" fontWeight="medium" color="accent.600">0212 256 13 59</Text>
                    <Text fontSize="sm" color="primary.600">Hukuki ve psikolojik destek hattı.</Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          </VStack>
        </Box>
      </ProgressiveLoader>

      {/* Privacy Notice */}
      <ProgressiveLoader delay={1000} type="fade">
        <Box bg="white" p={6} borderRadius="lg" border="1px" borderColor="accent.200" shadow="sm">
          <HStack spacing={4} align="start">
            <Box color="accent.600" pt={1}>
              <Icon as={LockIcon} boxSize={6} />
            </Box>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold" color="accent.700">Gizlilik Taahhüdü</Text>
              <Text fontSize="sm" color="primary.600">
                Bu platformda paylaşılan tüm hikayeler anonimdir. Kişisel verileriniz korunur ve hiçbir şekilde 3. taraflarla paylaşılmaz. Güvenliğiniz bizim önceliğimizdir.
              </Text>
            </VStack>
          </HStack>
        </Box>
      </ProgressiveLoader>
    </VStack>
  )

  return (
    <Container maxW="container.lg" py={8}>
      {customHtml ? (
        <Box className="about-page-custom-html" w="full" dangerouslySetInnerHTML={{ __html: customHtml }} />
      ) : (
        defaultContent
      )}
    </Container>
  )
}

export default AboutPage
