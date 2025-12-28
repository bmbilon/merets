import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  Provider as PaperProvider,
  Card,
  Text,
  TextInput,
  Button,
  Avatar,
  Chip,
  IconButton,
  Badge,
  Divider,
  FAB
} from 'react-native-paper';

import { SkillId, SKILLS } from '../../lib/systems/skills-system';

// Message types for family chat
export type MessageType = 
  | 'text'
  | 'commitment_request'
  | 'commitment_approved'
  | 'commitment_rejected'
  | 'commitment_completed'
  | 'budget_assigned'
  | 'system_notification';

export interface ChatMessage {
  id: string;
  senderId: string; // 'aveya', 'onyx', 'lauren', 'brett'
  senderName: string;
  recipientId?: string; // For direct messages, undefined for family chat
  type: MessageType;
  content: string;
  timestamp: number;
  
  // For commitment-related messages
  commitmentData?: {
    id?: string;
    title: string;
    details?: string;
    effortMin: number;
    skillId?: SkillId;
    proposedPay?: number; // In cents
    approvedPay?: number;
    date: string;
    status?: 'pending' | 'approved' | 'rejected' | 'completed';
  };
  
  // Message status
  isRead: boolean;
  reactions?: { emoji: string; userId: string }[];
}

export interface FamilyChat {
  messages: ChatMessage[];
  lastActivity: number;
  unreadCount: Record<string, number>; // userId -> unread count
}

// Chat UI Components
interface ChatBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  onCommitmentAction?: (action: 'approve' | 'reject' | 'negotiate', message: ChatMessage) => void;
}

function ChatBubble({ message, isCurrentUser, onCommitmentAction }: ChatBubbleProps) {
  const bubbleColor = isCurrentUser ? '#E91E63' : '#F5F5F5';
  const textColor = isCurrentUser ? 'white' : '#333';
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderCommitmentCard = () => {
    if (!message.commitmentData) return null;
    
    const { title, details, effortMin, skillId, proposedPay, approvedPay, status } = message.commitmentData;
    
    return (
      <View style={{
        backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: isCurrentUser ? 'rgba(255,255,255,0.3)' : '#E0E0E0'
      }}>
        <Text variant="titleMedium" style={{ 
          fontWeight: 'bold',
          color: isCurrentUser ? 'white' : '#333',
          marginBottom: 4
        }}>
          {title}
        </Text>
        
        {details && (
          <Text variant="bodySmall" style={{ 
            color: isCurrentUser ? 'rgba(255,255,255,0.9)' : '#666',
            marginBottom: 8
          }}>
            {details}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <Chip 
            mode="flat" 
            style={{ backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.3)' : '#F0F0F0' }}
            textStyle={{ color: isCurrentUser ? 'white' : '#666', fontSize: 12 }}
          >
            {effortMin} min
          </Chip>
          
          {skillId && (
            <Chip 
              mode="flat"
              style={{ backgroundColor: `${SKILLS[skillId].color}${isCurrentUser ? '60' : '40'}` }}
              textStyle={{ color: isCurrentUser ? 'white' : SKILLS[skillId].color, fontSize: 12 }}
            >
              {SKILLS[skillId].name}
            </Chip>
          )}
          
          {(proposedPay || approvedPay) && (
            <Chip 
              mode="flat"
              style={{ backgroundColor: isCurrentUser ? 'rgba(76, 175, 80, 0.3)' : '#4CAF5020' }}
              textStyle={{ color: isCurrentUser ? 'white' : '#4CAF50', fontSize: 12 }}
            >
              ${((approvedPay || proposedPay || 0) / 100).toFixed(2)}
            </Chip>
          )}
        </View>
        
        {/* Action buttons for parents */}
        {message.type === 'commitment_request' && !isCurrentUser && onCommitmentAction && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button
              mode="contained"
              onPress={() => onCommitmentAction('approve', message)}
              style={{ backgroundColor: '#4CAF50', flex: 1 }}
              labelStyle={{ fontSize: 12 }}
            >
              Approve ✅
            </Button>
            <Button
              mode="outlined"
              onPress={() => onCommitmentAction('negotiate', message)}
              style={{ borderColor: '#FF9800', flex: 1 }}
              textColor="#FF9800"
              labelStyle={{ fontSize: 12 }}
            >
              Negotiate 💬
            </Button>
            <Button
              mode="outlined"
              onPress={() => onCommitmentAction('reject', message)}
              style={{ borderColor: '#F44336', flex: 1 }}
              textColor="#F44336"
              labelStyle={{ fontSize: 12 }}
            >
              Pass ❌
            </Button>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{
      alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
      maxWidth: '80%',
      marginVertical: 4,
      marginHorizontal: 16,
    }}>
      {/* Sender name for received messages */}
      {!isCurrentUser && (
        <Text variant="bodySmall" style={{ 
          color: '#666', 
          marginBottom: 2,
          marginLeft: 12
        }}>
          {message.senderName}
        </Text>
      )}
      
      <View style={{
        backgroundColor: bubbleColor,
        borderRadius: 16,
        padding: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}>
        <Text variant="bodyMedium" style={{ color: textColor }}>
          {message.content}
        </Text>
        
        {renderCommitmentCard()}
        
        <Text variant="bodySmall" style={{ 
          color: isCurrentUser ? 'rgba(255,255,255,0.7)' : '#999',
          marginTop: 4,
          textAlign: 'right'
        }}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

// Quick commitment sender
interface QuickCommitmentProps {
  onSend: (commitment: ChatMessage['commitmentData']) => void;
  senderName: string;
}

function QuickCommitmentSender({ onSend, senderName }: QuickCommitmentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [effortMin, setEffortMin] = useState('30');
  const [selectedSkill, setSelectedSkill] = useState<SkillId | null>(null);

  const handleSend = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'What will you commit to?');
      return;
    }

    const effort = Math.max(5, parseInt(effortMin) || 30);
    const suggestedPay = effort <= 5 ? 300 : Math.round(effort * 50); // $3 for micro-tasks, ~$1.50/min for others

    onSend({
      title: title.trim(),
      details: details.trim() || undefined,
      effortMin: effort,
      skillId: selectedSkill || undefined,
      proposedPay: suggestedPay,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    });

    // Reset form
    setTitle('');
    setDetails('');
    setEffortMin('30');
    setSelectedSkill(null);
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <FAB
        icon="plus"
        label="New Commitment"
        onPress={() => setIsExpanded(true)}
        style={{
          position: 'absolute',
          bottom: 80,
          right: 16,
          backgroundColor: '#E91E63',
        }}
      />
    );
  }

  return (
    <Card style={{ margin: 16, elevation: 4 }}>
      <Card.Content style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#E91E63' }}>
            💬 New Commitment Request
          </Text>
          <IconButton icon="close" onPress={() => setIsExpanded(false)} />
        </View>

        <TextInput
          label="What will you commit to?"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          activeOutlineColor="#E91E63"
        />

        <TextInput
          label="Details (optional)"
          value={details}
          onChangeText={setDetails}
          mode="outlined"
          multiline
          activeOutlineColor="#E91E63"
        />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            label="Minutes"
            value={effortMin}
            onChangeText={setEffortMin}
            mode="outlined"
            keyboardType="numeric"
            style={{ flex: 1 }}
            activeOutlineColor="#E91E63"
          />
          <Button
            mode="outlined"
            onPress={() => {/* TODO: Skill selector */}}
            style={{ flex: 2, justifyContent: 'center' }}
            textColor="#666"
          >
            {selectedSkill ? SKILLS[selectedSkill].name : 'Choose Skill'}
          </Button>
        </View>

        <View style={{
          backgroundColor: '#4CAF5020',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center'
        }}>
          <Text variant="bodyMedium" style={{ color: '#4CAF50', fontWeight: '600' }}>
            Suggested Pay: ${((parseInt(effortMin) <= 5 ? 300 : Math.round((parseInt(effortMin) || 30) * 50)) / 100).toFixed(2)}
          </Text>
          <Text variant="bodySmall" style={{ color: '#666' }}>
            {parseInt(effortMin) <= 5 ? 'Micro-task rate' : 'Standard task rate'}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleSend}
          style={{ backgroundColor: '#E91E63' }}
        >
          Send Request 📤
        </Button>
      </Card.Content>
    </Card>
  );
}

// Main Family Chat Component
interface FamilyChatProps {
  currentUserId: string;
  currentUserName: string;
  onBack: () => void;
}

export default function FamilyChat({ currentUserId, currentUserName, onBack }: FamilyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat messages
  useEffect(() => {
    loadMessages();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem('family_chat');
      if (stored) {
        const chat: FamilyChat = JSON.parse(stored);
        setMessages(chat.messages);
        setUnreadCounts(chat.unreadCount);
      } else {
        // Initialize with welcome messages
        const welcomeMessages: ChatMessage[] = [
          {
            id: 'welcome-1',
            senderId: 'system',
            senderName: 'Kidmitment',
            type: 'system_notification',
            content: 'Welcome to Family Chat! 👨‍👩‍👧‍👦\n\nKids can propose commitments and parents can approve them instantly!',
            timestamp: Date.now() - 1000,
            isRead: true
          }
        ];
        setMessages(welcomeMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessages = async (newMessages: ChatMessage[]) => {
    try {
      const chat: FamilyChat = {
        messages: newMessages,
        lastActivity: Date.now(),
        unreadCount: unreadCounts
      };
      await AsyncStorage.setItem('family_chat', JSON.stringify(chat));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const sendMessage = async (content: string, type: MessageType = 'text', commitmentData?: ChatMessage['commitmentData']) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUserName,
      type,
      content,
      timestamp: Date.now(),
      commitmentData,
      isRead: false
    };

    const newMessages = [...messages, message];
    setMessages(newMessages);
    await saveMessages(newMessages);

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Auto-responses for demo (in real app, this would be handled by other users)
    if (type === 'commitment_request') {
      setTimeout(() => {
        addSystemMessage('📬 Commitment request sent to parents!');
      }, 500);
    }
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'system',
      senderName: 'Kidmitment',
      type: 'system_notification',
      content,
      timestamp: Date.now(),
      isRead: true
    };

    const newMessages = [...messages, systemMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
  };

  const handleCommitmentAction = async (action: 'approve' | 'reject' | 'negotiate', originalMessage: ChatMessage) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let responseContent = '';
    let responseType: MessageType = 'text';

    switch (action) {
      case 'approve':
        responseContent = `✅ Approved! "${originalMessage.commitmentData?.title}" for $${((originalMessage.commitmentData?.proposedPay || 0) / 100).toFixed(2)}`;
        responseType = 'commitment_approved';
        break;
      case 'reject':
        responseContent = `❌ Not this time. "${originalMessage.commitmentData?.title}" - maybe try something smaller?`;
        responseType = 'commitment_rejected';
        break;
      case 'negotiate':
        responseContent = `💬 Let's talk about "${originalMessage.commitmentData?.title}" - can you break it down into smaller tasks?`;
        responseType = 'text';
        break;
    }

    // Parent response (in real app, this would come from actual parent)
    const parentResponse: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'lauren', // Assuming mom responds
      senderName: 'Mom',
      type: responseType,
      content: responseContent,
      timestamp: Date.now(),
      commitmentData: action === 'approve' ? {
        ...originalMessage.commitmentData!,
        status: 'approved',
        approvedPay: originalMessage.commitmentData?.proposedPay
      } : originalMessage.commitmentData,
      isRead: false
    };

    const newMessages = [...messages, parentResponse];
    setMessages(newMessages);
    await saveMessages(newMessages);

    if (action === 'approve') {
      // Show completion celebration
      setTimeout(() => {
        addSystemMessage('🎉 Commitment approved! Get started and earn your reward!');
      }, 1000);
    }
  };

  const handleSendText = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleSendCommitment = (commitmentData: ChatMessage['commitmentData']) => {
    const content = `💼 New commitment request: "${commitmentData?.title}"`;
    sendMessage(content, 'commitment_request', commitmentData);
  };

  const isParent = currentUserId === 'lauren' || currentUserId === 'brett';

  return (
    <PaperProvider>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          backgroundColor: '#E91E63',
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          elevation: 4
        }}>
          <IconButton icon="arrow-left" iconColor="white" onPress={onBack} />
          <Avatar.Icon 
            size={40} 
            icon="chat" 
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={{ color: 'white', fontWeight: 'bold' }}>
              Family Chat
            </Text>
            <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Commitment negotiations & updates
            </Text>
          </View>
          {Object.values(unreadCounts).some(count => count > 0) && (
            <Badge style={{ backgroundColor: '#4CAF50' }}>
              {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
            </Badge>
          )}
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: '#F5F5F5' }}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUserId}
              onCommitmentAction={isParent ? handleCommitmentAction : undefined}
            />
          ))}
        </ScrollView>

        {/* Message Input */}
        <View style={{
          backgroundColor: 'white',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          elevation: 8
        }}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            mode="outlined"
            style={{ flex: 1 }}
            activeOutlineColor="#E91E63"
            multiline
            onSubmitEditing={handleSendText}
          />
          <IconButton
            icon="send"
            mode="contained"
            style={{ backgroundColor: '#E91E63' }}
            iconColor="white"
            onPress={handleSendText}
          />
        </View>

        {/* Quick Commitment Sender (for kids) */}
        {!isParent && (
          <QuickCommitmentSender
            onSend={handleSendCommitment}
            senderName={currentUserName}
          />
        )}
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}