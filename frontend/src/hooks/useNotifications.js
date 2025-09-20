import useSWR from 'swr'
import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { notificationAPI } from '../services/api'

const REFRESH_INTERVAL = 60_000

const serializeFilters = (filters) => {
  const normalized = {}
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return
    }
    normalized[key] = value
  })
  return normalized
}

export const useNotifications = (options = {}) => {
  const { isAuthenticated } = useAuth()
  const {
    page = 1,
    limit = 20,
    status,
    type,
    autoRefresh = true
  } = options

  const params = useMemo(() => (
    serializeFilters({
      page,
      limit,
      status,
      type
    })
  ), [page, limit, status, type])

  const swrKey = isAuthenticated ? ['notifications', params] : null

  const swrResponse = useSWR(
    swrKey,
    ([, currentParams]) => notificationAPI.list(currentParams),
    {
      refreshInterval: autoRefresh ? REFRESH_INTERVAL : 0,
      keepPreviousData: true,
      revalidateOnFocus: true
    }
  )

  const data = swrResponse.data || {}

  const markRead = async (id) => {
    await notificationAPI.markRead(id)
    await swrResponse.mutate()
  }

  const markBulkRead = async (ids) => {
    if (!ids?.length) return
    await notificationAPI.markBulk(ids)
    await swrResponse.mutate()
  }

  const markAllRead = async () => {
    await notificationAPI.markAll()
    await swrResponse.mutate()
  }

  return {
    notifications: data.data || [],
    pagination: data.pagination || { page: 1, limit, total: 0, pages: 0 },
    unreadCount: data.unreadCount || 0,
    isLoading: swrResponse.isLoading,
    isValidating: swrResponse.isValidating,
    error: swrResponse.error,
    mutate: swrResponse.mutate,
    markRead,
    markBulkRead,
    markAllRead
  }
}

export default useNotifications
