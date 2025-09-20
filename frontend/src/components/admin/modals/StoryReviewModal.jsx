import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Avatar,
  Text,
  Badge,
  Divider,
  Box,
  Textarea,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';

const StoryReviewModal = ({ isOpen, onClose, story, onUpdate }) => {
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleApprove = async () => {
    try {
      setLoading(true);

      // Mock approval - in real implementation would call API
      const updatedStory = { ...story, status: 'APPROVED' };
      onUpdate(updatedStory);

      toast({
        title: 'Başarılı',
        description: `"${story.title}" hikayesi onaylandı`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Hikaye onaylanamadı',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);

      // Mock rejection - in real implementation would call API
      const updatedStory = { ...story, status: 'REJECTED' };
      onUpdate(updatedStory);

      toast({
        title: 'Başarılı',
        description: `"${story.title}" hikayesi reddedildi`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Hikaye reddedilemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'yellow';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return 'Onaylandı';
      case 'REJECTED': return 'Reddedildi';
      default: return 'Bekliyor';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const isPending = story?.status === 'PENDING';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>Hikaye İnceleme</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={6} align="start">
            {/* Story Info */}
            <VStack align="start" spacing={3} w="full">
              <HStack justify="space-between" w="full">
                <Text fontSize="xl" fontWeight="bold">
                  {story?.title}
                </Text>
                <Badge colorScheme={getStatusColor(story?.status)}>
                  {getStatusText(story?.status)}
                </Badge>
              </HStack>

              <HStack spacing={3}>
                <Avatar size="sm" name={story?.authorNickname} src={story?.authorAvatar} />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">{story?.authorNickname}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {formatDate(story?.createdAt)}
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={4}>
                <Text fontSize="sm" color="gray.600">
                  Görüntüleme: {story?.viewCount}
                </Text>
              </HStack>
            </VStack>

            <Divider />

            {/* Story Content */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Hikaye İçeriği
              </Text>
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                border="1px"
                borderColor="gray.200"
                maxH="300px"
                overflowY="auto"
              >
                <Text whiteSpace="pre-wrap" lineHeight="tall">
                  {story?.content}
                </Text>
              </Box>
            </Box>

            {/* Review Guidelines */}
            <Alert status="info">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">
                  İnceleme Kriterleri:
                </Text>
                <Text fontSize="sm">
                  • İçerik kadın deneyimlerine odaklı mı?
                  <br />• Saygılı ve yapıcı bir dil kullanılmış mı?
                  <br />• Topluluk kurallarına uygun mu?
                  <br />• Spam veya zararlı içerik var mı?
                </Text>
              </VStack>
            </Alert>

            {/* Review Note */}
            {isPending && (
              <VStack align="start" spacing={2} w="full">
                <Text fontWeight="medium">Değerlendirme Notu (Opsiyonel):</Text>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Bu hikaye hakkında notlarınızı yazabilirsiniz..."
                  rows={3}
                />
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Kapat
            </Button>
            {isPending && (
              <>
                <Button
                  colorScheme="red"
                  onClick={handleReject}
                  isLoading={loading}
                  loadingText="Reddediliyor..."
                >
                  Reddet
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleApprove}
                  isLoading={loading}
                  loadingText="Onaylanıyor..."
                >
                  Onayla
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StoryReviewModal;