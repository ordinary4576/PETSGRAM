import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import io from 'socket.io-client';
import { Send, Image as ImageIcon } from 'lucide-react-native';

const SOCKET_SERVER_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://10.0.2.2:5000';

export default function ChatScreen() {
  const { user } = useAuthStore();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  // Mock list of conversation rooms for mapping selection inbox
  const conversationsList = [
    { id: 'room_1', name: 'Valley Animal Rescue Shelter', lastMessage: 'Ziggy is highly active!', avatar: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=100' },
    { id: 'room_2', name: 'Foster Home Jordan', lastMessage: 'Are the vaccine sheets cleared?', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100' }
  ];

  // A. Initialize WebSocket connection on room join
  useEffect(() => {
    if (!activeConversation) return;

    // Establish WebSocket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      forceNew: true
    });

    const socket = socketRef.current;

    // Join room
    socket.emit('join_room', activeConversation);

    // Initial dummy historic messages setup
    setMessages([
      { id: 'msg_init', text: 'Hello! Thanks for reaching out regarding active fosters.', senderId: 'other', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
    ]);

    // Handle receiving messages
    socket.on('message_received', (message: any) => {
      setMessages((prev) => [...prev, {
        id: message.id,
        text: message.text,
        senderId: message.senderId,
        createdAt: message.createdAt
      }]);
    });

    // Handle typing indicators status update
    socket.on('typing_status', (data: { isTyping: boolean; senderName: string }) => {
      if (data.isTyping) {
        setTypingStatus(`${data.senderName} is writing...`);
      } else {
        setTypingStatus(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeConversation]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;

    const payload = {
      conversationId: activeConversation!,
      senderId: user?.id || 'usr_client_anon',
      text: inputText.trim()
    };

    // Emit message to server WebSocket channel
    socketRef.current.emit('send_message', payload);

    // Optimistic update locally
    setMessages((prev) => [...prev, {
      id: 'optimistic_' + Math.random().toString(),
      text: inputText.trim(),
      senderId: user?.id || 'usr_client_anon',
      createdAt: new Date().toISOString()
    }]);

    // Emit typing status cleared
    socketRef.current.emit('typing', { conversationId: activeConversation!, senderName: user?.name || 'User', isTyping: false });
    setInputText('');
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (socketRef.current && activeConversation) {
      socketRef.current.emit('typing', {
        conversationId: activeConversation,
        senderName: user?.name || 'User',
        isTyping: text.length > 0
      });
    }
  };

  const renderMessageItem = ({ item }: any) => {
    const isMe = item.senderId === (user?.id || 'usr_client_anon');
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    );
  };

  // Render Conversations Inbox if no active chat
  if (!activeConversation) {
    return (
      <View style={styles.inboxContainer}>
        <Text style={styles.inboxTitle}>Inbox Threads</Text>
        <FlatList
          data={conversationsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.inboxItem} onPress={() => setActiveConversation(item.id)}>
              <Image source={{ uri: item.avatar }} style={styles.inboxAvatar} />
              <View style={styles.inboxDetails}>
                <Text style={styles.inboxName}>{item.name}</Text>
                <Text style={styles.inboxText} numberOfLines={1}>{item.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No messages active.</Text>
            </View>
          }
        />
      </View>
    );
  }

  // Active Chats conversation window
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setActiveConversation(null)}>
          <Text style={styles.backLink}>← Inbox</Text>
        </TouchableOpacity>
        <Text style={styles.chatTitle}>Active Conversation</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesList}
      />

      {typingStatus && (
        <View style={styles.typingStatusContainer}>
          <Text style={styles.typingText}>{typingStatus}</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn}>
          <ImageIcon color="#8e8276" size={22} />
        </TouchableOpacity>
        <TextInput
          style={styles.chatInput}
          placeholder="Type cozy message..."
          placeholderTextColor="#8e8276"
          value={inputText}
          onChangeText={handleTextChange}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
          <Send color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inboxContainer: {
    flex: 1,
    backgroundColor: '#faf6f0',
    padding: 16
  },
  inboxTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4a3f35',
    marginBottom: 16
  },
  inboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eae3db',
    marginBottom: 12,
    gap: 12
  },
  inboxAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eae3db'
  },
  inboxDetails: {
    flex: 1,
    gap: 4
  },
  inboxName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a3f35'
  },
  inboxText: {
    fontSize: 12,
    color: '#8e8276'
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#faf6f0'
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#eae3db'
  },
  backLink: {
    color: '#d97452',
    fontWeight: 'bold',
    fontSize: 14
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4a3f35'
  },
  messagesList: {
    padding: 16,
    gap: 12
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    gap: 4
  },
  myBubble: {
    backgroundColor: '#d97452',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2
  },
  theirBubble: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#eae3db'
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18
  },
  myMessageText: {
    color: '#ffffff'
  },
  theirMessageText: {
    color: '#4a3f35'
  },
  timeText: {
    fontSize: 9,
    alignSelf: 'flex-end',
    color: '#eae3db'
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#eae3db',
    gap: 8
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#faf6f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#4a3f35',
    maxHeight: 80
  },
  attachBtn: {
    padding: 8
  },
  sendBtn: {
    backgroundColor: '#d97452',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  typingStatusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#faf6f0'
  },
  typingText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#8e8276'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64
  },
  emptyText: {
    fontSize: 13,
    color: '#8e8276',
    fontWeight: '600'
  }
});
