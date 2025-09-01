import { useState, useEffect } from 'react'
import { Box, VStack, Fade, ScaleFade, Slide } from '@chakra-ui/react'

const ProgressiveLoader = ({ children, delay = 0, type = 'fade' }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const animationProps = {
    in: isVisible,
    transition: {
      enter: { duration: 0.5, ease: 'easeOut' },
      exit: { duration: 0.3, ease: 'easeIn' }
    }
  }

  const renderWithAnimation = () => {
    switch (type) {
      case 'scale':
        return (
          <ScaleFade {...animationProps} initialScale={0.8}>
            {children}
          </ScaleFade>
        )
      case 'slide-up':
        return (
          <Slide direction="bottom" {...animationProps}>
            <Box h="full">{children}</Box>
          </Slide>
        )
      case 'slide-down':
        return (
          <Slide direction="top" {...animationProps}>
            <Box h="full">{children}</Box>
          </Slide>
        )
      case 'fade':
      default:
        return (
          <Fade {...animationProps}>
            {children}
          </Fade>
        )
    }
  }

  return renderWithAnimation()
}

export const StaggeredLoader = ({ children, staggerDelay = 150 }) => {
  return (
    <VStack spacing={0} align="stretch">
      {children.map((child, index) => (
        <ProgressiveLoader 
          key={index} 
          delay={index * staggerDelay}
          type="fade"
        >
          {child}
        </ProgressiveLoader>
      ))}
    </VStack>
  )
}

export default ProgressiveLoader