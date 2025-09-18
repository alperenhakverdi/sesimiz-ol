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
import { useEffect, useRef, useState } from 'react'

const AboutPage = () => {
  const [sanitizedHtml, setSanitizedHtml] = useState(null)
  const [checkedCustom, setCheckedCustom] = useState(false)
  const appendedLinksRef = useRef([])

  useEffect(() => {
    const rewriteUrl = url => {
      if (!url) return url
      const trimmed = url.trim()
      if (/^(https?:)?\/\//i.test(trimmed)) return trimmed
      if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return trimmed
      // Relative -> serve from /ui/
      return `/ui/${trimmed.replace(/^\.\//, '')}`
    }

    const sanitizeDocument = doc => {
      const allowedTags = new Set([
        'h1','h2','h3','h4','h5','h6','p','span','strong','em','u','small','sup','sub','br','hr',
        'ul','ol','li','a','img','blockquote','code','pre','figure','figcaption','table','thead','tbody','tr','th','td','div','section','article','header','footer','nav'
      ])
      const globalAllowedAttrs = new Set(['class', 'id', 'title', 'aria-label'])
      const perTagAttrs = {
        a: new Set(['href','title','target','rel']),
        img: new Set(['src','alt','title','width','height','loading']),
        table: new Set(['border','cellpadding','cellspacing'])
      }

      const sanitizeNode = node => {
        if (node.nodeType === 3) return // text
        if (node.nodeType !== 1) {
          node.remove()
          return
        }
        const tag = node.tagName.toLowerCase()
        if (!allowedTags.has(tag)) {
          // unwrap children to keep text
          const parent = node.parentNode
          while (node.firstChild) parent.insertBefore(node.firstChild, node)
          parent.removeChild(node)
          return
        }
        // attributes
        Array.from(node.attributes).forEach(attr => {
          const name = attr.name.toLowerCase()
          const value = attr.value
          const allowed = globalAllowedAttrs.has(name) || (perTagAttrs[tag] && perTagAttrs[tag].has(name))
          if (name.startsWith('on') || /javascript:/i.test(value) || !allowed) {
            node.removeAttribute(attr.name)
            return
          }
          if (tag === 'a' && name === 'href') {
            const href = rewriteUrl(value)
            if (!/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(href)) node.removeAttribute('href')
            else node.setAttribute('href', href)
            node.setAttribute('rel', 'noopener noreferrer')
          }
          if (tag === 'a' && name === 'target') {
            if (value !== '_blank') node.removeAttribute('target')
          }
          if (tag === 'img' && name === 'src') {
            const src = rewriteUrl(value)
            if (!/^(https?:\/\/|\/)/i.test(src)) node.removeAttribute('src')
            else node.setAttribute('src', src)
            node.setAttribute('loading', 'lazy')
          }
        })

        // walk children
        Array.from(node.childNodes).forEach(sanitizeNode)
      }

      // strip scripts
      doc.querySelectorAll('script').forEach(n => n.remove())
      // sanitize body
      Array.from(doc.body.childNodes).forEach(sanitizeNode)
      return doc.body.innerHTML
    }

    const attachStylesheetsFrom = doc => {
      const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'))
      links.forEach(l => {
        const href = rewriteUrl(l.getAttribute('href'))
        if (!href) return
        // avoid duplicates
        const exists = document.head.querySelector(`link[data-about-css="true"][href="${href}"]`)
        if (exists) return
        const el = document.createElement('link')
        el.setAttribute('rel','stylesheet')
        el.setAttribute('href', href)
        el.setAttribute('data-about-css','true')
        document.head.appendChild(el)
        appendedLinksRef.current.push(el)
      })
    }

    const attachInlineStylesFrom = doc => {
      const styles = Array.from(doc.querySelectorAll('style'))
      styles.forEach(s => {
        const el = document.createElement('style')
        el.setAttribute('data-about-css','true')
        el.textContent = s.textContent || ''
        document.head.appendChild(el)
        appendedLinksRef.current.push(el)
        s.remove()
      })
    }

    const loadCustom = async () => {
      try {
        const res = await fetch('/ui/hakkimizda.html', { cache: 'no-cache' })
        if (!res.ok) {
          setCheckedCustom(true)
          return
        }
        const html = await res.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        attachStylesheetsFrom(doc)
        attachInlineStylesFrom(doc)
        const clean = sanitizeDocument(doc)
        setSanitizedHtml(clean)
      } catch (_) {
        // ignore
      } finally {
        setCheckedCustom(true)
      }
    }

    loadCustom()

    return () => {
      // cleanup injected CSS links
      appendedLinksRef.current.forEach(el => el.parentNode && el.parentNode.removeChild(el))
      appendedLinksRef.current = []
    }
  }, [])
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

  if (checkedCustom && sanitizedHtml) {
    return (
      <Container maxW="container.lg" py={8}>
        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          shadow="sm"
          border="1px"
          borderColor="neutral.200"
          sx={{
            '.about-html h1': { color: 'accent.600', fontSize: '2xl', mb: 4 },
            '.about-html h2': { color: 'accent.500', fontSize: 'xl', mt: 8, mb: 3 },
            '.about-html h3': { color: 'primary.700', fontSize: 'lg', mt: 6, mb: 2 },
            '.about-html p': { color: 'primary.700', lineHeight: 'tall', mb: 4 },
            '.about-html ul, .about-html ol': { pl: 6, mb: 4 },
            '.about-html li': { mb: 2 },
            '.about-html a': { color: 'accent.600', textDecoration: 'underline' },
            '.about-html blockquote': {
              borderLeft: '4px solid',
              borderColor: 'accent.300',
              bg: 'accent.50',
              p: 4,
              my: 4,
              color: 'primary.700'
            },
            '.about-html img': { maxWidth: '100%', borderRadius: 'md', my: 4 },
            '.about-html table': { width: '100%', borderCollapse: 'collapse', my: 4 },
            '.about-html th, .about-html td': { border: '1px solid', borderColor: 'neutral.200', p: 2 }
          }}
        >
          <Box className="about-html" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </Box>
      </Container>
    )
  }

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
