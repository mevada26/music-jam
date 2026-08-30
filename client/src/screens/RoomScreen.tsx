import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  LogOut,
  Users,
  MessageSquare,
  ListMusic,
  Crown,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Room, Participant, ChatMessage, Track, SyncStats, PlaybackState } from '../types';
import { socketService } from '../services/socketService';
import { audioSyncEngine } from '../services/audioSyncEngine';
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
  const [activeRightTab, setActiveRightTab] = useState<'chat' | 'queue'>('chat');

  // Player state from AudioSyncEngine
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [syncStats, setSyncStats] = useState<SyncStats>(socketService.getSyncStats());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Modals
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Volume & Mute
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const isHost = currentParticipant.role === 'host';

  // Initialize YouTube Audio Engine & Listen for Socket Events
  useEffect(() => {
    audioSyncEngine.init('youtube-sync-player').then(() => {
      audioSyncEngine.applyPlaybackState(room.playbackState);
    });

    const unsubscribe = audioSyncEngine.subscribe((time, dur, _, driftMs) => {
      setCurrentTime(time);
      setDuration(dur);
      setSyncStats((prev) => ({
        ...socketService.getSyncStats(),
        estimatedDrift: driftMs,
      }));
    });

    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('room:updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      if (updatedRoom.participants[currentParticipant.id]) {
        setCurrentParticipant(updatedRoom.participants[currentParticipant.id]);
      }
    });

    socket.on('playback:sync', (newPlaybackState: PlaybackState) => {
      setRoom((prev) => ({ ...prev, playbackState: newPlaybackState }));
      audioSyncEngine.applyPlaybackState(newPlaybackState);
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
      audioSyncEngine.destroy();
    };
  }, []);

  // Copy Room Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Host Playback Actions
  const handlePlay = () => {
    socketService.updatePlayback(room.code, { status: 'PLAYING', currentTime });
  };

  const handlePause = () => {
    socketService.updatePlayback(room.code, { status: 'PAUSED', currentTime });
  };

  const handleSkip = () => {
    socketService.skipTrack(room.code);
  };

  const handleRestart = () => {
    socketService.updatePlayback(room.code, { currentTime: 0, status: 'PLAYING' });
  };

  const handleSeek = (seconds: number) => {
    socketService.updatePlayback(room.code, { currentTime: seconds });
  };

  const handleToggleAutoQueue = () => {
    socketService.toggleAutoQueue(room.code);
  };

  // Chat & Suggestion Actions
  const handleSendMessage = (content: string) => {
    socketService.sendChatMessage(room.code, content);
  };

  const handleSuggestSong = (track: Track) => {
    socketService.suggestSong(room.code, track);
  };

  const handleUpvoteSuggestion = (suggestionId: string) => {
    socketService.upvoteSuggestion(room.code, suggestionId);
  };

  const handleResolveSuggestion = (suggestionId: string, action: 'add_to_queue' | 'play_next' | 'reject') => {
    socketService.resolveSuggestion(room.code, suggestionId, action);
  };

  // Queue Actions
  const handleRemoveFromQueue = (index: number) => {
    socketService.removeFromQueue(room.code, index);
  };

  const handlePlayNow = (track: Track) => {
    socketService.playTrack(room.code, track);
  };

  const handleAddToQueue = (track: Track) => {
    socketService.addToQueue(room.code, track);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioSyncEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    const muted = audioSyncEngine.toggleMute();
    setIsMuted(muted);
  };

  const participantsList = Object.values(room.participants);

  return (
    <div className="min-h-screen bg-rave-bg text-slate-100 flex flex-col">
      {/* Hidden offscreen YouTube player container for seamless audio extraction & sync */}
      <div className="fixed -left-[9999px] -top-[9999px] w-10 h-10 overflow-hidden pointer-events-none opacity-0">
        <div id="youtube-sync-player" />
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 px-4 sm:px-6 py-3 bg-rave-card/90 backdrop-blur-xl border-b border-rave-border flex items-center justify-between">
        {/* Left: Room Title & Code */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎵</span>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-1.5 leading-tight">
                {room.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rave-purple/20 hover:bg-rave-purple/30 border border-rave-purple/40 text-purple-300 font-mono text-[11px] font-bold transition"
                  title="Click to copy Room Code"
                >
                  <span>{room.code}</span>
                  {isCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>

                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {isHost ? '👑 You are Host' : '👥 Listener Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Participant Avatars & Actions */}
        <div className="flex items-center gap-3">
          {/* Active Participants Stacks */}
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-rave-surface border border-rave-border text-xs text-slate-300">
            <Users size={14} className="text-rave-purple" />
            <span className="font-bold">{participantsList.length}</span>
            <div className="flex -space-x-1.5 ml-1">
              {participantsList.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  title={`${p.name} (${p.role})`}
                  className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]"
                >
                  {p.avatar}
                </div>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rave-purple/20 hover:bg-rave-purple/30 text-purple-300 border border-rave-purple/40 text-xs font-semibold transition"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Leave Room */}
          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
            title="Leave Party"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: NOW PLAYING AUDIO-FIRST DECK (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
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
            onSeek={handleSeek}
            onToggleAutoQueue={handleToggleAutoQueue}
            onOpenVideo={() => setIsVideoModalOpen(true)}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            isMuted={isMuted}
            volume={volume}
          />
        </div>

        {/* RIGHT COLUMN: INTERACTIVE TABS (CHAT & QUEUE) (5 Cols on desktop) */}
        <div className="lg:col-span-5 h-[620px] flex flex-col">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-rave-surface border border-rave-border mb-3">
            <button
              onClick={() => setActiveRightTab('chat')}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeRightTab === 'chat'
                  ? 'bg-rave-purple text-white shadow-md glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={14} />
              <span>Live Chat & Suggestions</span>
            </button>

            <button
              onClick={() => setActiveRightTab('queue')}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeRightTab === 'queue'
                  ? 'bg-rave-purple text-white shadow-md glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListMusic size={14} />
              <span>Queue & History ({room.queue.length})</span>
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 overflow-hidden">
            {activeRightTab === 'chat' ? (
              <ChatView
                messages={messages}
                currentParticipant={currentParticipant}
                onSendMessage={handleSendMessage}
                onOpenSuggestModal={() => setIsSearchModalOpen(true)}
                onUpvoteSuggestion={handleUpvoteSuggestion}
                onResolveSuggestion={handleResolveSuggestion}
              />
            ) : (
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
            )}
          </div>
        </div>
      </main>

      {/* Synchronized Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        track={room.playbackState.currentTrack}
        currentTime={currentTime}
      />

      {/* YouTube Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        currentParticipant={currentParticipant}
        onPlayNow={handlePlayNow}
        onAddToQueue={handleAddToQueue}
        onSuggestSong={handleSuggestSong}
      />
    </div>
  );
};
