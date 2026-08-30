import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Sparkles, Users, ArrowRight, Disc3, Radio, Music, ShieldCheck, Wifi, WifiOff } from 'lucide-react-native';
import { ConnectionStatus } from '../services/socketService';

interface LobbyScreenProps {
  onCreateRoom: (hostName: string, hostAvatar: string, roomName: string) => void;
  onJoinRoom: (roomCode: string, name: string, avatar: string) => void;
  isLoading: boolean;
  error?: string | null;
  serverUrl: string;
  connectionStatus: ConnectionStatus;
  onUpdateServerUrl: (url: string) => void;
}

const AVATARS = ['🎧', '⚡', '🔥', '🕺', '💃', '🚀', '🐱', '🕶️', '👑', '👽', '👾', '🌈', '💎', '🎉'];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading,
  error,
  serverUrl,
  connectionStatus,
  onUpdateServerUrl,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎧');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);

  const isConnected = connectionStatus === 'connected';

  const handleCreate = () => {
    if (!userName.trim()) return;
    onCreateRoom(userName.trim(), selectedAvatar, roomName.trim());
  };

  const handleJoin = () => {
    if (!userName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), userName.trim(), selectedAvatar);
  };

  const handleSaveServerUrl = () => {
    if (!customUrl.trim()) return;
    onUpdateServerUrl(customUrl.trim());
    setShowServerConfig(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Server Status Header Bar */}
        <View style={styles.serverStatusContainer}>
          <TouchableOpacity
            onPress={() => setShowServerConfig(!showServerConfig)}
            style={[
              styles.serverBadge,
              isConnected ? styles.serverBadgeConnected : styles.serverBadgeDisconnected,
            ]}
          >
            {isConnected ? <Wifi size={12} color="#10b981" /> : <WifiOff size={12} color="#f43f5e" />}
            <Text style={[styles.serverText, isConnected ? styles.serverTextGreen : styles.serverTextRed]}>
              {isConnected ? 'Server Connected' : 'Server Disconnected • Tap to configure IP'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Server IP Config Accordion */}
        {showServerConfig && (
          <View style={styles.configBox}>
            <Text style={styles.configLabel}>BACKEND SERVER URL (LAN IP for phone):</Text>
            <TextInput
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="http://192.168.1.X:3001"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              style={styles.configInput}
            />
            <TouchableOpacity onPress={handleSaveServerUrl} style={styles.configSaveBtn}>
              <Text style={styles.configSaveText}>Save & Reconnect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Disc3 size={32} color="#fff" />
          </View>
          <Text style={styles.appTitle}>RAVE MUSIC</Text>
          <Text style={styles.appSubtitle}>Synchronized Watch Party & Audio Sync</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Mode Switch Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              onPress={() => setMode('create')}
              style={[styles.modeTab, mode === 'create' && styles.modeTabActive]}
            >
              <Sparkles size={14} color={mode === 'create' ? '#fff' : '#94a3b8'} />
              <Text style={[styles.modeTabText, mode === 'create' && styles.modeTabTextActive]}>
                Create Party
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('join')}
              style={[styles.modeTab, mode === 'join' && styles.modeTabActive]}
            >
              <Users size={14} color={mode === 'join' ? '#fff' : '#94a3b8'} />
              <Text style={[styles.modeTabText, mode === 'join' && styles.modeTabTextActive]}>
                Join with Code
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Nickname Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>YOUR NICKNAME</Text>
            <TextInput
              value={userName}
              onChangeText={setUserName}
              placeholder="e.g. DJ Spark, Sarah, Alex"
              placeholderTextColor="#64748b"
              style={styles.input}
            />
          </View>

          {/* Avatar Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SELECT YOUR AVATAR</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((av) => (
                <TouchableOpacity
                  key={av}
                  onPress={() => setSelectedAvatar(av)}
                  style={[styles.avatarBtn, selectedAvatar === av && styles.avatarBtnActive]}
                >
                  <Text style={styles.avatarEmoji}>{av}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode Specific Input */}
          {mode === 'create' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ROOM NAME (OPTIONAL)</Text>
              <TextInput
                value={roomName}
                onChangeText={setRoomName}
                placeholder="e.g. Chill Lo-Fi Lounge"
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>6-DIGIT ROOM CODE</Text>
              <TextInput
                value={roomCode}
                onChangeText={(t) => setRoomCode(t.toUpperCase())}
                maxLength={6}
                placeholder="e.g. RAVE89"
                placeholderTextColor="#64748b"
                autoCapitalize="characters"
                style={[styles.input, styles.roomCodeInput]}
              />
            </View>
          )}

          {/* Submit Action Button */}
          <TouchableOpacity
            onPress={mode === 'create' ? handleCreate : handleJoin}
            disabled={isLoading || !userName.trim() || (mode === 'join' && !roomCode.trim())}
            style={[
              styles.submitBtn,
              (isLoading || !userName.trim() || (mode === 'join' && !roomCode.trim())) &&
                styles.submitBtnDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.submitRow}>
                <Text style={styles.submitBtnText}>
                  {mode === 'create' ? 'Launch Watch Party' : 'Enter Party Room'}
                </Text>
                <ArrowRight size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Feature Badges */}
        <View style={styles.featuresRow}>
          <View style={styles.featureBadge}>
            <Radio size={14} color="#06b6d4" />
            <Text style={styles.featureText}>Speaker Sync</Text>
          </View>
          <View style={styles.featureBadge}>
            <Music size={14} color="#8b5cf6" />
            <Text style={styles.featureText}>Audio-First</Text>
          </View>
          <View style={styles.featureBadge}>
            <ShieldCheck size={14} color="#10b981" />
            <Text style={styles.featureText}>Host Master</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 20 : 10,
  },
  serverStatusContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  serverBadgeConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  serverBadgeDisconnected: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  serverText: {
    fontSize: 11,
    fontWeight: '700',
  },
  serverTextGreen: {
    color: '#10b981',
  },
  serverTextRed: {
    color: '#f43f5e',
  },
  configBox: {
    backgroundColor: '#13131d',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27273d',
    gap: 8,
  },
  configLabel: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
  },
  configInput: {
    backgroundColor: '#1b1b2a',
    borderWidth: 1,
    borderColor: '#27273d',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 12,
  },
  configSaveBtn: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  configSaveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  appTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#13131d',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27273d',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0f',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#8b5cf6',
  },
  modeTabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#fff',
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#1b1b2a',
    borderWidth: 1,
    borderColor: '#27273d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#f8fafc',
    fontSize: 13,
  },
  roomCodeInput: {
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'space-between',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1b1b2a',
    borderWidth: 1,
    borderColor: '#27273d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: '#8b5cf6',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 6,
  },
  featureBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#13131d',
    borderWidth: 1,
    borderColor: '#27273d',
    paddingVertical: 7,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  featureText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600',
  },
});
