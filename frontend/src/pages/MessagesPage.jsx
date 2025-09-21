import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  IconButton,
  useToast,
  Divider,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FiSend, FiMoreVertical, FiSlash, FiSearch } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const MessagesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const scrollToBottom = useCallback(() => {
  setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}, []);

  // Search messages
  const searchMessages = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/messages/search?q=${encodeURIComponent(query)}`);
      if (response.success) {
        setSearchResults(response.messages);
      }
    } catch (error) {
      console.error('Search messages error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchMessages(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMessages]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages');
      if (response.success) {
        setConversations(response.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (userId) => {
    try {
      const response = await api.get(`/messages/${userId}`);
      if (response.success) {
        setMessages(response.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [scrollToBottom]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await api.post('/messages', {
        receiverId: selectedConversation.user.id,
        content: newMessage.trim()
      });

      if (response.success) {
        setMessages(prev => [...prev, response.message]);
        setNewMessage('');
        scrollToBottom();

        // Update conversations list
        fetchConversations();
      } else {
        toast({
          title: 'Hata',
          description: response.error?.message || 'Mesaj gönderilemedi',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Hata',
        description: 'Mesaj gönderilemedi',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Block user
  const blockUser = async (userId) => {
    try {
      const response = await api.post(`/messages/block/${userId}`);
      if (response.success) {
        toast({
          title: 'Başarılı',
          description: 'Kullanıcı engellendi',
          status: 'success',
          duration: 3000,
          isClosable: true
        });

        // Go back to conversations list
        setSelectedConversation(null);
        setMessages([]);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  // Handle conversation selection
  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.user.id);
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
      return 'Az önce';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)} dk önce`;
    } else if (date.toDateString() === now.toDateString()) { // Today
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Initialize and poll conversations/messages
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return () => {};
    }

    let isMounted = true;

    const init = async () => {
      await fetchConversations();
      if (isMounted) {
        setLoading(false);
      }
    };

    init();

    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation.user.id);
      }
    }, 10000);


    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, fetchConversations, fetchMessages, selectedConversation]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="70vh">
        <Spinner size="lg" color="brand.500" />
      </Flex>
    );
  }

  if (!user) {
    return (
      <Box p={6}>
        <Alert status="warning">
          <AlertIcon />
          Mesajlaşma için giriş yapmanız gerekiyor.
        </Alert>
      </Box>
    );
  }

  return (
    <Box h="calc(100vh - 120px)" maxH="700px">
      <Flex h="full">
        {/* Conversations List */}
        <Box
          w={{ base: selectedConversation ? '0' : 'full', md: '300px' }}
          borderRight={{ base: 'none', md: '1px solid' }}
          borderColor="gray.200"
          display={{ base: selectedConversation ? 'none' : 'block', md: 'block' }}
        >
          <Box p={4} borderBottom="1px solid" borderColor="gray.200">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">Mesajlar</Text>
              <IconButton
                size="sm"
                variant="ghost"
                icon={<FiSearch />}
                aria-label="Mesajlarda ara"
                onClick={onSearchOpen}
              />
            </HStack>
          </Box>

          <VStack spacing={0} align="stretch" maxH="calc(100% - 60px)" overflowY="auto">
            {conversations.length === 0 ? (
              <Box p={6} textAlign="center">
                <Text color="gray.500">Henüz mesaj yok</Text>
              </Box>
            ) : (
              conversations.map((conversation) => (
                <Box
                  key={conversation.user.id}
                  p={3}
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  cursor="pointer"
                  bg={selectedConversation?.user.id === conversation.user.id ? 'brand.50' : 'white'}
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => selectConversation(conversation)}
                >
                  <HStack spacing={3}>
                    <Avatar
                      size="sm"
                      name={conversation.user.nickname}
                      src={conversation.user.avatar}
                    />
                    <Box flex={1} minW={0}>
                      <HStack justify="space-between" align="start">
                        <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                          {conversation.user.nickname}
                        </Text>
                        {conversation.unreadCount > 0 && (
                          <Badge colorScheme="brand" fontSize="xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {conversation.lastMessage}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </Box>

        {/* Chat Area */}
        <Box
          flex={1}
          display={{ base: selectedConversation ? 'flex' : 'none', md: 'flex' }}
          flexDirection="column"
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <Box p={4} borderBottom="1px solid" borderColor="gray.200">
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Button
                      size="sm"
                      variant="ghost"
                      display={{ base: 'block', md: 'none' }}
                      onClick={() => setSelectedConversation(null)}
                    >
                      ←
                    </Button>
                    <Avatar
                      size="sm"
                      name={selectedConversation.user.nickname}
                      src={selectedConversation.user.avatar}
                    />
                    <Text fontWeight="medium">
                      {selectedConversation.user.nickname}
                    </Text>
                  </HStack>

                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon={<FiSlash />}
                    aria-label="Kullanıcıyı engelle"
                    onClick={() => blockUser(selectedConversation.user.id)}
                  />
                </HStack>
              </Box>

              {/* Messages */}
              <Box flex={1} overflowY="auto" p={4}>
                <VStack spacing={4} align="stretch">
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      alignSelf={message.senderId === user.id ? 'flex-end' : 'flex-start'}
                      maxW="70%"
                    >
                      <Box
                        bg={message.senderId === user.id ? 'brand.500' : 'gray.100'}
                        color={message.senderId === user.id ? 'white' : 'gray.800'}
                        px={3}
                        py={2}
                        borderRadius="lg"
                        borderBottomRightRadius={message.senderId === user.id ? 'sm' : 'lg'}
                        borderBottomLeftRadius={message.senderId === user.id ? 'lg' : 'sm'}
                      >
                        <Text fontSize="sm">{message.content}</Text>
                      </Box>
                      <Text
                        fontSize="xs"
                        color="gray.400"
                        mt={1}
                        textAlign={message.senderId === user.id ? 'right' : 'left'}
                      >
                        {formatMessageTime(message.createdAt)}
                        {message.senderId === user.id && message.readAt && ' ✓✓'}
                      </Text>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </VStack>
              </Box>

              {/* Message Input */}
              <Box p={4} borderTop="1px solid" borderColor="gray.200">
                <HStack spacing={2}>
                  <Input
                    placeholder="Mesajınızı yazın..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength={1000}
                  />
                  <IconButton
                    icon={<FiSend />}
                    colorScheme="brand"
                    onClick={sendMessage}
                    isLoading={sendingMessage}
                    isDisabled={!newMessage.trim()}
                    aria-label="Mesaj gönder"
                  />
                </HStack>
                <Text fontSize="xs" color="gray.400" mt={1}>
                  {newMessage.length}/1000
                </Text>
              </Box>
            </>
          ) : (
            <Flex justify="center" align="center" h="full">
              <Box textAlign="center">
                <Text fontSize="lg" color="gray.500" mb={2}>
                  Mesajlaşmaya başlamak için bir konuşma seçin
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Sol taraftan bir kullanıcı seçerek mesajlaşabilirsiniz
                </Text>
              </Box>
            </Flex>
          )}
        </Box>

        {/* Search Modal */}
        <Modal isOpen={isSearchOpen} onClose={onSearchClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Mesajlarda Ara</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Mesaj içeriğinde ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>

                {searchLoading && (
                  <Flex justify="center" py={4}>
                    <Spinner size="md" color="brand.500" />
                  </Flex>
                )}

                {searchResults.length > 0 && (
                  <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                    {searchResults.map((message) => (
                      <Box
                        key={message.id}
                        p={3}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        _hover={{ borderColor: "gray.300" }}
                      >
                        <HStack spacing={3} align="start">
                          <Avatar
                            size="sm"
                            name={message.senderId === user.id ? message.receiver.nickname : message.sender.nickname}
                            src={message.senderId === user.id ? message.receiver.avatar : message.sender.avatar}
                          />
                          <VStack align="start" spacing={1} flex={1}>
                            <Text fontSize="sm" fontWeight="medium">
                              {message.senderId === user.id ?
                                `Size → ${message.receiver.nickname}` :
                                `${message.sender.nickname} → Size`
                              }
                            </Text>
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              {message.content}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              {new Date(message.createdAt).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}

                {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
                  <Box textAlign="center" py={8}>
                    <Text color="gray.500">
                      "{searchQuery}" için sonuç bulunamadı
                    </Text>
                  </Box>
                )}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Flex>
    </Box>
  );
};

export default MessagesPage;
