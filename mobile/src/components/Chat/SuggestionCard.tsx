import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ThumbsUp, Plus, Play, Check, X, Sparkles, Crown } from 'lucide-react-native';
import { SongSuggestion, Participant } from '../../types';

interface SuggestionCardProps {
  suggestion: SongSuggestion;
  currentParticipant: Participant | null;
  onUpvote: (suggestionId: string) => void;
  onResolve: (suggestionId: string, action: 'add_to_queue' | 'play_next' | 'reject') => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  currentParticipant,
  onUpvote,
  onResolve,
}) => {
  const isHost = currentParticipant?.role === 'host';
  const hasUpvoted = currentParticipant ? suggestion.upvotes.includes(currentParticipant.id) : false;
  const track = suggestion.track;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Sparkles size={12} color="#06b6d4" />
          <Text style={styles.badgeText}>Song Suggestion</Text>
        </View>
        <Text style={styles.suggestedByText}>
          by <Text style={styles.suggestedByName}>{suggestion.suggestedBy.name}</Text>
        </Text>
      </View>

      {/* Track Info */}
      <View style={styles.trackRow}>
        <Image source={{ uri: track.thumbnail }} style={styles.thumbnail} />

        <View style={styles.trackDetails}>
          <Text numberOfLines={1} style={styles.title}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {track.artist}
          </Text>
          <Text style={styles.duration}>⏱️ {formatDuration(track.duration)} • YouTube</Text>
        </View>

        {/* Upvote Button */}
        <TouchableOpacity
          onPress={() => onUpvote(suggestion.id)}
          style={[styles.upvoteBtn, hasUpvoted && styles.upvoteBtnActive]}
        >
          <ThumbsUp size={14} color={hasUpvoted ? '#8b5cf6' : '#94a3b8'} />
          <Text style={[styles.upvoteCount, hasUpvoted && styles.upvoteCountActive]}>
            {suggestion.upvotes.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer / Host Actions */}
      <View style={styles.footer}>
        {suggestion.status === 'accepted' ? (
          <View style={styles.acceptedBadge}>
            <Check size={12} color="#10b981" />
            <Text style={styles.acceptedText}>Added to Playlist by Host</Text>
          </View>
        ) : suggestion.status === 'rejected' ? (
          <View style={styles.rejectedBadge}>
            <X size={12} color="#f43f5e" />
            <Text style={styles.rejectedText}>Declined by Host</Text>
          </View>
        ) : isHost ? (
          <View style={styles.hostActionsRow}>
            <Text style={styles.hostLabel}>
              <Crown size={11} color="#f59e0b" /> Host Actions:
            </Text>
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                onPress={() => onResolve(suggestion.id, 'play_next')}
                style={styles.playNextBtn}
              >
                <Play size={10} color="#06b6d4" fill="#06b6d4" />
                <Text style={styles.playNextText}>Play Next</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onResolve(suggestion.id, 'add_to_queue')}
                style={styles.addQueueBtn}
              >
                <Plus size={12} color="#fff" />
                <Text style={styles.addQueueText}>Add</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onResolve(suggestion.id, 'reject')}
                style={styles.rejectBtn}
              >
                <X size={13} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.waitingText}>
            Waiting for Host approval ({suggestion.upvotes.length} votes)
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1b1b2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 12,
    marginVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '700',
  },
  suggestedByText: {
    color: '#64748b',
    fontSize: 10,
  },
  suggestedByName: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0f0f13',
  },
  trackDetails: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  artist: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  duration: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  upvoteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#13131d',
    borderWidth: 1,
    borderColor: '#27273d',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 42,
  },
  upvoteBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8b5cf6',
  },
  upvoteCount: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  upvoteCountActive: {
    color: '#8b5cf6',
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#27273d',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 4,
    borderRadius: 8,
  },
  acceptedText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingVertical: 4,
    borderRadius: 8,
  },
  rejectedText: {
    color: '#f43f5e',
    fontSize: 11,
    fontWeight: '700',
  },
  hostActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostLabel: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  playNextText: {
    color: '#06b6d4',
    fontSize: 10,
    fontWeight: '700',
  },
  addQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addQueueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#13131d',
    padding: 5,
    borderRadius: 8,
  },
  waitingText: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
