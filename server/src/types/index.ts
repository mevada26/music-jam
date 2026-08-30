export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  duration: number; // in seconds
  thumbnail: string;
  url: string;
  suggestedBy?: {
    id: string;
    name: string;
  };
  addedAt: number;
}

export type ParticipantRole = 'host' | 'listener' | 'system';

export interface Participant {
  id: string; // socket.id
  name: string;
  avatar: string;
  role: ParticipantRole;
  joinedAt: number;
  isSpeakerSyncEnabled: boolean;
  clockOffset: number; // Milliseconds client is offset from server clock
}

export type PlaybackStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'BUFFERING';

export interface PlaybackState {
  status: PlaybackStatus;
  currentTrack: Track | null;
  currentTime: number; // Current playback position in seconds
  serverEpochTime: number; // Server epoch timestamp (ms) when currentTime was sampled
  playbackRate: number; // 1.0 default
}

export interface SongSuggestion {
  id: string;
  track: Track;
  suggestedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  upvotes: string[]; // List of user IDs who upvoted
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: ParticipantRole;
  content: string;
  type: 'text' | 'system' | 'suggestion';
  suggestion?: SongSuggestion;
  timestamp: number;
}

export interface Room {
  code: string;
  name: string;
  hostId: string;
  participants: Record<string, Participant>;
  playbackState: PlaybackState;
  queue: Track[];
  history: Track[];
  autoQueueEnabled: boolean;
  createdAt: number;
}

// NTP Clock Sync packets
export interface NTPRequest {
  clientSendTime: number;
}

export interface NTPResponse {
  clientSendTime: number;
  serverReceiveTime: number;
  serverTransmitTime: number;
}
