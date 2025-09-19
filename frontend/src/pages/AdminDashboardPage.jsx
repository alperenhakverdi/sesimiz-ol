import { Container, Heading, Text, VStack, Alert, AlertIcon } from '@chakra-ui/react'
import PageTransition from '../components/animations/PageTransition'
import { useAuth } from '../contexts/AuthContext'

const AdminDashboardPage = () => {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <Container maxW="container.md" py={12}>
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          Bu sayfaya erişim yetkiniz yok.
        </Alert>
      </Container>
    )
  }

  return (
    <PageTransition>
      <Container maxW="container.xl" py={12}>
        <VStack align="start" spacing={6}>
          <Heading size="lg" color="accent.600">
            Admin Paneli
          </Heading>
          <Text color="primary.600">
            Yönetim araçları yakında burada olacak.
          </Text>
        </VStack>
      </Container>
    </PageTransition>
  )
}

export default AdminDashboardPage
