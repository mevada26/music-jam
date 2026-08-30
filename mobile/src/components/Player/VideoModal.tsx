import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { X, Tv, ShieldCheck } from 'lucide-react-native';
import { Track } from '../../types';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentTime: number;
}

const AD_BLOCK_INJECTED_JS = `
  (function() {
    const killAds = () => {
      const skipBtns = document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-overlay-close-button');
      skipBtns.forEach(b => {
        if (b && typeof b.click === 'function') b.click();
      });

      const isAd = document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay');
      const video = document.querySelector('video');
      if (isAd && video) {
        video.muted = true;
        video.playbackRate = 16.0;
        if (video.duration && !isNaN(video.duration)) {
          video.currentTime = video.duration;
        }
      }

      const adOverlays = document.querySelectorAll('.ytp-ad-module, .ytp-ad-image-overlay, .ytp-ad-overlay-container, #player-ads');
      adOverlays.forEach(el => { if (el) el.style.display = 'none'; });
    };
    setInterval(killAds, 80);
  })();
  true;
`;

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, track, currentTime }) => {
  if (!track) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Tv size={14} color="#ec4899" />
                <Text style={styles.badgeText}>WATCH VIDEO</Text>
              </View>
              <View style={styles.adFreeBadge}>
                <ShieldCheck size={11} color="#10b981" />
                <Text style={styles.adFreeText}>Ad-Free</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text numberOfLines={1} style={styles.title}>
            {track.title}
          </Text>

          {/* YouTube Video Player */}
          <View style={styles.playerContainer}>
            <YoutubePlayer
              height={220}
              play={true}
              videoId={track.id}
              baseUrl="https://www.youtube-nocookie.com"
              webViewProps={{
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false,
                androidLayerType: 'hardware',
                javaScriptEnabled: true,
                domStorageEnabled: true,
                injectedJavaScript: AD_BLOCK_INJECTED_JS,
              }}
              initialPlayerParams={{
                start: Math.max(0, Math.floor(currentTime)),
                modestbranding: true,
                rel: false,
                playsinline: true,
                iv_load_policy: 3,
              }}
            />
          </View>

          <Text style={styles.footerNote}>
            Synced with room audio • Tap ✕ to return to Audio Mode
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#13131d',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27273d',
    padding: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  badgeText: {
    color: '#ec4899',
    fontSize: 11,
    fontWeight: '700',
  },
  adFreeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  adFreeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1b1b2a',
  },
  title: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  playerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  footerNote: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
});
