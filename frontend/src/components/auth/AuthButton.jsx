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
  Image,
  useColorModeValue
} from '@chakra-ui/react'
import { ChevronDownIcon, AddIcon, SettingsIcon } from '@chakra-ui/icons'
import { FiUser, FiBookOpen, FiLogOut } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginModal from './LoginModal'
import { ensureAvatar } from '../../utils/avatar'

const AuthButton = ({ size = "md", variant = "outline" }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const textColor = useColorModeValue('neutral.800', 'neutral.100')
  const emailColor = useColorModeValue('neutral.500', 'neutral.400')
  const logoutColor = useColorModeValue('red.600', 'red.400')
  const menuBg = useColorModeValue('white', 'neutral.800')
  const menuBorder = useColorModeValue('neutral.200', 'neutral.600')

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
                src={ensureAvatar(user.avatar, user.nickname)}
                alt={`${user.nickname} profil fotoğrafı`}
                boxSize="32px"
                borderRadius="full"
                objectFit="cover"
                fallback={<Avatar size="sm" name={user.nickname} src={ensureAvatar(null, user.nickname)} bg="brand.100" color="brand.500" />}
              />
            </Box>
          ) : (
            <Avatar 
              size="sm" 
              name={user.nickname}
              src={ensureAvatar(null, user.nickname)}
              bg="brand.100"
              color="brand.500"
            />
          )}
          <VStack spacing={0} align="start">
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              @{user.nickname}
            </Text>
            {user.email && (
              <Text fontSize="xs" color={emailColor}>
                {user.email}
              </Text>
            )}
          </VStack>
        </HStack>
      </MenuButton>
      
      <MenuList bg={menuBg} borderColor={menuBorder}>
        <MenuItem
          as={Link}
          to={`/profil/${user.id}`}
          icon={<FiUser />}
        >
          Profilim
        </MenuItem>

        <MenuItem
          as={Link}
          to={`/profil/${user.id}?section=stories`}
          icon={<FiBookOpen />}
        >
          Hikayelerim
        </MenuItem>

        <MenuDivider />

        <MenuItem as={Link} to="/ayarlar" icon={<SettingsIcon />}>
          Ayarlar
        </MenuItem>

        <MenuDivider />

        <MenuItem onClick={logout} color={logoutColor} icon={<FiLogOut />}>
          Çıkış Yap
        </MenuItem>
      </MenuList>
    </Menu>
  )
}

export default AuthButton
