/* eslint-disable react-refresh/only-export-components */
import {
  Box,
  Button,
  useColorModeValue,
  VisuallyHidden,
  Text
} from '@chakra-ui/react'
import { useEffect, useRef, useState, useCallback } from 'react'

// Skip to main content link
export const SkipToMain = () => {
  const skipLinkColor = useColorModeValue('white', 'gray.800')
  const skipLinkBg = useColorModeValue('brand.500', 'brand.200')

  return (
    <Button
      as="a"
      href="#main-content"
      position="absolute"
      top="-100px"
      left="16px"
      zIndex="9999"
      bg={skipLinkBg}
      color={skipLinkColor}
      px={4}
      py={2}
      borderRadius="md"
      fontSize="sm"
      fontWeight="medium"
      transition="top 0.3s ease"
      _focus={{
        top: "16px",
        outline: "2px solid",
        outlineColor: "accent.500",
        outlineOffset: "2px"
      }}
    >
      Ana içeriğe geç
    </Button>
  )
}

// Keyboard navigation helper
export const useKeyboardNavigation = (refs = [], options = {}) => {
  const { 
    loop = true, 
    onEscape = null,
    onEnter = null 
  } = options

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (refs.length === 0) return

      const currentIndex = refs.findIndex(ref => 
        ref.current === document.activeElement
      )

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight': {
          event.preventDefault()
          const nextIndex = currentIndex === refs.length - 1 
            ? (loop ? 0 : currentIndex)
            : currentIndex + 1
          refs[nextIndex]?.current?.focus()
          break
        }

        case 'ArrowUp':
        case 'ArrowLeft': {
          event.preventDefault()
          const prevIndex = currentIndex === 0 
            ? (loop ? refs.length - 1 : 0)
            : currentIndex - 1
          refs[prevIndex]?.current?.focus()
          break
        }

        case 'Escape':
          if (onEscape) {
            event.preventDefault()
            onEscape()
          }
          break

        case 'Enter':
        case ' ': {
          if (onEnter && currentIndex >= 0) {
            event.preventDefault()
            onEnter(currentIndex, refs[currentIndex])
          }
          break
        }

        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [refs, loop, onEscape, onEnter])
}

// Focus management hook
export const useFocusManagement = () => {
  const previousFocusRef = useRef(null)

  const storeFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus()
    }
  }, [])

  const focusFirst = useCallback((containerRef) => {
    if (!containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }, [])

  return {
    storeFocus,
    restoreFocus,
    focusFirst
  }
}

// Accessible modal/dialog component
export const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  ...props 
}) => {
  const modalRef = useRef(null)
  const { storeFocus, restoreFocus, focusFirst } = useFocusManagement()

  useEffect(() => {
    if (isOpen) {
      storeFocus()
      setTimeout(() => focusFirst(modalRef), 100)
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      // Trap focus within modal
      const handleTabKey = (event) => {
        if (event.key !== 'Tab') return

        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }

      document.addEventListener('keydown', handleTabKey)
      
      return () => {
        document.removeEventListener('keydown', handleTabKey)
        document.body.style.overflow = 'unset'
        restoreFocus()
      }
    }
  }, [isOpen, storeFocus, restoreFocus, focusFirst])

  if (!isOpen) return null

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.600"
      zIndex="9999"
      display="flex"
      alignItems="center"
      justifyContent="center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      ref={modalRef}
      {...props}
    >
      <Box
        bg={useColorModeValue('white','neutral.800')}
        borderRadius="lg"
        p={6}
        maxW="90vw"
        maxH="90vh"
        overflow="auto"
        position="relative"
      >
        {title && (
          <VisuallyHidden>
            <Text id="modal-title" as="h2">
              {title}
            </Text>
          </VisuallyHidden>
        )}
        
        {children}
        
        <Button
          position="absolute"
          top={2}
          right={2}
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Kapat"
        >
          ✕
        </Button>
      </Box>
    </Box>
  )
}

// Screen reader only text
export const SROnly = ({ children }) => (
  <VisuallyHidden>{children}</VisuallyHidden>
)

// Announce to screen readers
export const useAnnouncer = () => {
  const announcerRef = useRef(null)

  const announce = (message, priority = 'polite') => {
    if (!announcerRef.current) {
      // Create announcer element if it doesn't exist
      const announcer = document.createElement('div')
      announcer.setAttribute('aria-live', priority)
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      announcer.style.position = 'absolute'
      announcer.style.left = '-10000px'
      announcer.style.width = '1px'
      announcer.style.height = '1px'
      announcer.style.overflow = 'hidden'
      
      document.body.appendChild(announcer)
      announcerRef.current = announcer
    }

    // Clear previous message and set new one
    announcerRef.current.textContent = ''
    setTimeout(() => {
      announcerRef.current.textContent = message
    }, 100)
  }

  return { announce }
}

// High contrast mode detector
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)

    const handler = (event) => setIsHighContrast(event.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isHighContrast
}