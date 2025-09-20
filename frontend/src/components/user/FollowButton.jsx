import { useState } from 'react'
import { Button, useToast } from '@chakra-ui/react'
import { FiUserPlus, FiUserMinus } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

const FollowButton = ({
  userId,
  isFollowing = false,
  onFollowChange = null,
  size = "sm",
  variant = "outline"
}) => {
  const { user, token } = useAuth()
  const [following, setFollowing] = useState(isFollowing)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleFollowToggle = async () => {
    if (!token || !user) {
      toast({
        title: 'Hata',
        description: 'Takip etmek için giriş yapmanız gerekiyor',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    if (user.id === userId) {
      toast({
        title: 'Hata',
        description: 'Kendinizi takip edemezsiniz',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setLoading(true)

    try {
      const method = following ? 'DELETE' : 'POST'
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        const newFollowingState = !following
        setFollowing(newFollowingState)

        // Notify parent component
        if (onFollowChange) {
          onFollowChange(newFollowingState)
        }

        toast({
          title: 'Başarılı',
          description: newFollowingState ? 'Kullanıcı takip edildi' : 'Takip bırakıldı',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } else {
        throw new Error(data.error?.message || 'İşlem başarısız')
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  // Don't show follow button if user is viewing their own profile
  if (user && user.id === userId) {
    return null
  }

  return (
    <Button
      size={size}
      variant={following ? "solid" : variant}
      colorScheme={following ? "red" : "brand"}
      leftIcon={following ? <FiUserMinus /> : <FiUserPlus />}
      onClick={handleFollowToggle}
      isLoading={loading}
      loadingText={following ? "Bırakılıyor..." : "Takip ediliyor..."}
    >
      {following ? 'Takibi Bırak' : 'Takip Et'}
    </Button>
  )
}

export default FollowButton