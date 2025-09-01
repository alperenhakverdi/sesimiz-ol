import { lazy, useRef, useEffect, useState } from 'react'

// Lazy load page components for better performance
export const LazyHomePage = lazy(() => import('../pages/HomePage'))
export const LazyStoriesPage = lazy(() => import('../pages/StoriesPage'))
export const LazyStoryDetailPage = lazy(() => import('../pages/StoryDetailPage'))
export const LazyStoryCreatePage = lazy(() => import('../pages/StoryCreatePage'))
export const LazyProfilePage = lazy(() => import('../pages/ProfilePage'))
export const LazyAboutPage = lazy(() => import('../pages/AboutPage'))
export const LazyPrivacyPage = lazy(() => import('../pages/PrivacyPage'))
export const LazySupportPage = lazy(() => import('../pages/SupportPage'))
export const LazyContactPage = lazy(() => import('../pages/ContactPage'))

// Lazy load heavy components
export const LazyCommentSection = lazy(() => import('../components/comments/CommentSection'))
export const LazyUserProfile = lazy(() => import('../components/profile/UserProfile'))
export const LazyProfileSettings = lazy(() => import('../components/profile/ProfileSettings'))

// Preload functions for better UX
export const preloadHomePage = () => import('../pages/HomePage')
export const preloadStoriesPage = () => import('../pages/StoriesPage')
export const preloadStoryDetailPage = () => import('../pages/StoryDetailPage')
export const preloadStoryCreatePage = () => import('../pages/StoryCreatePage')
export const preloadProfilePage = () => import('../pages/ProfilePage')

// Route-based preloading
export const preloadRouteComponent = (routeName) => {
  const preloaders = {
    home: preloadHomePage,
    stories: preloadStoriesPage,
    storyDetail: preloadStoryDetailPage,
    storyCreate: preloadStoryCreatePage,
    profile: preloadProfilePage
  }
  
  return preloaders[routeName]?.()
}

// Intersection Observer for lazy loading images/components
export const createLazyLoader = (options = {}) => {
  const defaultOptions = {
    rootMargin: '100px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target
        
        // Handle lazy images
        if (target.dataset.src) {
          target.src = target.dataset.src
          target.removeAttribute('data-src')
        }
        
        // Handle lazy background images
        if (target.dataset.bgSrc) {
          target.style.backgroundImage = `url(${target.dataset.bgSrc})`
          target.removeAttribute('data-bg-src')
        }
        
        // Handle lazy components
        if (target.dataset.component) {
          target.classList.add('lazy-loaded')
          
          // Trigger custom event for component loading
          target.dispatchEvent(new CustomEvent('lazyLoad', {
            detail: { component: target.dataset.component }
          }))
        }
        
        // Remove observer once loaded
        entry.target.observer?.unobserve(entry.target)
      }
    })
  }, defaultOptions)
}

// Hook for lazy loading
export const useLazyLoading = (ref, callback, options = {}) => {
  const { current: observer } = useRef(createLazyLoader(options))
  
  useEffect(() => {
    if (!ref.current || !observer) return
    
    const element = ref.current
    element.observer = observer
    observer.observe(element)
    
    // Add custom load handler if callback provided
    if (callback) {
      const handleLazyLoad = (event) => callback(event.detail)
      element.addEventListener('lazyLoad', handleLazyLoad)
      
      return () => {
        element.removeEventListener('lazyLoad', handleLazyLoad)
        observer.unobserve(element)
      }
    }
    
    return () => observer.unobserve(element)
  }, [ref, observer, callback])
  
  return observer
}

// Image lazy loading component
export const LazyImage = ({ 
  src, 
  alt, 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmNWY1ZjUiLz48L3N2Zz4=',
  ...props 
}) => {
  const imgRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [_isError, setIsError] = useState(false)
  
  useLazyLoading(imgRef, () => setIsLoaded(true))
  
  return (
    <img
      ref={imgRef}
      src={placeholder}
      data-src={src}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      onError={() => setIsError(true)}
      style={{
        opacity: isLoaded ? 1 : 0.7,
        transition: 'opacity 0.3s ease',
        ...props.style
      }}
      {...props}
    />
  )
}

export default {
  LazyHomePage,
  LazyStoriesPage,
  LazyStoryDetailPage,
  LazyStoryCreatePage,
  LazyProfilePage,
  LazyAboutPage,
  LazyPrivacyPage,
  LazySupportPage,
  LazyContactPage,
  preloadRouteComponent,
  createLazyLoader,
  useLazyLoading,
  LazyImage
}