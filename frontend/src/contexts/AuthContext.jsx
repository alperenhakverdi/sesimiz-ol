import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useColorMode } from '@chakra-ui/react'
import axios from 'axios'
import api from '../services/api'
import { setLogoutHandler, setCsrfTokenHandler } from '../services/authHandlers'

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
  const { colorMode, setColorMode } = useColorMode()

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

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/session')
      const data = response.data || {}

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
      setUser(null)
      throw error
    }
  }, [applyCsrfToken])

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

  const userSettings = user?.settings
  const themePreference = userSettings?.theme

  useEffect(() => {
    if (!userSettings) {
      applyThemePreference('SYSTEM')
      applyFontSizePreference('MEDIUM')
      applyMotionPreference(false)
      return
    }

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
    delete api.defaults.headers.common[CSRF_HEADER_NAME]
    delete axios.defaults.headers.common[CSRF_HEADER_NAME]
  }, [])

  useEffect(() => {
    setLogoutHandler(() => forceLogout)
    setCsrfTokenHandler((token) => applyCsrfToken(token))
  }, [forceLogout, applyCsrfToken])

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
      const token = response.data?.csrfToken
      if (token) {
        applyCsrfToken(token)
      }
      const profile = await fetchProfile()
      return profile
    } finally {
      setIsLoading(false)
    }
  }, [applyCsrfToken, fetchProfile])

  const login = useCallback(async (identifier, password) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password
      })

      const loggedInUser = response.data?.user || null
      const token = response.data?.csrfToken

      if (token) {
        applyCsrfToken(token)
      }

      if (loggedInUser) {
        setUser(loggedInUser)
        return loggedInUser
      }
      
      setUser(null)
      return null
    } catch (error) {
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [applyCsrfToken, setUser])

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
    return response.data?.message || 'Şifre başarıyla güncellendi'
  }, [])

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    register,
    login,
    logout,
    logoutAll,
    updateProfile,
    updateSettings,
    changePassword,
    refreshProfile: fetchProfile,
    api,
    csrfToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
