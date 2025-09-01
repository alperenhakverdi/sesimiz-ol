import React, { memo, useMemo, useCallback, Suspense, useState, useEffect, useRef } from 'react'
import {
  Box,
  Spinner,
  Center,
  Text,
  Input
} from '@chakra-ui/react'

// Note: These will be imported from their respective files when used
export const createMemoizedStoryCard = (StoryCard) => memo(({ story, ...props }) => {
  // Only re-render if story data changes
  return <StoryCard story={story} {...props} />
}, (prevProps, nextProps) => {
  return (
    prevProps.story.id === nextProps.story.id &&
    prevProps.story.updatedAt === nextProps.story.updatedAt
  )
})

export const createMemoizedCommentCard = (CommentCard) => memo(({ comment, ...props }) => {
  return <CommentCard comment={comment} {...props} />
}, (prevProps, nextProps) => {
  return (
    prevProps.comment.id === nextProps.comment.id &&
    prevProps.comment.updatedAt === nextProps.comment.updatedAt
  )
})

// Virtualized list for large datasets
export const VirtualizedList = memo(({ 
  items = [],
  renderItem,
  itemHeight = 100,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(items.length, start + visibleCount + overscan * 2)
    
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange])
  
  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight
  
  return (
    <Box
      height={containerHeight}
      overflow="auto"
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <Box height={totalHeight} position="relative">
        <Box transform={`translateY(${offsetY}px)`}>
          {visibleItems.map((item, index) => (
            <Box key={visibleRange.start + index} height={itemHeight}>
              {renderItem(item, visibleRange.start + index)}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
})

// Debounced search hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttled scroll hook
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Optimized search component
export const OptimizedSearch = memo(({ onSearch, placeholder = "Ara..." }) => {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])
  
  const handleChange = useCallback((e) => {
    setQuery(e.target.value)
  }, [])
  
  return (
    <Input
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
    />
  )
})

// Optimized infinite scroll
export const useInfiniteScroll = (callback, options = {}) => {
  const { 
    threshold = 100,
    hasMore = true,
    isLoading = false 
  } = options
  
  const [isFetching, setIsFetching] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      if (
        !hasMore || 
        isLoading || 
        isFetching ||
        window.innerHeight + document.documentElement.scrollTop + threshold < 
        document.documentElement.offsetHeight
      ) {
        return
      }
      
      setIsFetching(true)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, isFetching, threshold])
  
  useEffect(() => {
    if (!isFetching) return
    
    const fetchMore = async () => {
      await callback()
      setIsFetching(false)
    }
    
    fetchMore()
  }, [isFetching, callback])
  
  return [isFetching, setIsFetching]
}

// Component with suspense fallback
export const SuspenseWrapper = ({ 
  children, 
  fallback = <LoadingSpinner />,
  errorFallback = <ErrorMessage />
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

// Default loading spinner
const LoadingSpinner = () => (
  <Center py={8}>
    <Spinner size="lg" color="accent.500" />
  </Center>
)

// Default error message
const ErrorMessage = () => (
  <Center py={8}>
    <Text color="red.500">
      İçerik yüklenirken bir hata oluştu.
    </Text>
  </Center>
)

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (import.meta.env.DEV) {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`)
        
        // Log slow renders (>16ms for 60fps)
        if (renderTime > 16) {
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
        }
      }
    }
  })
}

// Memory usage hook
export const useMemoryMonitor = () => {
  const [memoryUsage, setMemoryUsage] = useState(null)
  
  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        setMemoryUsage({
          used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
        })
      }
      
      const interval = setInterval(updateMemoryUsage, 5000)
      updateMemoryUsage()
      
      return () => clearInterval(interval)
    }
  }, [])
  
  return memoryUsage
}

export default {
  createMemoizedStoryCard,
  createMemoizedCommentCard,
  VirtualizedList,
  useDebounce,
  useThrottle,
  OptimizedSearch,
  useInfiniteScroll,
  SuspenseWrapper,
  usePerformanceMonitor,
  useMemoryMonitor
}