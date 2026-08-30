import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Copy,
  Check,
  LogOut,
  Users,
  MessageSquare,
  ListMusic,
  Search,
  Headphones,
} from 'lucide-react-native';
import { Room, Participant, ChatMessage, Track, SyncStats, PlaybackState } from '../types';
import { mobileSocketService } from '../services/socketService';
import { mobileAudioSyncEngine } from '../services/audioSyncEngine';
import { NowPlayingDeck } from '../components/Player/NowPlayingDeck';
import { VideoModal } from '../components/Player/VideoModal';
import { ChatView } from '../components/Chat/ChatView';
import { QueueDrawer } from '../components/Queue/QueueDrawer';
import { SearchModal } from '../components/Search/SearchModal';

interface RoomScreenProps {
  room: Room;
  currentParticipant: Participant;
  messages: ChatMessage[];
  onLeaveRoom: () => void;
}

export const RoomScreen: React.FC<RoomScreenProps> = ({
  room: initialRoom,
  currentParticipant: initialParticipant,
  messages: initialMessages,
  onLeaveRoom,
}) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [currentParticipant, setCurrentParticipant] = useState<Participant>(initialParticipant);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [activeTab, setActiveTab] = useState<'player' | 'chat' | 'queue'>('player');

  // Player state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [syncStats, setSyncStats] = useState<SyncStats>(mobileSocketService.getSyncStats());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Modals
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  useEffect(() => {
    mobileAudioSyncEngine.setRoomCode(room.code);
    mobileAudioSyncEngine.applyPlaybackState(room.playbackState);

    const unsubscribe = mobileAudioSyncEngine.subscribe((time, dur, isPlay, driftMs) => {
      setCurrentTime(time);
      setDuration(dur);
      setSyncStats((prev) => ({
        ...mobileSocketService.getSyncStats(),
        estimatedDrift: driftMs,
      }));
    });

    const socket = mobileSocketService.getSocket();
    if (!socket) return;

    socket.on('room:updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      if (updatedRoom.participants[currentParticipant.id]) {
        setCurrentParticipant(updatedRoom.participants[currentParticipant.id]);
      }
    });

    socket.on('playback:sync', (newPlaybackState: PlaybackState) => {
      setRoom((prev) => ({ ...prev, playbackState: newPlaybackState }));
      mobileAudioSyncEngine.applyPlaybackState(newPlaybackState);
    });

    socket.on('chat:new_message', (newMsg: ChatMessage) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    socket.on('chat:messages', (allMsgs: ChatMessage[]) => {
      setMessages(allMsgs);
    });

    socket.on('queue:auto_toggled', (enabled: boolean) => {
      setRoom((prev) => ({ ...prev, autoQueueEnabled: enabled }));
    });

    return () => {
      unsubscribe();
      socket.off('room:updated');
      socket.off('playback:sync');
      socket.off('chat:new_message');
      socket.off('chat:messages');
      socket.off('queue:auto_toggled');
      mobileAudioSyncEngine.destroy();
    };
  }, []);

  const handleCopyCode = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Host Playback Actions
  const handlePlay = () => {
    mobileSocketService.updatePlayback(room.code, { status: 'PLAYING', currentTime });
  };

  const handlePause = () => {
    mobileSocketService.updatePlayback(room.code, { status: 'PAUSED', currentTime });
  };

  const handleSkip = () => {
    mobileSocketService.skipTrack(room.code);
  };

  const handleRestart = () => {
    mobileSocketService.updatePlayback(room.code, { currentTime: 0, status: 'PLAYING' });
  };

  const handleToggleAutoQueue = () => {
    mobileSocketService.toggleAutoQueue(room.code);
  };

  // Chat & Suggestion Actions
  const handleSendMessage = (content: string) => {
    mobileSocketService.sendChatMessage(room.code, content);
  };

  const handleSuggestSong = (track: Track) => {
    mobileSocketService.suggestSong(room.code, track);
  };

  const handleUpvoteSuggestion = (suggestionId: string) => {
    mobileSocketService.upvoteSuggestion(room.code, suggestionId);
  };

  const handleResolveSuggestion = (suggestionId: string, action: 'add_to_queue' | 'play_next' | 'reject') => {
    mobileSocketService.resolveSuggestion(room.code, suggestionId, action);
  };

  // Queue Actions
  const handleRemoveFromQueue = (index: number) => {
    mobileSocketService.removeFromQueue(room.code, index);
  };

  const handlePlayNow = (track: Track) => {
    mobileSocketService.playTrack(room.code, track);
  };

  const handleAddToQueue = (track: Track) => {
    mobileSocketService.addToQueue(room.code, track);
  };

  const participantsList = Object.values(room.participants);

  return (
    <View style={styles.container}>
      {/* TOP HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.name}
          </Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.codeBadge}>
            <Text style={styles.codeText}>{room.code}</Text>
            {isCopied ? <Check size={11} color="#10b981" /> : <Copy size={11} color="#cbd5e1" />}
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.userCountBadge}>
            <Users size={12} color="#8b5cf6" />
            <Text style={styles.userCountText}>{participantsList.length}</Text>
          </View>

          {/* Quick Search Button */}
          <TouchableOpacity
            onPress={() => setIsSearchModalOpen(true)}
            style={styles.searchBtn}
          >
            <Search size={14} color="#fff" />
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onLeaveRoom} style={styles.leaveBtn}>
            <LogOut size={16} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ACTIVE SCREEN CONTENT (Persistent View Stacks - Never Unmounts Player) */}
      <View style={styles.mainView}>
        <View style={[styles.tabContent, activeTab !== 'player' && styles.hiddenTab]}>
          <NowPlayingDeck
            playbackState={room.playbackState}
            currentParticipant={currentParticipant}
            currentTime={currentTime}
            duration={duration}
            syncStats={syncStats}
            autoQueueEnabled={room.autoQueueEnabled}
            onPlay={handlePlay}
            onPause={handlePause}
            onSkip={handleSkip}
            onRestart={handleRestart}
            onToggleAutoQueue={handleToggleAutoQueue}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenVideo={() => setIsVideoModalOpen(true)}
            roomCode={room.code}
          />
        </View>

        <View style={[styles.tabContent, activeTab !== 'chat' && styles.hiddenTab]}>
          <ChatView
            messages={messages}
            currentParticipant={currentParticipant}
            onSendMessage={handleSendMessage}
            onOpenSuggestModal={() => setIsSearchModalOpen(true)}
            onUpvoteSuggestion={handleUpvoteSuggestion}
            onResolveSuggestion={handleResolveSuggestion}
          />
        </View>

        <View style={[styles.tabContent, activeTab !== 'queue' && styles.hiddenTab]}>
          <QueueDrawer
            queue={room.queue}
            history={room.history}
            currentTrack={room.playbackState.currentTrack}
            currentParticipant={currentParticipant}
            autoQueueEnabled={room.autoQueueEnabled}
            onRemoveFromQueue={handleRemoveFromQueue}
            onPlayTrack={handlePlayNow}
            onOpenSearch={() => setIsSearchModalOpen(true)}
          />
        </View>
      </View>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('player')}
          style={[styles.navTab, activeTab === 'player' && styles.navTabActive]}
        >
          <Headphones size={18} color={activeTab === 'player' ? '#8b5cf6' : '#94a3b8'} />
          <Text style={[styles.navTabText, activeTab === 'player' && styles.navTabTextActive]}>
            Player
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('chat')}
          style={[styles.navTab, activeTab === 'chat' && styles.navTabActive]}
        >
          <View style={styles.navIconWrapper}>
            <MessageSquare size={18} color={activeTab === 'chat' ? '#8b5cf6' : '#94a3b8'} />
            {messages.length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{messages.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navTabText, activeTab === 'chat' && styles.navTabTextActive]}>
            Live Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('queue')}
          style={[styles.navTab, activeTab === 'queue' && styles.navTabActive]}
        >
          <View style={styles.navIconWrapper}>
            <ListMusic size={18} color={activeTab === 'queue' ? '#8b5cf6' : '#94a3b8'} />
            {room.queue.length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{room.queue.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navTabText, activeTab === 'queue' && styles.navTabTextActive]}>
            Queue ({room.queue.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH MODAL */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        currentParticipant={currentParticipant}
        onPlayNow={handlePlayNow}
        onAddToQueue={handleAddToQueue}
        onSuggestSong={handleSuggestSong}
      />

      {/* WATCH VIDEO MODAL */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        track={room.playbackState.currentTrack}
        currentTime={currentTime}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#13131d',
    borderBottomWidth: 1,
    borderBottomColor: '#27273d',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '50%',
  },
  roomName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeText: {
    color: '#8b5cf6',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1b1b2a',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
  },
  userCountText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#8b5cf6',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  leaveBtn: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  mainView: {
    flex: 1,
    padding: 10,
  },
  tabContent: {
    flex: 1,
  },
  hiddenTab: {
    display: 'none',
  },
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#13131d',
    borderTopWidth: 1,
    borderTopColor: '#27273d',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
    borderRadius: 12,
  },
  navTabActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  navIconWrapper: {
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#8b5cf6',
    borderRadius: 99,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
  },
  badgeCountText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  navTabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  navTabTextActive: {
    color: '#8b5cf6',
    fontWeight: '800',
  },
});
