import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Search, X, Play, Plus, Sparkles, Music } from 'lucide-react-native';
import { Track, Participant } from '../../types';
import { mobileSocketService } from '../../services/socketService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParticipant: Participant | null;
  onPlayNow?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onSuggestSong: (track: Track) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  currentParticipant,
  onPlayNow,
  onAddToQueue,
  onSuggestSong,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isHost = currentParticipant?.role === 'host';

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const serverUrl = mobileSocketService.getServerUrl();
        const res = await fetch(`${serverUrl}/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.tracks) {
          setResults(data.tracks);
        }
      } catch (err) {
        console.warn('Mobile search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderTrackItem = ({ item }: { item: Track }) => (
    <View style={styles.trackCard}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />

      <View style={styles.trackInfo}>
        <Text numberOfLines={1} style={styles.trackTitle}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.trackArtist}>
          {item.artist}
        </Text>
        <Text style={styles.trackDuration}>⏱️ {formatDuration(item.duration)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionButtons}>
        {isHost && onPlayNow && (
          <TouchableOpacity
            onPress={() => {
              onPlayNow(item);
              onClose();
            }}
            style={styles.playNowBtn}
          >
            <Play size={12} color="#fff" fill="#fff" />
            <Text style={styles.playNowText}>Play</Text>
          </TouchableOpacity>
        )}

        {isHost && onAddToQueue && (
          <TouchableOpacity
            onPress={() => {
              onAddToQueue(item);
              onClose();
            }}
            style={styles.addQueueBtn}
          >
            <Plus size={16} color="#cbd5e1" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            onSuggestSong(item);
            onClose();
          }}
          style={isHost ? styles.suggestSmallBtn : styles.suggestMainBtn}
        >
          <Sparkles size={12} color={isHost ? '#cbd5e1' : '#fff'} />
          <Text style={isHost ? styles.suggestSmallText : styles.suggestMainText}>Suggest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Music size={18} color="#8b5cf6" />
              <Text style={styles.headerTitle}>Search YouTube</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={16} color="#64748b" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search songs, artists, DJ mixes..."
              placeholderTextColor="#64748b"
              autoFocus
              style={styles.searchInput}
            />
            {isLoading && <ActivityIndicator size="small" color="#8b5cf6" />}
          </View>

          {/* Results */}
          {results.length === 0 && !isLoading ? (
            <View style={styles.emptyContainer}>
              <Sparkles size={32} color="#8b5cf6" />
              <Text style={styles.emptyTitle}>
                {query ? 'No matching songs found' : 'Type to search YouTube music'}
              </Text>
              <Text style={styles.emptySubtitle}>Millions of songs available completely free</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderTrackItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '88%',
    backgroundColor: '#13131d',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#27273d',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#1b1b2a',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#27273d',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 11,
  },
  listContent: {
    paddingBottom: 20,
    gap: 8,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b2a',
    borderRadius: 16,
    padding: 10,
    gap: 10,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0f0f13',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  trackArtist: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  trackDuration: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  playNowText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  addQueueBtn: {
    backgroundColor: '#13131d',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27273d',
  },
  suggestMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  suggestMainText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  suggestSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#13131d',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27273d',
  },
  suggestSmallText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
});
