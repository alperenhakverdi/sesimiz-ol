import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  HStack,
  Text,
  VStack,
  useDisclosure,
  Badge,
  Box,
  Image
} from '@chakra-ui/react'
import { ChevronDownIcon, AddIcon, SettingsIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginModal from './LoginModal'

const AuthButton = ({ size = "md", variant = "outline" }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null
    // Handle base64 data URLs directly
    if (avatarPath.startsWith('data:image/')) return avatarPath
    // Handle HTTP URLs directly  
    if (avatarPath.startsWith('http')) return avatarPath
    // Handle relative paths
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${avatarPath}`
  }

  if (!isAuthenticated) {
    return (
      <>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="accent"
          variant={variant}
          size={size}
          onClick={onOpen}
        >
          Giriş Yap
        </Button>
        
        <LoginModal isOpen={isOpen} onClose={onClose} />
      </>
    )
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant="ghost"
        size={size}
        px={2}
      >
        <HStack spacing={3}>
          {user.avatar ? (
            <Box position="relative">
              <Image
                src={getAvatarUrl(user.avatar)}
                alt={`${user.nickname} profil fotoğrafı`}
                boxSize="32px"
                borderRadius="full"
                objectFit="cover"
                fallback={<Avatar size="sm" name={user.nickname} bg="brand.100" color="brand.500" />}
              />
            </Box>
          ) : (
            <Avatar 
              size="sm" 
              name={user.nickname}
              bg="brand.100"
              color="brand.500"
            />
          )}
          <VStack spacing={0} align="start">
            <Text fontSize="sm" fontWeight="medium" color="neutral.800">
              @{user.nickname}
            </Text>
            {user.email && (
              <Text fontSize="xs" color="neutral.500">
                {user.email}
              </Text>
            )}
          </VStack>
        </HStack>
      </MenuButton>
      
      <MenuList>
        <MenuItem isDisabled>
          <VStack spacing={1} align="start">
            <Text fontWeight="medium">@{user.nickname}</Text>
            <Text fontSize="xs" color="neutral.500">
              {user.email || 'Email adresi yok'}
            </Text>
          </VStack>
        </MenuItem>
        
        <MenuDivider />
        
        <MenuItem as={Link} to="/ayarlar" icon={<SettingsIcon />}>
          Ayarlar
        </MenuItem>
        
        <MenuDivider />
        
        <MenuItem onClick={logout} color="red.600">
          Çıkış Yap
        </MenuItem>
      </MenuList>
    </Menu>
  )
}

export default AuthButton