import { Box, VStack, Text, Badge, HStack, Button, Spinner, useColorModeValue } from '@chakra-ui/react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { notificationTypeLabels, notificationTypeColorSchemes } from './notificationMetadata'

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  try {
    return formatDistanceToNow(new Date(timestamp), {
      locale: tr,
      addSuffix: true
    })
  } catch {
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
  const mutedText = useColorModeValue('neutral.600', 'neutral.400')
  const headingText = useColorModeValue('primary.800', 'neutral.100')
  const secondaryText = useColorModeValue('neutral.600', 'neutral.300')
  const unreadBg = useColorModeValue('accent.50', 'neutral.800')
  const cardBg = useColorModeValue('white', 'neutral.800')
  const borderColor = useColorModeValue('neutral.200', 'neutral.700')

  if (isLoading) {
    return (
      <HStack justify="center" py={6}>
        <Spinner size="sm" color="accent.500" />
        <Text fontSize="sm" color={mutedText}>Bildirimler yükleniyor…</Text>
      </HStack>
    )
  }

  if (!notifications.length) {
    return (
      <Box py={variant === 'compact' ? 4 : 8} textAlign="center">
        <Text fontSize={variant === 'compact' ? 'sm' : 'md'} color={mutedText}>
          {emptyMessage}
        </Text>
      </Box>
    )
  }

  return (
    <VStack align="stretch" spacing={variant === 'compact' ? 2 : 4}>
      {notifications.map((notification) => {
        const isUnread = !notification.read && !notification.readAt
        const colorScheme = notificationTypeColorSchemes[notification.type] || 'accent'
        const label = notificationTypeLabels[notification.type] || notification.type

        return (
          <Box
            key={notification.id}
            borderWidth="1px"
            borderRadius="md"
            p={variant === 'compact' ? 3 : 4}
            bg={isUnread ? unreadBg : cardBg}
            borderColor={isUnread ? 'accent.100' : borderColor}
          >
            <HStack justify="space-between" align="flex-start" spacing={3}>
              <Badge colorScheme={colorScheme} textTransform="uppercase" fontSize="0.65rem">
                {label}
              </Badge>
              <Text fontSize="xs" color={mutedText}>
                {formatTimestamp(notification.createdAt)}
              </Text>
            </HStack>

            <Text fontSize={variant === 'compact' ? 'sm' : 'md'} fontWeight="semibold" mt={2} color={headingText}>
              {notification.title}
            </Text>

            {(notification.body || notification.message) && (
              <Text fontSize={variant === 'compact' ? 'xs' : 'sm'} color={secondaryText} mt={1} noOfLines={variant === 'compact' ? 3 : undefined}>
                {notification.body || notification.message}
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