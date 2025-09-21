import { memo } from 'react'
import { IconButton, useColorMode, useColorModeValue, Tooltip } from '@chakra-ui/react'
import { SunIcon, MoonIcon } from '@chakra-ui/icons'
import { useAuth } from '../../contexts/AuthContext'

const ColorModeToggle = ({ size = 'md', variant = 'ghost', ...props }) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const { user, updateSettings } = useAuth()
  const text = useColorModeValue('dark', 'light')
  const SwitchIcon = useColorModeValue(MoonIcon, SunIcon)

  const handleToggle = () => {
    if (user) {
      const newTheme = colorMode === 'light' ? 'DARK' : 'LIGHT'
      updateSettings({ theme: newTheme })
    } else {
      toggleColorMode()
    }
  }

  return (
    <Tooltip
      label={`${text === 'dark' ? 'Karanlık' : 'Aydınlık'} moda geç`}
      fontSize="sm"
      placement="bottom"
    >
      <IconButton
        size={size}
        variant={variant}
        color="current"
        onClick={handleToggle}
        icon={<SwitchIcon />}
        aria-label={`Switch to ${text} mode`}
        {...props}
      />
    </Tooltip>
  )
}

export default memo(ColorModeToggle)