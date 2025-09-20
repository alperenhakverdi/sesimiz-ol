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
  Badge,
  useToast
} from '@chakra-ui/react';

const OrganizationEditModal = ({ isOpen, onClose, organization, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'NGO',
    status: 'PENDING',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    memberCount: 0,
    projectCount: 0
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        type: organization.type || 'NGO',
        status: organization.status || 'PENDING',
        contactPerson: organization.contactPerson || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        memberCount: organization.memberCount || 0,
        projectCount: organization.projectCount || 0
      });
    }
  }, [organization]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Basic validation
      if (!formData.name.trim() || !formData.email.trim() || !formData.contactPerson.trim()) {
        toast({
          title: 'Hata',
          description: 'Lütfen gerekli alanları doldurun',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Mock update - in real implementation would call API
      const updatedOrganization = {
        ...organization,
        ...formData,
        updatedAt: new Date().toISOString()
      };

      onUpdate(updatedOrganization);

      toast({
        title: 'Başarılı',
        description: `${formData.name} güncellendi`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Update organization error:', error);
      toast({
        title: 'Hata',
        description: error.message || 'STK güncellenemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Aktif';
      case 'SUSPENDED': return 'Askıya Alınmış';
      default: return 'Bekliyor';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'SUSPENDED': return 'red';
      default: return 'yellow';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>STK Düzenle</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="start">
            {/* Basic Information */}
            <FormControl isRequired>
              <FormLabel>STK Adı</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="STK adını girin"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Açıklama</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="STK hakkında açıklama"
                rows={3}
              />
            </FormControl>

            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Tip</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="NGO">STK</option>
                  <option value="FOUNDATION">Vakıf</option>
                  <option value="ASSOCIATION">Dernek</option>
                  <option value="COOPERATIVE">Kooperatif</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Durum{' '}
                  <Badge colorScheme={getStatusColor(formData.status)}>
                    {getStatusText(formData.status)}
                  </Badge>
                </FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="PENDING">Bekliyor</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="SUSPENDED">Askıya Alınmış</option>
                </Select>
              </FormControl>
            </HStack>

            {/* Contact Information */}
            <FormControl isRequired>
              <FormLabel>İletişim Kişisi</FormLabel>
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder="İletişim kişisi adı"
              />
            </FormControl>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@ornek.com"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Telefon</FormLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+90 xxx xxx xxxx"
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Website</FormLabel>
              <Input
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://ornek.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Adres</FormLabel>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Adres bilgileri"
                rows={2}
              />
            </FormControl>

            {/* Statistics */}
            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Üye Sayısı</FormLabel>
                <Input
                  type="number"
                  value={formData.memberCount}
                  onChange={(e) => handleInputChange('memberCount', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Proje Sayısı</FormLabel>
                <Input
                  type="number"
                  value={formData.projectCount}
                  onChange={(e) => handleInputChange('projectCount', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </FormControl>
            </HStack>
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

export default OrganizationEditModal;
