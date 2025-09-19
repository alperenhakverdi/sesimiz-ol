import { useAuth } from '../../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner, Center, Text } from '@chakra-ui/react'

const ProtectedRoute = ({ children, redirectTo = '/' }) => {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="lg" color="brand.500" />
        <Text ml={4}>Kontrol ediliyor...</Text>
      </Center>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // User is authenticated, render children
  return children
}

export default ProtectedRoute
