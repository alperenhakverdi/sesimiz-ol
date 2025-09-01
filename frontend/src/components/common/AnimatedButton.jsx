import {
  Button
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { forwardRef } from 'react'

// Keyframes for button animations
const buttonPulse = keyframes`
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(79, 172, 254, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(79, 172, 254, 0);
  }
`

const buttonShake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
`

const buttonGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 5px rgba(79, 172, 254, 0.5);
  }
  50% { 
    box-shadow: 0 0 20px rgba(79, 172, 254, 0.8);
  }
`

const AnimatedButton = forwardRef(({ 
  children, 
  variant = 'solid',
  colorScheme = 'accent',
  animation = 'hover',
  isLoading = false,
  isDisabled = false,
  size = 'md',
  onClick,
  ...props 
}, ref) => {
  // Animation styles based on type
  const getAnimationStyles = () => {
    const baseStyles = {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
    }

    switch (animation) {
      case 'pulse':
        return {
          ...baseStyles,
          animation: `${buttonPulse} 2s infinite`,
        }
      
      case 'glow':
        return {
          ...baseStyles,
          _hover: {
            animation: `${buttonGlow} 1.5s ease-in-out infinite`,
            transform: 'translateY(-2px)',
          }
        }
      
      case 'shake':
        return {
          ...baseStyles,
          _hover: {
            animation: `${buttonShake} 0.6s ease-in-out`,
          }
        }
        
      case 'bounce':
        return {
          ...baseStyles,
          _hover: {
            transform: 'translateY(-4px) scale(1.05)',
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
          },
          _active: {
            transform: 'translateY(-1px) scale(1.02)',
          }
        }
        
      case 'ripple':
        return {
          ...baseStyles,
          _before: {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '0',
            height: '0',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            transform: 'translate(-50%, -50%)',
            transition: 'width 0.6s, height 0.6s',
          },
          _active: {
            _before: {
              width: '300px',
              height: '300px',
            }
          }
        }
        
      default: // 'hover'
        return {
          ...baseStyles,
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.12)',
          },
          _active: {
            transform: 'translateY(0)',
          }
        }
    }
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      colorScheme={colorScheme}
      size={size}
      isLoading={isLoading}
      isDisabled={isDisabled}
      onClick={onClick}
      sx={getAnimationStyles()}
      {...props}
    >
      {children}
    </Button>
  )
})

AnimatedButton.displayName = 'AnimatedButton'

export default AnimatedButton