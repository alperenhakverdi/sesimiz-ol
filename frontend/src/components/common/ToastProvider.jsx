import { createContext, useContext, useCallback } from 'react'
import { useToast as useChakraToast, useColorModeValue } from '@chakra-ui/react'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const toast = useChakraToast()

  // Color mode values for toasts
  const successBg = useColorModeValue('green.50', 'green.900')
  const successColor = useColorModeValue('green.800', 'green.200')
  const errorBg = useColorModeValue('red.50', 'red.900')
  const errorColor = useColorModeValue('red.800', 'red.200')
  const warningBg = useColorModeValue('orange.50', 'orange.900')
  const warningColor = useColorModeValue('orange.800', 'orange.200')
  const infoBg = useColorModeValue('blue.50', 'blue.900')
  const infoColor = useColorModeValue('blue.800', 'blue.200')

  const showToast = useCallback(
    ({
      title,
      description,
      status = 'info',
      duration = 5000,
      isClosable = true,
      position = 'top-right',
      variant = 'solid',
      ...props
    }) => {
      // Default color scheme based on status
      let bg, color
      switch (status) {
        case 'success':
          bg = successBg
          color = successColor
          break
        case 'error':
          bg = errorBg
          color = errorColor
          break
        case 'warning':
          bg = warningBg
          color = warningColor
          break
        case 'info':
        default:
          bg = infoBg
          color = infoColor
          break
      }

      return toast({
        title,
        description,
        status,
        duration,
        isClosable,
        position,
        variant,
        containerStyle: {
          bg,
          color,
          borderRadius: 'lg',
          boxShadow: 'lg',
          minW: '300px',
          maxW: '500px'
        },
        ...props
      })
    },
    [toast, successBg, successColor, errorBg, errorColor, warningBg, warningColor, infoBg, infoColor]
  )

  // Helper methods for different toast types
  const success = useCallback(
    ({ title = 'Başarılı!', description, ...props }) =>
      showToast({ title, description, status: 'success', ...props }),
    [showToast]
  )

  const error = useCallback(
    ({ title = 'Hata oluştu', description, ...props }) =>
      showToast({ title, description, status: 'error', ...props }),
    [showToast]
  )

  const warning = useCallback(
    ({ title = 'Uyarı', description, ...props }) =>
      showToast({ title, description, status: 'warning', ...props }),
    [showToast]
  )

  const info = useCallback(
    ({ title = 'Bilgi', description, ...props }) =>
      showToast({ title, description, status: 'info', ...props }),
    [showToast]
  )

  // Promise-based toast for async operations
  const promise = useCallback(
    (promise, options = {}) => {
      const {
        loading = 'İşlem gerçekleştiriliyor...',
        success: successMessage = 'İşlem başarıyla tamamlandı',
        error: errorMessage = 'İşlem sırasında hata oluştu'
      } = options

      // Show loading toast
      const loadingToastId = showToast({
        title: loading,
        status: 'info',
        duration: null,
        isClosable: false
      })

      return promise
        .then((result) => {
          // Close loading toast
          toast.close(loadingToastId)

          // Show success toast
          success({
            title: typeof successMessage === 'function' ? successMessage(result) : successMessage
          })

          return result
        })
        .catch((err) => {
          // Close loading toast
          toast.close(loadingToastId)

          // Show error toast
          error({
            title: typeof errorMessage === 'function' ? errorMessage(err) : errorMessage,
            description: err?.message || err?.toString()
          })

          throw err
        })
    },
    [showToast, success, error, toast]
  )

  const value = {
    toast: showToast,
    success,
    error,
    warning,
    info,
    promise,
    closeAll: toast.closeAll,
    close: toast.close
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Hook for common toast patterns
export const useCommonToasts = () => {
  const { success, error, promise } = useToast()

  const notifySuccess = useCallback(
    (message) => success({ description: message }),
    [success]
  )

  const notifyError = useCallback(
    (message) => error({ description: message }),
    [error]
  )

  const handleAsyncOperation = useCallback(
    (operation, messages = {}) => promise(operation, messages),
    [promise]
  )

  return {
    notifySuccess,
    notifyError,
    handleAsyncOperation
  }
}