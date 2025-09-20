import { Box, VStack, Text, Badge, HStack, Button, Spinner } from '@chakra-ui/react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export const notificationTypeLabels = {
  SYSTEM: 'Sistem',
  SECURITY: 'Güvenlik',
  ANNOUNCEMENT: 'Duyuru',
  STORY_COMMENT: 'Yorum',
  STORY_SUPPORT: 'Destek',
  SYSTEM_ALERT: 'Sistem'
}

const typeColorSchemes = {
  SYSTEM: 'gray',
  SECURITY: 'red',
  ANNOUNCEMENT: 'purple',
  STORY_COMMENT: 'teal',
  STORY_SUPPORT: 'pink',
  SYSTEM_ALERT: 'orange'
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  try {
    return formatDistanceToNow(new Date(timestamp), {
      locale: tr,
      addSuffix: true
    })
  } catch (error) {
    return ''
  }
}

const NotificationList = ({
  notifications = [],
  isLoading = false,
  emptyMessage = 'Henüz bildiriminiz yok.',
  onMarkRead,
  variant = 'default'
}) => {
  if (isLoading) {
    return (
      <HStack justify="center" py={6}>
        <Spinner size="sm" color="accent.500" />
        <Text fontSize="sm" color="gray.500">Bildirimler yükleniyor…</Text>
      </HStack>
    )
  }

  if (!notifications.length) {
    return (
      <Box py={variant === 'compact' ? 4 : 8} textAlign="center">
        <Text fontSize={variant === 'compact' ? 'sm' : 'md'} color="gray.500">
          {emptyMessage}
        </Text>
      </Box>
    )
  }

  return (
    <VStack align="stretch" spacing={variant === 'compact' ? 2 : 4}>
      {notifications.map((notification) => {
        const isUnread = !notification.readAt
        const colorScheme = typeColorSchemes[notification.type] || 'accent'
        const label = notificationTypeLabels[notification.type] || notification.type

        return (
          <Box
            key={notification.id}
            borderWidth="1px"
            borderRadius="md"
            p={variant === 'compact' ? 3 : 4}
            bg={isUnread ? 'accent.50' : 'white'}
            borderColor={isUnread ? 'accent.100' : 'gray.100'}
          >
            <HStack justify="space-between" align="flex-start" spacing={3}>
              <Badge colorScheme={colorScheme} textTransform="uppercase" fontSize="0.65rem">
                {label}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                {formatTimestamp(notification.createdAt)}
              </Text>
            </HStack>

            <Text fontSize={variant === 'compact' ? 'sm' : 'md'} fontWeight="semibold" mt={2} color="gray.800">
              {notification.title}
            </Text>

            {notification.body && (
              <Text fontSize={variant === 'compact' ? 'xs' : 'sm'} color="gray.600" mt={1} noOfLines={variant === 'compact' ? 3 : undefined}>
                {notification.body}
              </Text>
            )}

            {isUnread && onMarkRead && (
              <Button
                size="xs"
                variant="link"
                mt={2}
                colorScheme="accent"
                onClick={() => onMarkRead(notification.id)}
              >
                Okundu işaretle
              </Button>
            )}
          </Box>
        )
      })}
    </VStack>
  )
}

export default NotificationList
