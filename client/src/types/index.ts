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
  id: string;
  name: string;
  avatar: string;
  role: ParticipantRole;
  joinedAt: number;
  isSpeakerSyncEnabled: boolean;
  clockOffset: number;
}

export type PlaybackStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'BUFFERING';

export interface PlaybackState {
  status: PlaybackStatus;
  currentTrack: Track | null;
  currentTime: number; // in seconds
  serverEpochTime: number; // ms
  playbackRate: number;
}

export interface SongSuggestion {
  id: string;
  track: Track;
  suggestedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  upvotes: string[];
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

export interface NTPResponse {
  clientSendTime: number;
  serverReceiveTime: number;
  serverTransmitTime: number;
}

export interface SyncStats {
  roundTripTime: number;
  clockOffset: number; // Delta between client clock and server clock
  estimatedDrift: number; // Playback position drift in ms
  isCalibrated: boolean;
}
