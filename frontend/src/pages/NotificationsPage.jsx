import { useState, useMemo } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  ButtonGroup,
  HStack,
  Select,
  Spacer,
  Stack,
  Divider,
  Alert,
  AlertIcon,
  Skeleton,
  SimpleGrid
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import useNotifications from '../hooks/useNotifications'
import NotificationList from '../components/notifications/NotificationList'
import { notificationTypeLabels } from '../components/notifications/notificationMetadata'

const statusOptions = [
  { value: 'all', label: 'Tümü' },
  { value: 'unread', label: 'Okunmamış' },
  { value: 'read', label: 'Okunmuş' }
]

const typeOptions = [{ value: 'all', label: 'Tüm türler' }].concat(
  Object.entries(notificationTypeLabels).map(([value, label]) => ({ value, label }))
)

const NotificationsPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)

  const filters = useMemo(() => ({
    page,
    limit: 20,
    status: status === 'all' ? undefined : status,
    type: type === 'all' ? undefined : type
  }), [page, status, type])

  const {
    notifications,
    pagination,
    unreadCount,
    isLoading,
    isValidating,
    markRead,
    markAllRead
  } = useNotifications({ ...filters })

  const resetPage = () => setPage(1)

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus)
    resetPage()
  }

  const handleTypeChange = (event) => {
    setType(event.target.value)
    resetPage()
  }

  if (authLoading) {
    return (
      <Container maxW="container.lg" py={16}>
        <Stack spacing={4}>
          <Skeleton height="24px" />
          <Skeleton height="120px" />
        </Stack>
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container maxW="container.sm" py={16}>
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          Bildirimlerinizi görüntülemek için lütfen giriş yapın.
        </Alert>
      </Container>
    )
  }

  const totalPages = Math.max(pagination.pages || 1, 1)
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  return (
    <Box bg="gray.50" py={{ base: 8, md: 12 }}>
      <Container maxW="container.lg">
        <Stack spacing={6}>
          <Box>
            <Heading size="lg" color="gray.800">Bildirimler</Heading>
            <Text mt={2} color="gray.600">
              Tüm bildirimlerini tek bir yerden yönet. {unreadCount} okunmamış bildirimin var.
            </Text>
          </Box>

          <Box bg="white" borderRadius="lg" p={{ base: 4, md: 6 }} boxShadow="sm">
            <Stack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <HStack spacing={2}>
                  <Text fontWeight="medium" fontSize="sm" color="gray.600">
                    Durum
                  </Text>
                  <ButtonGroup size="sm" variant="outline" isAttached>
                    {statusOptions.map(option => (
                      <Button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        colorScheme={status === option.value ? 'accent' : 'gray'}
                        variant={status === option.value ? 'solid' : 'outline'}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </HStack>

                <HStack spacing={2}>
                  <Text fontWeight="medium" fontSize="sm" color="gray.600">
                    Tür
                  </Text>
                  <Select size="sm" value={type} onChange={handleTypeChange} maxW="220px">
                    {typeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </HStack>
              </SimpleGrid>

              <Divider />

              <Stack spacing={4}>
                <HStack align="center">
                  <Text fontSize="sm" color="gray.500">
                    Sayfa {pagination.page || page} / {totalPages}
                  </Text>
                  <Spacer />
                  <Button size="sm" variant="ghost" colorScheme="accent" onClick={markAllRead} isDisabled={unreadCount === 0}>
                    Tümünü okundu işaretle
                  </Button>
                </HStack>

                <NotificationList
                  notifications={notifications}
                  isLoading={isLoading || isValidating}
                  onMarkRead={markRead}
                  emptyMessage="Bu kriterlere uygun bildirim bulunmuyor."
                />

                <HStack justify="space-between" pt={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    isDisabled={!canGoPrev}
                  >
                    Önceki
                  </Button>
                  <HStack spacing={2}>
                    <Text fontSize="sm" color="gray.500">
                      Toplam {pagination.total || 0} bildirim
                    </Text>
                  </HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(prev => prev + 1)}
                    isDisabled={!canGoNext}
                  >
                    Sonraki
                  </Button>
                </HStack>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

export default NotificationsPage
