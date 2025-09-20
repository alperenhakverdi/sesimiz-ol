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
  Text,
  Radio,
  RadioGroup,
  Alert,
  AlertIcon,
  Box,
  Badge,
  useToast
} from '@chakra-ui/react';

const BulkStoryActionsModal = ({ isOpen, onClose, selectedStoryIds, stories, onUpdate }) => {
  const [action, setAction] = useState('approve');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const selectedStories = stories.filter(story => selectedStoryIds.includes(story.id));
  const pendingStories = selectedStories.filter(story => story.status === 'PENDING');

  const handleBulkAction = async () => {
    try {
      setLoading(true);

      // Mock bulk action - in real implementation would call API
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const updatedStories = pendingStories.map(story => ({
        ...story,
        status: newStatus
      }));

      onUpdate(updatedStories);

      const actionText = action === 'approve' ? 'onaylandı' : 'reddedildi';
      toast({
        title: 'Başarılı',
        description: `${updatedStories.length} hikaye ${actionText}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Bulk story action failed:', error)
      toast({
        title: 'Hata',
        description: error.message || 'Toplu işlem başarısız',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusSummary = () => {
    const pending = selectedStories.filter(s => s.status === 'PENDING').length;
    const approved = selectedStories.filter(s => s.status === 'APPROVED').length;
    const rejected = selectedStories.filter(s => s.status === 'REJECTED').length;
    return { pending, approved, rejected };
  };

  const statusSummary = getStatusSummary();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Toplu Hikaye İşlemi</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="start">
            {/* Selection Summary */}
            <Box w="full">
              <Text fontWeight="medium" mb={2}>
                Seçilen Hikayeler: {selectedStoryIds.length}
              </Text>
              <HStack spacing={3}>
                {statusSummary.pending > 0 && (
                  <Badge colorScheme="yellow">
                    {statusSummary.pending} Bekleyen
                  </Badge>
                )}
                {statusSummary.approved > 0 && (
                  <Badge colorScheme="green">
                    {statusSummary.approved} Onaylı
                  </Badge>
                )}
                {statusSummary.rejected > 0 && (
                  <Badge colorScheme="red">
                    {statusSummary.rejected} Reddedilmiş
                  </Badge>
                )}
              </HStack>
            </Box>

            {/* Action Selection */}
            {pendingStories.length > 0 ? (
              <VStack align="start" spacing={3} w="full">
                <Text fontWeight="medium">
                  {pendingStories.length} bekleyen hikaye için işlem seçin:
                </Text>
                <RadioGroup value={action} onChange={setAction}>
                  <VStack align="start" spacing={3}>
                    <Radio value="approve">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" color="green.600">
                          Toplu Onayla
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Seçilen bekleyen hikayeleri onayla
                        </Text>
                      </VStack>
                    </Radio>
                    <Radio value="reject">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" color="red.600">
                          Toplu Reddet
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Seçilen bekleyen hikayeleri reddet
                        </Text>
                      </VStack>
                    </Radio>
                  </VStack>
                </RadioGroup>
              </VStack>
            ) : (
              <Alert status="warning">
                <AlertIcon />
                Seçilen hikayelerin hiçbiri bekleyen durumda değil.
              </Alert>
            )}

            {/* Warning */}
            {pendingStories.length > 0 && (
              <Alert status="warning">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Dikkat!
                  </Text>
                  <Text fontSize="sm">
                    Bu işlem geri alınamaz. {pendingStories.length} hikaye{' '}
                    {action === 'approve' ? 'onaylanacak' : 'reddedilecek'}.
                  </Text>
                </VStack>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            İptal
          </Button>
          <Button
            colorScheme={action === 'approve' ? 'green' : 'red'}
            onClick={handleBulkAction}
            isLoading={loading}
            loadingText="İşleniyor..."
            isDisabled={pendingStories.length === 0}
          >
            {action === 'approve' ? 'Onayla' : 'Reddet'} ({pendingStories.length})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BulkStoryActionsModal;
