import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useColorMode } from '@chakra-ui/react'
import axios from 'axios'
import api from '../services/api'
import { setLogoutHandler, setCsrfTokenHandler, setAccessTokenHandler } from '../services/authHandlers'

const CSRF_HEADER_NAME = (import.meta.env.VITE_CSRF_HEADER_NAME || 'x-csrf-token').toLowerCase()

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [renderKey, setRenderKey] = useState(0)
  const { colorMode, setColorMode } = useColorMode()
  const guestPreferencesInitializedRef = useRef(false)

  const applyThemePreference = useCallback((preference) => {
    if (typeof window === 'undefined' || !setColorMode) return
    if (!preference) return

    if (preference === 'SYSTEM') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const targetMode = prefersDark ? 'dark' : 'light'
      if (colorMode !== targetMode) {
        setColorMode(targetMode)
      }
      return
    }

    const targetMode = preference === 'DARK' ? 'dark' : 'light'
    if (colorMode !== targetMode) {
      setColorMode(targetMode)
    }
  }, [colorMode, setColorMode])

  const applyFontSizePreference = useCallback((preference) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const sizeMap = {
      SMALL: 15,
      MEDIUM: 16,
      LARGE: 18
    }
    const targetSize = sizeMap[preference] || sizeMap.MEDIUM
    root.style.fontSize = `${targetSize}px`
  }, [])

  const applyMotionPreference = useCallback((reducedMotion) => {
    if (typeof document === 'undefined' || !document.body) return
    document.body.classList.toggle('reduced-motion', !!reducedMotion)
  }, [])

  const applyCsrfToken = useCallback((token) => {
    if (!token) return
    setCsrfToken(token)
    api.defaults.headers.common[CSRF_HEADER_NAME] = token
    axios.defaults.headers.common[CSRF_HEADER_NAME] = token
  }, [])

  const applyAccessToken = useCallback((token) => {
    setAccessToken(token || null)
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/session')
      
      // API interceptor extracts response.data, so response is the full backend response
      // Backend sends: { success: true, data: { authenticated: true, user: {...}, csrfToken: "..." } }
      // After interceptor: { success: true, data: { authenticated: true, user: {...}, csrfToken: "..." } }
      
      if (!response?.success) {
        setUser(null)
        return null
      }
      
      const data = response?.data || {}

      if (data?.csrfToken) {
        applyCsrfToken(data.csrfToken)
      }

      if (!data?.authenticated) {
        setUser(null)
        return null
      }

      const profile = data.user || null
      setUser(profile)
      return profile
    } catch (error) {
      console.error('Session fetch error:', error)
      setUser(null)
      return null
    }
  }, [applyCsrfToken, applyAccessToken])

  const initialize = useCallback(async () => {
    try {
      await fetchProfile()
    } catch {
      // Ignore; user is not authenticated
    } finally {
      setIsLoading(false)
    }
  }, [fetchProfile])

  useEffect(() => {
    initialize()
  }, [initialize])

  // Force re-render when user state changes
  useEffect(() => {
    // This effect will run whenever user state changes
    // It helps ensure components re-render when authentication state changes
  }, [user])


  const userSettings = user?.settings
  const themePreference = userSettings?.theme

  useEffect(() => {
    if (!userSettings) {
      if (!guestPreferencesInitializedRef.current) {
        applyThemePreference('SYSTEM')
        applyFontSizePreference('MEDIUM')
        applyMotionPreference(false)
        guestPreferencesInitializedRef.current = true
      }
      return
    }

    guestPreferencesInitializedRef.current = false

    const { theme, fontSize, reducedMotion } = userSettings
    applyThemePreference(theme)
    applyFontSizePreference(fontSize)
    applyMotionPreference(reducedMotion)
  }, [userSettings, applyThemePreference, applyFontSizePreference, applyMotionPreference])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!themePreference || themePreference !== 'SYSTEM') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => {
      applyThemePreference(event.matches ? 'DARK' : 'LIGHT')
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [themePreference, applyThemePreference])

  const forceLogout = useCallback(async ({ skipServer = false } = {}) => {
    if (!skipServer) {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.warn('Logout request failed:', error)
      }
    }
    setUser(null)
    setCsrfToken(null)
    setAccessToken(null)
    delete api.defaults.headers.common[CSRF_HEADER_NAME]
    delete axios.defaults.headers.common[CSRF_HEADER_NAME]
  }, [])

  useEffect(() => {
    setLogoutHandler(() => forceLogout)
    setCsrfTokenHandler((token) => applyCsrfToken(token))
    setAccessTokenHandler((token) => applyAccessToken(token))
  }, [forceLogout, applyCsrfToken, applyAccessToken])

  const register = useCallback(async (payload) => {
    const { nickname, email, password, avatar } = payload
    const requestData = {
      nickname,
      email,
      password
    }

    if (avatar && avatar instanceof File) {
      requestData.avatar = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(avatar)
      })
    }

    setIsLoading(true)
    try {
      const response = await api.post('/auth/register', requestData)
      
      if (!response?.success) {
        throw new Error('Registration failed')
      }
      
      const token = response?.data?.csrfToken
      const tokens = response?.data?.tokens
      if (token) {
        applyCsrfToken(token)
      }
      if (tokens?.accessToken) {
        applyAccessToken(tokens.accessToken)
      }
      const profile = await fetchProfile()
      return profile
    } finally {
      setIsLoading(false)
    }
  }, [applyCsrfToken, fetchProfile, applyAccessToken])

  const login = useCallback(async (identifier, password) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password
      })

      // API interceptor extracts response.data, so response is the full backend response
      if (!response?.success) {
        setUser(null)
        return null
      }
      
      const loggedInUser = response?.data?.user || null
      const token = response?.data?.csrfToken
      const tokens = response?.data?.tokens

      if (token) {
        applyCsrfToken(token)
      }
      if (tokens?.accessToken) {
        applyAccessToken(tokens.accessToken)
      }

      if (loggedInUser) {
        // Use a more explicit state update to ensure re-render
        setUser(() => loggedInUser)
        // Force a re-render by updating the render key
        setRenderKey(prev => prev + 1)
        return loggedInUser
      }
      
      setUser(null)
      return null
    } catch (error) {
      setUser(null)
      
      // Create user-friendly error message
      let userMessage = 'Giriş işlemi başarısız'
      
      if (error?.response?.status === 401) {
        userMessage = 'Kullanıcı adı/email veya şifre hatalı'
      } else if (error?.response?.status === 403) {
        const errorData = error.response.data?.error
        if (errorData?.code === 'USER_BANNED') {
          userMessage = 'Hesabınız engellenmiştir'
        } else if (errorData?.code === 'ACCOUNT_LOCKED') {
          userMessage = 'Hesabınız geçici olarak kilitlenmiştir'
        }
      } else if (error?.response?.status === 429) {
        userMessage = 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin'
      } else if (error?.code === 'NETWORK_ERROR' || !error?.response) {
        userMessage = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin'
      }
      
      // Create a new error with user-friendly message
      const userError = new Error(userMessage)
      userError.originalError = error
      throw userError
    } finally {
      setIsLoading(false)
    }
  }, [applyCsrfToken, applyAccessToken])

  const logout = useCallback(async () => {
    await forceLogout()
  }, [forceLogout])

  const logoutAll = useCallback(async () => {
    try {
      await api.post('/auth/logout-all')
    } finally {
      setUser(null)
    }
  }, [])

  const updateProfile = useCallback(async (profileData) => {
    const formData = new FormData()

    if (profileData.nickname !== undefined) {
      formData.append('nickname', profileData.nickname)
    }

    if (profileData.email !== undefined) {
      formData.append('email', profileData.email)
    }

    if (profileData.bio !== undefined) {
      formData.append('bio', profileData.bio ?? '')
    }

    if (profileData.avatar) {
      formData.append('avatar', profileData.avatar)
    }

    setIsLoading(true)
    try {
      await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      const refreshed = await fetchProfile()
      return refreshed
    } finally {
      setIsLoading(false)
    }
  }, [fetchProfile])

  const updateSettings = useCallback(async (settingsPayload) => {
    const response = await api.put('/users/settings', settingsPayload)
    
    if (!response?.success) {
      throw new Error('Settings update failed')
    }
    
    const updatedSettings = response.data?.settings || null
    if (updatedSettings) {
      setUser((prev) => (prev ? { ...prev, settings: updatedSettings } : prev))
    }
    return updatedSettings
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', {
      currentPassword,
      newPassword
    })
    
    if (!response?.success) {
      throw new Error('Password change failed')
    }
    
    return response.data?.message || response.message || 'Şifre başarıyla güncellendi'
  }, [])

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'ADMIN'

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    logoutAll,
    updateProfile,
    updateSettings,
    changePassword,
    refreshProfile: fetchProfile,
    api,
    csrfToken,
    token: accessToken,
    renderKey // Add render key to force re-renders when needed
  }


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext