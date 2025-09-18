import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext({})

// Axios instance configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000, // Increased to 30 seconds for Cold Function starts
})

// Token storage helpers
const getTokens = () => {
  const tokens = localStorage.getItem('sesimizol_tokens')
  return tokens ? JSON.parse(tokens) : null
}

const setTokens = (tokens) => {
  localStorage.setItem('sesimizol_tokens', JSON.stringify(tokens))
}

const removeTokens = () => {
  localStorage.removeItem('sesimizol_tokens')
  localStorage.removeItem('sesimizol_user')
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = getTokens()
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const tokens = getTokens()
      
      if (tokens?.refreshToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${tokens.refreshToken}`
              }
            }
          )
          
          const newTokens = response.data.data.tokens
          setTokens(newTokens)
          processQueue(null, newTokens.accessToken)
          
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          logout()
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        logout()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

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

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('sesimizol_user')
      const tokens = getTokens()
      
      if (savedUser && tokens) {
        try {
          setUser(JSON.parse(savedUser))
          // Verify token validity by calling profile endpoint
          await api.get('/auth/profile')
        } catch (error) {
          console.error('Token validation failed:', error)
          removeTokens()
          setUser(null)
        }
      }
      setIsLoading(false)
    }
    
    initializeAuth()
  }, [])

  // Register function
  const register = async (userData) => {
    try {
      console.log('🔄 Starting registration with data:', userData)
      setIsLoading(true)
      
      const requestData = {
        nickname: userData.nickname,
        email: userData.email || ''
      }
      
      // Convert avatar file to base64 if provided
      if (userData.avatar && userData.avatar instanceof File) {
        console.log('🖼️ Converting avatar to base64...')
        requestData.avatar = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(userData.avatar)
        })
        console.log('✅ Avatar converted to base64')
      }
      
      console.log('📤 Sending request to API with data:', requestData)
      const response = await api.post('/auth/register', requestData)
      console.log('📥 API Response:', response)
      
      const { user: newUser, token } = response.data.data
      
      setUser(newUser)
      // Backend returns single token, convert to tokens object format
      setTokens({ accessToken: token, refreshToken: token })
      localStorage.setItem('sesimizol_user', JSON.stringify(newUser))
      
      return newUser
    } catch (error) {
      console.error('❌ Registration error:', error)
      console.error('❌ Error response:', error.response)
      console.error('❌ Error data:', error.response?.data)
      throw new Error(error.response?.data?.error?.message || 'Kayıt işlemi başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (identifier, password) => {
    try {
      setIsLoading(true)
      const response = await api.post('/auth/login', {
        nickname: identifier
      })
      
      const { user: loggedInUser, token } = response.data.data
      
      setUser(loggedInUser)
      // Backend returns single token, convert to tokens object format
      setTokens({ accessToken: token, refreshToken: token })
      localStorage.setItem('sesimizol_user', JSON.stringify(loggedInUser))
      
      return loggedInUser
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Giriş işlemi başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    removeTokens()
  }

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true)
      const formData = new FormData()
      
      if (profileData.nickname) {
        formData.append('nickname', profileData.nickname)
      }
      
      if (profileData.email !== undefined) {
        formData.append('email', profileData.email)
      }
      
      if (profileData.avatar) {
        formData.append('avatar', profileData.avatar)
      }
      
      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const updatedUser = response.data.data.user
      
      setUser(updatedUser)
      localStorage.setItem('sesimizol_user', JSON.stringify(updatedUser))
      
      return updatedUser
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Profil güncelleme başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true)
      const response = await api.put('/auth/password', {
        currentPassword,
        newPassword
      })
      
      return response.data.message
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Şifre değişikliği başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Get current user nickname
  const getCurrentNickname = () => user?.nickname || null

  const value = {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    getCurrentNickname,
    api // Export api instance for direct use when needed
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext