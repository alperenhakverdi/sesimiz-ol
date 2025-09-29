import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Flex,
  useToast,
  Divider
} from '@chakra-ui/react'
import { FiSearch, FiUsers } from 'react-icons/fi'
import FollowButton from '../components/user/FollowButton'
import { useColorModeValue } from '@chakra-ui/react'

const UsersPage = () => {
  const toast = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Debounced search function
  const searchUsers = useCallback(async (query, page = 1) => {
    if (!query || query.trim().length < 2) {
      setUsers([])
      setSearchPerformed(false)
      return
    }

    setLoading(true)
    setSearchPerformed(true)

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=20`)
      const data = await response.json()

      if (data.success) {
        if (page === 1) {
          setUsers(data.users)
        } else {
          setUsers(prev => [...prev, ...data.users])
        }
        setPagination(data.pagination)
      } else {
        throw new Error(data.error?.message || 'Arama başarısız')
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
  }, [toast])

  // Search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery.trim(), 1)
      } else {
        setUsers([])
        setSearchPerformed(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  const loadMoreUsers = () => {
    if (pagination.page < pagination.pages && !loading) {
      searchUsers(searchQuery.trim(), pagination.page + 1)
    }
  }

  const handleFollowChange = (userId, isFollowing) => {
    // Update local state to reflect follow status change
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? {
            ...user,
            isFollowing,
            stats: {
              ...user.stats,
              followersCount: user.stats.followersCount + (isFollowing ? 1 : -1)
            }
          }
        : user
    ))
  }

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <VStack spacing={3} align="start">
          <HStack spacing={3}>
            <FiUsers size={24} color="var(--chakra-colors-brand-500)" />
            <Text fontSize="2xl" fontWeight="bold" color="neutral.800">
              Kullanıcı Arama
            </Text>
          </HStack>
          <Text fontSize="md" color="neutral.600">
            Diğer kullanıcıları keşfedin ve takip edin
          </Text>
        </VStack>

        {/* Search Input */}
        <Box>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <FiSearch color={useColorModeValue('neutral.600','neutral.400')} />
            </InputLeftElement>
            <Input
              placeholder="Kullanıcı adı veya biyografi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={useColorModeValue('white','neutral.800')}
              borderColor="neutral.300"
              _focus={{
                borderColor: "brand.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)"
              }}
            />
          </InputGroup>
        </Box>

        {/* Search Results */}
        <Box>
          {loading && users.length === 0 && (
            <Flex justify="center" py={8}>
              <Spinner size="lg" color="brand.500" />
            </Flex>
          )}

          {searchPerformed && !loading && users.length === 0 && (
            <Alert status="info">
              <AlertIcon />
              Arama kriterlerinize uygun kullanıcı bulunamadı.
            </Alert>
          )}

          {!searchPerformed && !loading && (
            <Box textAlign="center" py={12}>
              <FiSearch size={48} color={useColorModeValue('#718096','#A0AEC0')} />
              <Text mt={4} color={useColorModeValue('neutral.600','neutral.400')} fontSize="lg">
                Kullanıcı aramak için yukarıdaki arama kutusunu kullanın
              </Text>
              <Text color={useColorModeValue('neutral.600','neutral.400')} fontSize="sm" mt={2}>
                En az 2 karakter girmeniz gerekiyor
              </Text>
            </Box>
          )}

          {users.length > 0 && (
            <VStack spacing={4} align="stretch">
              {users.map((user, index) => (
                <Box key={user.id}>
                  <Box
                    p={4}
                    bg={useColorModeValue('white','neutral.800')}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="neutral.200"
                    _hover={{ borderColor: "neutral.300", shadow: "sm" }}
                    transition="all 0.2s ease-in-out"
                  >
                    <HStack spacing={4} align="start">
                      <Avatar
                        size="lg"
                        name={user.nickname}
                        src={user.avatar}
                        bg="brand.100"
                        color="brand.500"
                      />

                      <VStack align="start" spacing={2} flex={1}>
                        <HStack justify="space-between" w="full">
                          <VStack align="start" spacing={1}>
                            <Text fontSize="lg" fontWeight="semibold" color="neutral.800">
                              @{user.nickname}
                            </Text>
                            {user.bio && (
                              <Text fontSize="sm" color="neutral.600" noOfLines={2}>
                                {user.bio}
                              </Text>
                            )}
                          </VStack>

                          <FollowButton
                            userId={user.id}
                            isFollowing={user.isFollowing}
                            onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                            size="sm"
                          />
                        </HStack>

                        <HStack spacing={4}>
                          <HStack spacing={1}>
                            <Text fontSize="sm" fontWeight="medium" color="neutral.700">
                              {user.stats.storiesCount}
                            </Text>
                            <Text fontSize="sm" color="neutral.500">
                              hikaye
                            </Text>
                          </HStack>

                          <HStack spacing={1}>
                            <Text fontSize="sm" fontWeight="medium" color="neutral.700">
                              {user.stats.followersCount}
                            </Text>
                            <Text fontSize="sm" color="neutral.500">
                              takipçi
                            </Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>

                  {index < users.length - 1 && <Divider />}
                </Box>
              ))}

              {/* Load More Button */}
              {pagination.page < pagination.pages && (
                <Box textAlign="center" pt={4}>
                  <Button
                    onClick={loadMoreUsers}
                    isLoading={loading}
                    loadingText="Yükleniyor..."
                    variant="outline"
                    colorScheme="brand"
                  >
                    Daha Fazla Yükle ({pagination.total - users.length} kaldı)
                  </Button>
                </Box>
              )}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  )
}

export default UsersPage