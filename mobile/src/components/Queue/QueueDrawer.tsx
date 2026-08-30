import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import { ListMusic, Trash2, Sparkles, History, Play, Music } from 'lucide-react-native';
import { Track, Participant } from '../../types';
import { mobileSocketService } from '../../services/socketService';

interface QueueDrawerProps {
  queue: Track[];
  history: Track[];
  currentTrack: Track | null;
  currentParticipant: Participant | null;
  autoQueueEnabled: boolean;
  onRemoveFromQueue: (index: number) => void;
  onPlayTrack?: (track: Track) => void;
  onOpenSearch: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  queue,
  history,
  currentTrack,
  currentParticipant,
  autoQueueEnabled,
  onRemoveFromQueue,
  onPlayTrack,
  onOpenSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const isHost = currentParticipant?.role === 'host';

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!currentTrack || queue.length > 2) return;
    const serverUrl = mobileSocketService.getServerUrl();
    fetch(`${serverUrl}/api/recommendations/${currentTrack.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.recommendations) {
          setRecommendations(data.recommendations.slice(0, 3));
        }
      })
      .catch(() => {});
  }, [currentTrack, queue.length]);

  return (
    <View style={styles.container}>
      {/* Tabs Header */}
      <View style={styles.header}>
        <View style={styles.tabGroup}>
          <TouchableOpacity
            onPress={() => setActiveTab('queue')}
            style={[styles.tabBtn, activeTab === 'queue' && styles.tabBtnActive]}
          >
            <ListMusic size={13} color={activeTab === 'queue' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === 'queue' && styles.tabTextActive]}>
              Queue ({queue.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          >
            <History size={13} color={activeTab === 'history' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History ({history.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onOpenSearch} style={styles.addBtn}>
          <Music size={12} color="#cbd5e1" />
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'queue' ? (
          queue.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ListMusic size={32} color="#64748b" />
              <Text style={styles.emptyTitle}>Queue is empty</Text>
              <Text style={styles.emptySubtitle}>
                {autoQueueEnabled
                  ? 'Auto-Queue will automatically play recommended songs'
                  : 'Search songs or accept chat suggestions to queue'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={queue}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item, index }) => (
                <View style={styles.trackCard}>
                  <Text style={styles.queueIndex}>{index + 1}</Text>
                  <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                  <View style={styles.trackInfo}>
                    <Text numberOfLines={1} style={styles.title}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.artist}>
                      {item.artist}
                    </Text>
                    <Text style={styles.duration}>⏱️ {formatDuration(item.duration)}</Text>
                  </View>
                  {isHost && (
                    <TouchableOpacity
                      onPress={() => onRemoveFromQueue(index)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={15} color="#f43f5e" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              contentContainerStyle={{ gap: 8 }}
            />
          )
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item, index) => `hist-${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.trackCard}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                <View style={styles.trackInfo}>
                  <Text numberOfLines={1} style={styles.title}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.artist}>
                    {item.artist}
                  </Text>
                </View>
                {isHost && onPlayTrack && (
                  <TouchableOpacity
                    onPress={() => onPlayTrack(item)}
                    style={styles.replayBtn}
                  >
                    <Play size={12} color="#cbd5e1" fill="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            contentContainerStyle={{ gap: 8 }}
          />
        )}
      </View>
    </View>
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
    padding: 10,
    backgroundColor: '#1b1b2a',
    borderBottomWidth: 1,
    borderBottomColor: '#27273d',
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0f',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1b1b2a',
    borderWidth: 1,
    borderColor: '#27273d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b2a',
    borderRadius: 14,
    padding: 8,
    gap: 8,
  },
  queueIndex: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0f0f13',
  },
  trackInfo: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  artist: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1,
  },
  duration: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  replayBtn: {
    backgroundColor: '#13131d',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27273d',
  },
});
