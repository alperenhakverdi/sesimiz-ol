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
    autoRefresh = true
  } = options

  const params = useMemo(() => (
    serializeFilters({
      page,
      limit,
      // backend supports only unread flag; map status accordingly
      unread: status === 'unread' ? true : undefined
    })
  ), [page, limit, status])

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

  const listData = swrResponse.data || {}

  const unreadKey = isAuthenticated ? ['notifications-unread-count'] : null
  const unreadSWR = useSWR(
    unreadKey,
    () => notificationAPI.unreadCount(),
    {
      refreshInterval: autoRefresh ? REFRESH_INTERVAL : 0,
      revalidateOnFocus: true
    }
  )

  const markRead = async (id) => {
    await notificationAPI.markRead(id)
    await Promise.all([swrResponse.mutate(), unreadSWR.mutate()])
  }

  const markBulkRead = async (ids) => {
    if (!ids?.length) return
    // Not supported explicitly by backend; fallback to marking individually
    await Promise.all(ids.map((id) => notificationAPI.markRead(id)))
    await Promise.all([swrResponse.mutate(), unreadSWR.mutate()])
  }

  const markAllRead = async () => {
    await notificationAPI.markAll()
    await Promise.all([swrResponse.mutate(), unreadSWR.mutate()])
  }

  return {
    notifications: listData.notifications || [],
    pagination: listData.pagination || { page: 1, limit, total: 0, pages: 0 },
    unreadCount: unreadSWR.data?.count ?? (listData.notifications?.filter?.(n => !n.read)?.length || 0),
    isLoading: swrResponse.isLoading,
    isValidating: swrResponse.isValidating || unreadSWR.isValidating,
    error: swrResponse.error,
    mutate: swrResponse.mutate,
    markRead,
    markBulkRead,
    markAllRead
  }
}

export default useNotifications