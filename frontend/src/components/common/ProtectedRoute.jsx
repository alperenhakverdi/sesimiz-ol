import { Navigate, useLocation } from 'react-router-dom'
import { Box, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react'
import { useAuth } from '../../contexts/AuthContext'
import { useDisclosure } from '@chakra-ui/react'
import { useEffect } from 'react'
import LoginModal from '../auth/LoginModal'

const ProtectedRoute = ({
  children,
  redirectToModal = true,
  requireAdmin = false,
  fallbackPath = '/kayit-ol'
}) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirectToModal) {
      onOpen()
    }
  }, [isAuthenticated, isLoading, redirectToModal, onOpen])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    )
  }

  // Check authentication requirement
  if (!isAuthenticated && !redirectToModal) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Check admin requirement
  if (requireAdmin && isAuthenticated && !isAdmin) {
    return (
      <Box p={8}>
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          Bu sayfaya erişim yetkiniz yok. Admin yetkisi gerekiyor.
        </Alert>
      </Box>
    )
  }

  // If user is authenticated, render children
  if (isAuthenticated) {
    return children
  }

  // If redirectToModal is false, don't render anything for unauthenticated users
  if (!redirectToModal) {
    return null
  }

  // Show login modal for unauthenticated users
  return (
    <>
      <LoginModal isOpen={isOpen} onClose={onClose} />
      {children}
    </>
  )
}

export default ProtectedRoute