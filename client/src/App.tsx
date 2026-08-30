import React, { useState, useEffect } from 'react';
import { socketService } from './services/socketService';
import { Room, Participant, ChatMessage } from './types';
import { LobbyScreen } from './screens/LobbyScreen';
import { RoomScreen } from './screens/RoomScreen';

export function App() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Connect to WebSocket backend
    const socket = socketService.connect();

    // Check URL parameters for direct room join links (e.g., http://localhost:3000/?room=RAVE89)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      console.log('Room link detected:', roomParam);
    }

    return () => {
      // Clean up
    };
  }, []);

  const handleCreateRoom = async (hostName: string, hostAvatar: string, roomName: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await socketService.createRoom(hostName, hostAvatar, roomName);
      if (response && response.success) {
        setCurrentRoom(response.room);
        setCurrentParticipant(response.participant);
        setMessages(response.messages || []);
        window.history.pushState({}, '', `?room=${response.room.code}`);
      } else {
        setErrorMessage('Failed to create room. Please check backend connection.');
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
      const response = await socketService.joinRoom(roomCode, name, avatar);
      if (response && response.success && response.room && response.participant) {
        setCurrentRoom(response.room);
        setCurrentParticipant(response.participant);
        setMessages(response.messages || []);
        window.history.pushState({}, '', `?room=${response.room.code}`);
      } else {
        setErrorMessage(response?.error || 'Invalid Room Code or room has ended.');
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
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-rave-bg text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
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
        />
      )}
    </div>
  );
}

export default App;
