import { useAuth } from '../../contexts/AuthContext'
import { useDisclosure } from '@chakra-ui/react'
import { useEffect } from 'react'
import LoginModal from '../auth/LoginModal'

const ProtectedRoute = ({ children, redirectToModal = true }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirectToModal) {
      onOpen()
    }
  }, [isAuthenticated, isLoading, redirectToModal, onOpen])

  // Show loading state while checking authentication
  if (isLoading) {
    return null // or a loading spinner
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