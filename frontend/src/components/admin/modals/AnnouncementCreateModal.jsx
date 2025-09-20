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
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  RadioGroup,
  Radio,
  Switch,
  Text,
  Box,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';

const AnnouncementCreateModal = ({ isOpen, onClose, announcement, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GENERAL',
    targetAudience: 'all',
    isScheduled: false,
    scheduledAt: '',
    priority: 'NORMAL'
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const isEdit = !!announcement;

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        type: announcement.type || 'GENERAL',
        targetAudience: announcement.targetAudience || 'all',
        isScheduled: !!announcement.scheduledAt,
        scheduledAt: announcement.scheduledAt ?
          new Date(announcement.scheduledAt).toISOString().slice(0, 16) : '',
        priority: announcement.priority || 'NORMAL'
      });
    } else {
      setFormData({
        title: '',
        content: '',
        type: 'GENERAL',
        targetAudience: 'all',
        isScheduled: false,
        scheduledAt: '',
        priority: 'NORMAL'
      });
    }
  }, [announcement]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Basic validation
      if (!formData.title.trim() || !formData.content.trim()) {
        toast({
          title: 'Hata',
          description: 'Lütfen başlık ve içerik alanlarını doldurun',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (formData.isScheduled && !formData.scheduledAt) {
        toast({
          title: 'Hata',
          description: 'Lütfen zamanlama tarihi seçin',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Calculate recipient count based on target audience
      const getRecipientCount = (audience) => {
        switch (audience) {
          case 'users': return 200;
          case 'organizations': return 15;
          case 'admins': return 5;
          default: return 245; // all
        }
      };

      const announcementData = {
        ...formData,
        status: formData.isScheduled ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: formData.isScheduled ? new Date(formData.scheduledAt).toISOString() : null,
        recipientCount: getRecipientCount(formData.targetAudience),
        ...(isEdit && { id: announcement.id })
      };

      onUpdate(announcementData);

      toast({
        title: 'Başarılı',
        description: isEdit ? 'Duyuru güncellendi' : 'Duyuru oluşturuldu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Save announcement error:', error);
      toast({
        title: 'Hata',
        description: error.message || (isEdit ? 'Duyuru güncellenemedi' : 'Duyuru oluşturulamadı'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getAudienceDescription = (audience) => {
    switch (audience) {
      case 'users': return 'Sadece kullanıcılar (yaklaşık 200 kişi)';
      case 'organizations': return 'Sadece STK\'lar (yaklaşık 15 kuruluş)';
      case 'admins': return 'Sadece adminler (5 kişi)';
      default: return 'Tüm platform kullanıcıları (yaklaşık 245 kişi)';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          {isEdit ? 'Duyuru Düzenle' : 'Yeni Duyuru Oluştur'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="start">
            {/* Basic Information */}
            <FormControl isRequired>
              <FormLabel>Başlık</FormLabel>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Duyuru başlığı"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>İçerik</FormLabel>
              <Textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Duyuru içeriği"
                rows={6}
              />
            </FormControl>

            {/* Type and Priority */}
            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Tip</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="GENERAL">Genel</option>
                  <option value="USER">Kullanıcı</option>
                  <option value="ORGANIZATION">STK</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Öncelik</FormLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  <option value="LOW">Düşük</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil</option>
                </Select>
              </FormControl>
            </HStack>

            {/* Target Audience */}
            <FormControl>
              <FormLabel>Hedef Kitle</FormLabel>
              <RadioGroup
                value={formData.targetAudience}
                onChange={(value) => handleInputChange('targetAudience', value)}
              >
                <VStack align="start" spacing={2}>
                  <Radio value="all">
                    <VStack align="start" spacing={0}>
                      <Text>Herkese</Text>
                      <Text fontSize="sm" color="gray.600">
                        Tüm platform kullanıcıları (yaklaşık 245 kişi)
                      </Text>
                    </VStack>
                  </Radio>
                  <Radio value="users">
                    <VStack align="start" spacing={0}>
                      <Text>Sadece Kullanıcılara</Text>
                      <Text fontSize="sm" color="gray.600">
                        Normal kullanıcılar (yaklaşık 200 kişi)
                      </Text>
                    </VStack>
                  </Radio>
                  <Radio value="organizations">
                    <VStack align="start" spacing={0}>
                      <Text>Sadece STK'lara</Text>
                      <Text fontSize="sm" color="gray.600">
                        Kayıtlı kuruluşlar (yaklaşık 15 kuruluş)
                      </Text>
                    </VStack>
                  </Radio>
                  <Radio value="admins">
                    <VStack align="start" spacing={0}>
                      <Text>Sadece Adminlere</Text>
                      <Text fontSize="sm" color="gray.600">
                        Sistem yöneticileri (5 kişi)
                      </Text>
                    </VStack>
                  </Radio>
                </VStack>
              </RadioGroup>
            </FormControl>

            {/* Scheduling */}
            <FormControl>
              <FormLabel>Zamanlama</FormLabel>
              <VStack align="start" spacing={3}>
                <HStack>
                  <Switch
                    isChecked={formData.isScheduled}
                    onChange={(e) => handleInputChange('isScheduled', e.target.checked)}
                  />
                  <Text>İleri tarihte gönder</Text>
                </HStack>

                {formData.isScheduled && (
                  <Box w="full">
                    <Input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </Box>
                )}
              </VStack>
            </FormControl>

            {/* Summary */}
            <Alert status="info">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Duyuru Özeti:
                </Text>
                <Text fontSize="sm">
                  • Hedef: {getAudienceDescription(formData.targetAudience)}
                  <br />
                  • Durum: {formData.isScheduled ? 'Zamanlanacak' : 'Taslak olarak kaydedilecek'}
                  <br />
                  • Öncelik: {formData.priority === 'HIGH' ? 'Yüksek' : formData.priority === 'URGENT' ? 'Acil' : formData.priority === 'LOW' ? 'Düşük' : 'Normal'}
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
            loadingText={isEdit ? "Güncelleniyor..." : "Oluşturuluyor..."}
          >
            {isEdit ? 'Güncelle' : 'Oluştur'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AnnouncementCreateModal;
