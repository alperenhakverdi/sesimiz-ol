import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Text,
  Button,
  Divider,
  VStack,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiBell, FiWifi, FiWifiOff } from 'react-icons/fi'
import { useSocket } from '../../contexts/SocketContext'
import useNotifications from '../../hooks/useNotifications'
import NotificationList from './NotificationList'

const NotificationBell = () => {
  const {
    notifications: realtimeNotifications,
    unreadCount: realtimeUnreadCount,
    isConnected,
    markNotificationAsRead,
    clearNotifications
  } = useSocket()

  const {
    notifications: dbNotifications,
    unreadCount: dbUnreadCount,
    isLoading,
    markRead,
    markAllRead
  } = useNotifications({ limit: 5 })

  // Merge real-time notifications with database notifications
  const allNotifications = [
    ...realtimeNotifications.slice(0, 3), // Show latest 3 real-time notifications
    ...dbNotifications.slice(0, 5 - Math.min(3, realtimeNotifications.length))
  ]

  const totalUnreadCount = realtimeUnreadCount + dbUnreadCount
  const displayCount = totalUnreadCount > 9 ? '9+' : totalUnreadCount

  const handleMarkAllRead = () => {
    markAllRead()
    clearNotifications()
  }

  return (
    <Menu placement="bottom-end" closeOnSelect={false}>
      <MenuButton
        as={Box}
        position="relative"
        borderRadius="md"
        _hover={{ bg: 'gray.100' }}
      >
        <IconButton
          pointerEvents="none"
          icon={<FiBell />}
          variant="ghost"
          size="sm"
          aria-label="Bildirimler"
          color={useColorModeValue('neutral.700','neutral.300')}
        />
        {totalUnreadCount > 0 && (
          <Badge
            colorScheme="red"
            borderRadius="full"
            position="absolute"
            top="0"
            right="0"
            transform="translate(35%, -35%)"
            fontSize="0.6rem"
            px={2}
          >
            {displayCount}
          </Badge>
        )}
        {/* Connection indicator */}
        <Box
          position="absolute"
          bottom="-2px"
          right="-2px"
          w="8px"
          h="8px"
          borderRadius="full"
          bg={isConnected ? 'green.400' : 'red.400'}
          border="1px solid"
          borderColor="white"
        />
      </MenuButton>
      <MenuList minW="320px" p={0} shadow="lg">
        <Box px={4} py={3} borderBottomWidth="1px">
          <HStack justify="space-between">
            <Box>
              <HStack spacing={2}>
                <Text fontWeight="bold" fontSize="sm" color={useColorModeValue('primary.800','neutral.100')}>
                  Bildirimler
                </Text>
                {isConnected ? (
                  <FiWifi size="12" color="green" />
                ) : (
                  <FiWifiOff size="12" color="red" />
                )}
              </HStack>
              <Text fontSize="xs" color={useColorModeValue('neutral.600','neutral.400')}>
                Son 5 bildirim, {totalUnreadCount} okunmamış
              </Text>
            </Box>
            <Button size="xs" variant="ghost" onClick={handleMarkAllRead} isDisabled={totalUnreadCount === 0}>
              Tümünü oku
            </Button>
          </HStack>
        </Box>
        <Box px={3} py={3} maxH="360px" overflowY="auto">
          {!isConnected && (
            <Alert status="warning" size="sm" mb={2}>
              <AlertIcon />
              <Text fontSize="xs">Bağlantı sorunu var, gerçek zamanlı bildirimler alınamıyor</Text>
            </Alert>
          )}
          <NotificationList
            notifications={allNotifications}
            isLoading={isLoading}
            onMarkRead={(id) => {
              markRead(id)
              markNotificationAsRead(id)
            }}
            variant="compact"
            emptyMessage="Henüz bildiriminiz yok."
          />
        </Box>
        <Divider />
        <MenuItem
          as={RouterLink}
          to="/notifications"
          justifyContent="center"
          fontSize="sm"
          fontWeight="medium"
          color="accent.600"
        >
          Tüm bildirimleri görüntüle
        </MenuItem>
      </MenuList>
    </Menu>
  )
}

export default NotificationBell