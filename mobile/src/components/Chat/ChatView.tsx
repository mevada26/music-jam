import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, Music2, MessageSquare, Crown } from 'lucide-react-native';
import { ChatMessage, Participant, SongSuggestion } from '../../types';
import { SuggestionCard } from './SuggestionCard';

interface ChatViewProps {
  messages: ChatMessage[];
  currentParticipant: Participant | null;
  onSendMessage: (content: string) => void;
  onOpenSuggestModal: () => void;
  onUpvoteSuggestion: (suggestionId: string) => void;
  onResolveSuggestion: (suggestionId: string, action: 'add_to_queue' | 'play_next' | 'reject') => void;
}

const QUICK_EMOJIS = ['🔥', '❤️', '🎵', '🚀', '💃', '🙌', '🎉', '🎧'];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  currentParticipant,
  onSendMessage,
  onOpenSuggestModal,
  onUpvoteSuggestion,
  onResolveSuggestion,
}) => {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'system') {
      return (
        <View style={styles.systemMsgContainer}>
          <Text style={styles.systemMsgText}>{item.content}</Text>
        </View>
      );
    }

    if (item.type === 'suggestion' && item.suggestion) {
      return (
        <SuggestionCard
          suggestion={item.suggestion}
          currentParticipant={currentParticipant}
          onUpvote={onUpvoteSuggestion}
          onResolve={onResolveSuggestion}
        />
      );
    }

    const isMe = currentParticipant?.id === item.senderId;
    const isHost = item.senderRole === 'host';

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.senderAvatar || '🎵'}</Text>
          </View>
        )}

        <View style={[styles.bubbleWrapper, isMe && styles.bubbleWrapperMe]}>
          <View style={styles.senderHeader}>
            <Text style={styles.senderName}>{item.senderName}</Text>
            {isHost && (
              <View style={styles.hostMiniBadge}>
                <Crown size={9} color="#f59e0b" />
                <Text style={styles.hostMiniText}>Host</Text>
              </View>
            )}
          </View>

          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.msgContent, isMe ? styles.msgContentMe : styles.msgContentOther]}>
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 95 : 20}
      style={styles.container}
    >
      {/* Chat Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageSquare size={16} color="#8b5cf6" />
          <Text style={styles.headerTitle}>Live Room Chat</Text>
        </View>

        <TouchableOpacity onPress={onOpenSuggestModal} style={styles.suggestBtn}>
          <Music2 size={13} color="#fff" />
          <Text style={styles.suggestBtnText}>Suggest Song</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />

      {/* Quick Emojis Bar */}
      <View style={styles.emojiRow}>
        {QUICK_EMOJIS.map((em) => (
          <TouchableOpacity
            key={em}
            onPress={() => onSendMessage(em)}
            style={styles.emojiBtn}
          >
            <Text style={styles.emojiText}>{em}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input Bar */}
      <View style={styles.inputRow}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message or share thoughts..."
          placeholderTextColor="#64748b"
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim()}
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
        >
          <Send size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13131d',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27273d',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1b1b2a',
    borderBottomWidth: 1,
    borderBottomColor: '#27273d',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  suggestBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    gap: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  systemMsgContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemMsgText: {
    color: '#94a3b8',
    fontSize: 11,
    backgroundColor: '#1e1e2e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    textAlign: 'center',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1b1b2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
  },
  bubbleWrapper: {
    maxWidth: '78%',
  },
  bubbleWrapperMe: {
    alignItems: 'flex-end',
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  senderName: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  hostMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hostMiniText: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '700',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: '#1b1b2a',
    borderWidth: 1,
    borderColor: '#27273d',
    borderBottomLeftRadius: 2,
  },
  msgContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgContentMe: {
    color: '#fff',
  },
  msgContentOther: {
    color: '#f8fafc',
  },
  emojiRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#171723',
    borderTopWidth: 1,
    borderTopColor: '#27273d',
    gap: 6,
  },
  emojiBtn: {
    padding: 4,
  },
  emojiText: {
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#13131d',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1b1b2a',
    borderWidth: 1,
    borderColor: '#27273d',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
