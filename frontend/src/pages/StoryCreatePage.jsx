import { useState, useEffect, useMemo } from 'react'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  FormHelperText,
  FormErrorMessage,
  Alert,
  AlertIcon,
  useToast,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Badge,
  Spinner
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { storyAPI } from '../services/api'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import { MAX_TAGS_PER_STORY, normalizeTag, isDuplicateTag } from '../utils/tagUtils'

const StoryCreatePage = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [selectedTags, setSelectedTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [tagError, setTagError] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [popularTags, setPopularTags] = useState([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false

    const fetchTagSuggestions = async () => {
      setIsLoadingTags(true)
      try {
        const response = await storyAPI.getTagSuggestions()
        if (ignore) return
        setTagSuggestions(response?.suggestions || [])
        setPopularTags(response?.popular || [])
      } catch (error) {
        console.error('Tag suggestions fetch error:', error)
      } finally {
        if (!ignore) {
          setIsLoadingTags(false)
        }
      }
    }

    fetchTagSuggestions()

    return () => {
      ignore = true
    }
  }, [])

  // Form validation
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Başlık gereklidir'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Başlık en az 5 karakter olmalıdır'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Başlık en fazla 200 karakter olabilir'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Hikâye içeriği gereklidir'
    } else if (formData.content.length < 50) {
      newErrors.content = 'Hikâye en az 50 karakter olmalıdır'
    } else if (formData.content.length > 10000) {
      newErrors.content = 'Hikâye en fazla 10.000 karakter olabilir'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleTagInputChange = (event) => {
    setTagInput(event.target.value)
    if (tagError) {
      setTagError('')
    }
  }

  const handleAddTag = (value) => {
    if (!value || !value.trim()) {
      return
    }

    if (selectedTags.length >= MAX_TAGS_PER_STORY) {
      setTagError(`En fazla ${MAX_TAGS_PER_STORY} etiket ekleyebilirsiniz.`)
      return
    }

    const normalized = normalizeTag(value)
    if (!normalized) {
      setTagError('Etiketler 2-30 karakter arasında olmalı.')
      return
    }

    if (isDuplicateTag(selectedTags, normalized.slug)) {
      setTagError('Bu etiket zaten ekli.')
      setTagInput('')
      return
    }

    setSelectedTags(prev => [...prev, normalized])
    setTagInput('')
    setTagError('')
  }

  const handleTagInputKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      handleAddTag(tagInput)
    }
  }

  const handleRemoveTag = (slug) => {
    setSelectedTags(prev => prev.filter(tag => tag.slug !== slug))
    setTagError('')
  }

  const suggestionItems = useMemo(() => (
    (tagSuggestions || []).slice(0, 12)
  ), [tagSuggestions])

  const popularItems = useMemo(() => {
    const suggestionSlugs = new Set((suggestionItems || []).map(item => item.slug))
    const uniquePopular = []

    for (const item of popularTags || []) {
      if (!item || !item.slug || suggestionSlugs.has(item.slug)) {
        continue
      }
      if (uniquePopular.find(pop => pop.slug === item.slug)) {
        continue
      }
      uniquePopular.push(item)
      if (uniquePopular.length >= 12) {
        break
      }
    }

    return uniquePopular
  }, [popularTags, suggestionItems])

  const remainingTagSlots = MAX_TAGS_PER_STORY - selectedTags.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await storyAPI.create({
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: selectedTags.map(tag => tag.name)
      })

      const createdStory = response?.story

      if (!response?.success || !createdStory) {
        throw new Error(response?.error?.message || 'Hikâye oluşturulamadı')
      }

      toast({
        title: 'Başarılı!',
        description: 'Hikâyen başarıyla paylaşıldı.',
        status: 'success',
        duration: 5000,
        isClosable: true
      })

      setFormData({ title: '', content: '' })
      setErrors({})
      setSelectedTags([])
      setTagInput('')
      setTagError('')

      const storyIdentifier = createdStory.slug || createdStory.id
      navigate(`/hikayeler/${storyIdentifier}`)

    } catch (error) {
      const message = error?.response?.data?.error?.message || error.message || 'Bir hata oluştu'
      toast({
        title: 'Hata oluştu',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <Container maxW="container.md" py={8}>
          <VStack spacing={8} align="stretch">
            {/* Back Button */}
            <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            colorScheme="brand"
            as={RouterLink}
            to="/"
            size="sm"
          >
            Ana Sayfaya Dön
          </Button>
        </Box>

        {/* Page Header */}
        <VStack spacing={4} textAlign="center">
          <Heading as="h1" size="xl" color="brand.500">
            Hikâyeni Paylaş
          </Heading>
          <Text color="gray.600" maxW="lg">
            Merhaba {user?.nickname}! Hikâyeni burada paylaşabilirsin.
          </Text>
        </VStack>

        {/* Privacy Notice */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontWeight="bold" fontSize="sm">
              Gizlilik Güvencesi
            </Text>
            <Text fontSize="sm">
              Hikâyen "{user?.nickname}" kullanıcı adıyla paylaşılacak. 
              Kişisel bilgilerin güvende kalır ve hiçbir şekilde paylaşılmaz.
            </Text>
          </VStack>
        </Alert>

        {/* Story Form */}
        <Box bg="white" p={8} borderRadius="lg" shadow="sm">
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Title Field */}
              <FormControl isRequired isInvalid={!!errors.title}>
                <FormLabel>Hikâye Başlığı</FormLabel>
                <Input 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Hikâyen için çekici bir başlık seç"
                  size="lg"
                />
                {errors.title ? (
                  <FormErrorMessage>{errors.title}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    {formData.title.length}/200 karakter
                  </FormHelperText>
                )}
              </FormControl>

              {/* Content Field */}
              <FormControl isRequired isInvalid={!!errors.content}>
                <FormLabel>Hikâyeni Anlat</FormLabel>
                <Textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Hikâyeni burada paylaş. Yaşadıklarını, düşüncelerini, deneyimlerini özgürce anlat..."
                  minHeight="300px"
                  resize="vertical"
                  size="lg"
                />
                {errors.content ? (
                  <FormErrorMessage>{errors.content}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    {formData.content.length}/10.000 karakter. En az 50 karakter gerekli.
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl isInvalid={!!tagError}>
                <FormLabel>Etiketler (opsiyonel)</FormLabel>
                <FormHelperText>
                  Hikâyeni daha görünür kılmak için en fazla {MAX_TAGS_PER_STORY} etiket ekleyebilirsin.
                </FormHelperText>
                <Input
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Etiket ekle ve Enter'a bas"
                />
                {tagError ? (
                  <FormErrorMessage>{tagError}</FormErrorMessage>
                ) : (
                  <FormHelperText>{remainingTagSlots} etiket hakkın kaldı.</FormHelperText>
                )}

                {selectedTags.length > 0 && (
                  <Wrap mt={3} spacing={2}>
                    {selectedTags.map(tag => (
                      <WrapItem key={tag.slug}>
                        <Tag colorScheme="accent" borderRadius="full" px={3} py={1}>
                          <TagLabel>{tag.name}</TagLabel>
                          <TagCloseButton onClick={() => handleRemoveTag(tag.slug)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}

                <Box mt={4}>
                  <HStack spacing={2} alignItems="center">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      Önerilen etiketler
                    </Text>
                    {suggestionItems.length > 0 && (
                      <Badge colorScheme="gray" fontSize="0.7rem">
                        {suggestionItems.length}
                      </Badge>
                    )}
                  </HStack>

                  {isLoadingTags ? (
                    <HStack spacing={2} mt={2} color="gray.500">
                      <Spinner size="sm" />
                      <Text fontSize="sm">Öneriler yükleniyor…</Text>
                    </HStack>
                  ) : (
                    <Wrap mt={2} spacing={2}>
                      {suggestionItems.length === 0 ? (
                        <WrapItem>
                          <Text fontSize="sm" color="gray.500">
                            Şu anda öneri bulunmuyor.
                          </Text>
                        </WrapItem>
                      ) : (
                        suggestionItems.map(item => {
                          const selected = isDuplicateTag(selectedTags, item.slug)
                          return (
                            <WrapItem key={`suggestion-${item.slug}`}>
                              <Tag
                                as="button"
                                type="button"
                                role="button"
                                aria-pressed={selected}
                                variant={selected ? 'solid' : 'subtle'}
                                colorScheme="accent"
                                cursor="pointer"
                                onClick={() => handleAddTag(item.name)}
                              >
                                <TagLabel>{item.name}</TagLabel>
                              </Tag>
                            </WrapItem>
                          )
                        })
                      )}
                    </Wrap>
                  )}

                  {popularItems.length > 0 && (
                    <Box mt={3}>
                      <HStack spacing={2} alignItems="center">
                        <Text fontSize="sm" fontWeight="medium" color="gray.600">
                          Sık kullanılanlar
                        </Text>
                        <Badge colorScheme="gray" fontSize="0.7rem">
                          {popularItems.length}
                        </Badge>
                      </HStack>
                      <Wrap mt={2} spacing={2}>
                        {popularItems.map(item => {
                          const selected = isDuplicateTag(selectedTags, item.slug)
                          return (
                            <WrapItem key={`popular-${item.slug}`}>
                              <Tag
                                as="button"
                                type="button"
                                role="button"
                                aria-pressed={selected}
                                variant={selected ? 'solid' : 'outline'}
                                colorScheme={selected ? 'accent' : 'gray'}
                                cursor="pointer"
                                onClick={() => handleAddTag(item.name)}
                              >
                                <TagLabel>{item.name}</TagLabel>
                                {item.usageCount ? (
                                  <Badge ml={2} colorScheme={selected ? 'whiteAlpha' : 'gray'} fontSize="0.6rem">
                                    {item.usageCount}
                                  </Badge>
                                ) : null}
                              </Tag>
                            </WrapItem>
                          )
                        })}
                      </Wrap>
                    </Box>
                  )}
                </Box>
              </FormControl>

              {/* Submit Buttons */}
              <HStack spacing={4} justify="flex-end" pt={4}>
                <Button 
                  variant="outline" 
                  colorScheme="gray"
                  as={RouterLink}
                  to="/"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  colorScheme="brand" 
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Paylaşılıyor..."
                  px={8}
                >
                  Hikâyemi Paylaş
                </Button>
              </HStack>
            </VStack>
          </form>
        </Box>

        {/* Additional Info */}
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            Hikâyen paylaşıldıktan sonra ana sayfada görünecek ve diğer kullanıcılar okuyabilecek.
          </Text>
        </Alert>
      </VStack>
    </Container>
    </ProtectedRoute>
  )
}

export default StoryCreatePage
