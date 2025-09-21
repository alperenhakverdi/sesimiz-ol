import { useState, useRef, useEffect } from 'react'
import { Image, Skeleton, useColorModeValue } from '@chakra-ui/react'

const LazyImage = ({
  src,
  alt,
  fallbackSrc,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  const skeletonBg = useColorModeValue('gray.200', 'neutral.700')

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  const handleLoad = (event) => {
    setIsLoaded(true)
    onLoad?.(event)
  }

  const handleError = (event) => {
    setHasError(true)
    onError?.(event)
  }

  return (
    <div ref={imgRef} style={{ position: 'relative' }}>
      {!isLoaded && !hasError && (
        <Skeleton
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          bg={skeletonBg}
          borderRadius={props.borderRadius}
          zIndex="1"
        />
      )}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fallbackSrc={fallbackSrc || placeholder}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          opacity={isLoaded ? 1 : 0}
          transition="opacity 0.3s ease"
          {...props}
        />
      )}
    </div>
  )
}

export default LazyImage