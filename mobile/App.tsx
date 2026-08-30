import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { mobileSocketService, ConnectionStatus } from './src/services/socketService';
import { Room, Participant, ChatMessage } from './src/types';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { RoomScreen } from './src/screens/RoomScreen';

export default function App() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>(mobileSocketService.getServerUrl());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    mobileSocketService.getConnectionStatus()
  );

  useEffect(() => {
    // Connect to backend server
    mobileSocketService.connect();

    const unsubscribe = mobileSocketService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateServerUrl = (newUrl: string) => {
    setServerUrl(newUrl);
    mobileSocketService.setServerUrl(newUrl);
    setErrorMessage(null);
  };

  const handleCreateRoom = async (hostName: string, hostAvatar: string, roomName: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await mobileSocketService.createRoom(hostName, hostAvatar, roomName);
      if (response && response.success) {
        setCurrentRoom(response.room);
        setCurrentParticipant(response.participant);
        setMessages(response.messages || []);
      } else {
        setErrorMessage('Failed to create room. Please verify backend server is running.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomCode: string, name: string, avatar: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await mobileSocketService.joinRoom(roomCode, name, avatar);
      if (response && response.success && response.room && response.participant) {
        setCurrentRoom(response.room);
        setCurrentParticipant(response.participant);
        setMessages(response.messages || []);
      } else {
        setErrorMessage(response?.error || 'Invalid Room Code or room has expired.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error joining room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setCurrentParticipant(null);
    setMessages([]);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.container}>
        {currentRoom && currentParticipant ? (
          <RoomScreen
            room={currentRoom}
            currentParticipant={currentParticipant}
            messages={messages}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : (
          <LobbyScreen
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            isLoading={isLoading}
            error={errorMessage}
            serverUrl={serverUrl}
            connectionStatus={connectionStatus}
            onUpdateServerUrl={handleUpdateServerUrl}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 44,
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
});
