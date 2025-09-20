import React, { useState, useEffect } from 'react';
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
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';

const FeatureFlagEditModal = ({ isOpen, onClose, flag, onUpdate }) => {
  const [formData, setFormData] = useState({
    enabled: false,
    description: '',
    rolloutStatus: ''
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (flag) {
      setFormData({
        enabled: flag.enabled || false,
        description: flag.description || '',
        rolloutStatus: flag.rolloutStatus || ''
      });
    }
  }, [flag]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/feature-flags/${flag.key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Feature flag güncellenemedi');
      }

      const data = await response.json();

      if (data.success) {
        onUpdate({
          ...flag,
          ...formData
        });

        toast({
          title: 'Başarılı',
          description: `${flag.key} feature flag'ı güncellendi`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        onClose();
      } else {
        throw new Error(data.error?.message || 'Güncelleme başarısız');
      }
    } catch (err) {
      console.error('Update feature flag error:', err);
      toast({
        title: 'Hata',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Feature Flag Düzenle</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="start">
            {/* Flag Info */}
            <VStack align="start" spacing={2} w="full">
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="bold" fontFamily="mono">
                  {flag?.key}
                </Text>
                <Badge variant={flag?.isDefault ? 'outline' : 'solid'}>
                  {flag?.isDefault ? 'Varsayılan' : 'Özelleştirilmiş'}
                </Badge>
              </HStack>
            </VStack>

            {/* Status */}
            <FormControl>
              <FormLabel>Durum</FormLabel>
              <HStack>
                <Switch
                  isChecked={formData.enabled}
                  onChange={(e) => handleInputChange('enabled', e.target.checked)}
                  colorScheme="brand"
                  size="lg"
                />
                <Text fontWeight="medium">
                  {formData.enabled ? 'Aktif' : 'Pasif'}
                </Text>
              </HStack>
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel>Açıklama</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Feature flag açıklaması"
                rows={3}
              />
            </FormControl>

            {/* Rollout Status */}
            <FormControl>
              <FormLabel>Rollout Durumu</FormLabel>
              <Input
                value={formData.rolloutStatus}
                onChange={(e) => handleInputChange('rolloutStatus', e.target.value)}
                placeholder="Örn: %50 kullanıcıya açık, beta testi vb."
              />
            </FormControl>

            {/* Warning */}
            <Alert status="warning">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Dikkat!
                </Text>
                <Text fontSize="sm">
                  Bu feature flag'ın durumunu değiştirmek sistem davranışını anında etkileyebilir.
                  Değişiklik yapmadan önce etkilerini değerlendirin.
                </Text>
              </VStack>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            İptal
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Güncelleniyor..."
          >
            Güncelle
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FeatureFlagEditModal;