import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Button,
  Divider,
  Alert,
  AlertIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Card,
  CardBody,
  Badge
} from '@chakra-ui/react';
import AdminLayout from '../components/admin/AdminLayout';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    siteName: 'Sesimiz Ol',
    siteDescription: 'Kadınların sesini duyuran güvenli platform',
    maintenanceMode: false,
    userRegistration: true,
    storyModeration: true,
    emailNotifications: true,
    maxStoriesPerDay: 5,
    maxFileSize: 10,
    featuredStoriesCount: 6,
    homePageAnnouncement: '',
    contactEmail: 'info@sesimizol.com',
    supportEmail: 'destek@sesimizol.com'
  });
  const [systemInfo, setSystemInfo] = useState({
    version: '2.0.0',
    uptime: '15 gün 8 saat',
    databaseSize: '145 MB',
    activeUsers: 89,
    totalStories: 234,
    lastBackup: '2024-01-15 03:00'
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);

      // Mock save - in real implementation would call API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaved(true);
      toast({
        title: 'Başarılı',
        description: 'Ayarlar kaydedildi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Ayarlar kaydedilemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      // Mock backup
      toast({
        title: 'Başarılı',
        description: 'Veritabanı yedeği oluşturuldu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Yedekleme başarısız',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleClearCache = async () => {
    try {
      // Mock cache clear
      toast({
        title: 'Başarılı',
        description: 'Önbellek temizlendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Önbellek temizlenemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <AdminLayout>
      <VStack align="start" spacing={8}>
        <Heading size="lg" color="brand.600">
          Sistem Ayarları
        </Heading>

        {/* System Information */}
        <Card w="full">
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">Sistem Bilgileri</Heading>
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={6} w="full">
                <Stat>
                  <StatLabel>Platform Sürümü</StatLabel>
                  <StatNumber fontSize="lg">{systemInfo.version}</StatNumber>
                  <StatHelpText>
                    <Badge colorScheme="green">Güncel</Badge>
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Çalışma Süresi</StatLabel>
                  <StatNumber fontSize="lg">{systemInfo.uptime}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Veritabanı Boyutu</StatLabel>
                  <StatNumber fontSize="lg">{systemInfo.databaseSize}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Aktif Kullanıcı</StatLabel>
                  <StatNumber fontSize="lg">{systemInfo.activeUsers}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Toplam Hikaye</StatLabel>
                  <StatNumber fontSize="lg">{systemInfo.totalStories}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Son Yedek</StatLabel>
                  <StatNumber fontSize="sm">{systemInfo.lastBackup}</StatNumber>
                </Stat>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* General Settings */}
        <Card w="full">
          <CardBody>
            <VStack align="start" spacing={6}>
              <Heading size="md">Genel Ayarlar</Heading>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                <FormControl>
                  <FormLabel>Site Adı</FormLabel>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>İletişim Email</FormLabel>
                  <Input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Site Açıklaması</FormLabel>
                <Textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ana Sayfa Duyurusu</FormLabel>
                <Textarea
                  value={settings.homePageAnnouncement}
                  onChange={(e) => handleSettingChange('homePageAnnouncement', e.target.value)}
                  placeholder="Ana sayfada gösterilecek duyuru (boş bırakılırsa gösterilmez)"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* Platform Settings */}
        <Card w="full">
          <CardBody>
            <VStack align="start" spacing={6}>
              <Heading size="md">Platform Ayarları</Heading>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                <VStack align="start" spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="maintenance-mode" mb="0">
                      Bakım Modu
                    </FormLabel>
                    <Switch
                      id="maintenance-mode"
                      isChecked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                      colorScheme="red"
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="user-registration" mb="0">
                      Kullanıcı Kaydı
                    </FormLabel>
                    <Switch
                      id="user-registration"
                      isChecked={settings.userRegistration}
                      onChange={(e) => handleSettingChange('userRegistration', e.target.checked)}
                      colorScheme="brand"
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="story-moderation" mb="0">
                      Hikaye Moderasyonu
                    </FormLabel>
                    <Switch
                      id="story-moderation"
                      isChecked={settings.storyModeration}
                      onChange={(e) => handleSettingChange('storyModeration', e.target.checked)}
                      colorScheme="brand"
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="email-notifications" mb="0">
                      Email Bildirimleri
                    </FormLabel>
                    <Switch
                      id="email-notifications"
                      isChecked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      colorScheme="brand"
                    />
                  </FormControl>
                </VStack>

                <VStack align="start" spacing={4}>
                  <FormControl>
                    <FormLabel>Günlük Max Hikaye Sayısı</FormLabel>
                    <Input
                      type="number"
                      value={settings.maxStoriesPerDay}
                      onChange={(e) => handleSettingChange('maxStoriesPerDay', parseInt(e.target.value) || 0)}
                      min="1"
                      max="20"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Max Dosya Boyutu (MB)</FormLabel>
                    <Input
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Öne Çıkan Hikaye Sayısı</FormLabel>
                    <Input
                      type="number"
                      value={settings.featuredStoriesCount}
                      onChange={(e) => handleSettingChange('featuredStoriesCount', parseInt(e.target.value) || 0)}
                      min="3"
                      max="12"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Destek Email</FormLabel>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </SimpleGrid>

              {settings.maintenanceMode && (
                <Alert status="warning">
                  <AlertIcon />
                  Bakım modu aktif! Platform kullanıcıları siteye erişemeyecek.
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* System Actions */}
        <Card w="full">
          <CardBody>
            <VStack align="start" spacing={6}>
              <Heading size="md">Sistem İşlemleri</Heading>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                <Button colorScheme="blue" onClick={handleBackupDatabase}>
                  Veritabanı Yedekle
                </Button>
                <Button colorScheme="orange" onClick={handleClearCache}>
                  Önbellek Temizle
                </Button>
                <Button colorScheme="gray" isDisabled>
                  Log Dosyalarını İndir
                </Button>
              </SimpleGrid>

              <Alert status="info">
                <AlertIcon />
                Sistem işlemleri dikkatli kullanılmalıdır. Önemli değişiklikler öncesi yedek alınması önerilir.
              </Alert>
            </VStack>
          </CardBody>
        </Card>

        {/* Save Button */}
        <HStack spacing={4} w="full" justify="space-between">
          <Box>
            {saved && (
              <Alert status="success" size="sm" w="auto">
                <AlertIcon />
                Ayarlar kaydedildi
              </Alert>
            )}
          </Box>

          <Button
            colorScheme="brand"
            size="lg"
            onClick={handleSaveSettings}
            isLoading={loading}
            loadingText="Kaydediliyor..."
          >
            Ayarları Kaydet
          </Button>
        </HStack>
      </VStack>
    </AdminLayout>
  );
};

export default AdminSettingsPage;