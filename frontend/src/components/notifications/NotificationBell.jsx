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
  Divider
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiBell } from 'react-icons/fi'
import useNotifications from '../../hooks/useNotifications'
import NotificationList from './NotificationList'

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead
  } = useNotifications({ limit: 5 })

  const displayCount = unreadCount > 9 ? '9+' : unreadCount

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
          color="gray.600"
        />
        {unreadCount > 0 && (
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
      </MenuButton>
      <MenuList minW="320px" p={0} shadow="lg">
        <Box px={4} py={3} borderBottomWidth="1px">
          <HStack justify="space-between">
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.800">
                Bildirimler
              </Text>
              <Text fontSize="xs" color="gray.500">
                Son 5 bildirim, {unreadCount} okunmamış
              </Text>
            </Box>
            <Button size="xs" variant="ghost" onClick={markAllRead} isDisabled={unreadCount === 0}>
              Tümünü oku
            </Button>
          </HStack>
        </Box>
        <Box px={3} py={3} maxH="360px" overflowY="auto">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            onMarkRead={markRead}
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
