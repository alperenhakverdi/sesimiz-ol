import React from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Icon,
  useColorModeValue
} from '@chakra-ui/react'
import { WarningIcon } from '@chakra-ui/icons'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    })
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // TODO: Log to external error reporting service in production
    // Example: Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = false } = this.props
      
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDetails={showDetails}
          onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
const ErrorFallback = ({ 
  error, 
  errorInfo, 
  showDetails = false, 
  onRetry,
  title = "Bir şeyler ters gitti",
  message = "Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin."
}) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('red.200', 'red.600')

  return (
    <Box
      p={8}
      textAlign="center"
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      maxW="container.md"
      mx="auto"
      my={8}
    >
      <VStack spacing={6}>
        {/* Error Icon */}
        <Icon 
          as={WarningIcon} 
          boxSize={16} 
          color="red.500" 
        />
        
        {/* Error Message */}
        <VStack spacing={3}>
          <Heading 
            as="h2" 
            size="lg" 
            color="red.600"
          >
            {title}
          </Heading>
          
          <Text 
            fontSize="md" 
            color="neutral.600"
            maxW="lg"
            lineHeight="tall"
          >
            {message}
          </Text>
        </VStack>

        {/* Actions */}
        <VStack spacing={3}>
          <Button
            colorScheme="red"
            onClick={() => window.location.reload()}
          >
            Sayfayı Yenile
          </Button>
          
          {onRetry && (
            <Button
              variant="outline"
              colorScheme="red"
              onClick={onRetry}
            >
              Tekrar Dene
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            as="a"
            href="/"
          >
            Ana Sayfaya Dön
          </Button>
        </VStack>

        {/* Error Details (Development) */}
        {showDetails && error && (
          <Alert status="error" borderRadius="md" textAlign="left">
            <AlertIcon />
            <VStack align="start" spacing={2} flex="1">
              <Text fontWeight="bold" fontSize="sm">
                Hata Detayları:
              </Text>
              <Text fontSize="xs" fontFamily="mono">
                {error.toString()}
              </Text>
              {errorInfo && (
                <>
                  <Text fontWeight="bold" fontSize="sm" mt={2}>
                    Stack Trace:
                  </Text>
                  <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap">
                    {errorInfo.componentStack}
                  </Text>
                </>
              )}
            </VStack>
          </Alert>
        )}
      </VStack>
    </Box>
  )
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryConfig = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Simple error boundary hook for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null)
  
  const resetError = () => setError(null)
  
  const captureError = (error, errorInfo = null) => {
    setError({ error, errorInfo })
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Captured error:', error, errorInfo)
    }
  }
  
  if (error) {
    throw error.error // This will be caught by ErrorBoundary
  }
  
  return { captureError, resetError }
}

export default ErrorBoundary