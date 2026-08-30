import React, { useState } from 'react';
import { Play, Sparkles, Users, Radio, ArrowRight, Music, Disc3, ShieldCheck } from 'lucide-react';

interface LobbyScreenProps {
  onCreateRoom: (hostName: string, hostAvatar: string, roomName: string) => void;
  onJoinRoom: (roomCode: string, name: string, avatar: string) => void;
  isLoading: boolean;
  error?: string | null;
}

const AVATARS = ['🎧', '⚡', '🔥', '💃', '🚀', '🐱', '🕶️', '👑', '👽', '👾', '💎'];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading,
  error,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎧');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    onCreateRoom(userName.trim(), selectedAvatar, roomName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), userName.trim(), selectedAvatar);
  };

  return (
    <div className="min-h-screen bg-rave-bg flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-rave-purple/20 via-rave-pink/15 to-rave-cyan/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-gradient-to-tr from-rave-purple to-rave-pink shadow-xl glow-purple mb-1">
            <Disc3 size={38} className="text-white animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-rave-purple bg-clip-text text-transparent">
            RAVE MUSIC
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Synchronized Watch Party & High-Fidelity Music Sync
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-rave-card rounded-3xl border border-rave-border shadow-2xl p-6 backdrop-blur-xl relative">
          {/* Switch Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-rave-surface border border-rave-border mb-6">
            <button
              onClick={() => setMode('create')}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'create'
                  ? 'bg-rave-purple text-white shadow-md glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={14} />
              <span>Create Party (Host)</span>
            </button>

            <button
              onClick={() => setMode('join')}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'join'
                  ? 'bg-rave-purple text-white shadow-md glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={14} />
              <span>Join with Code</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-4">
            {/* Nickname */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Your Nickname
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. DJ Spark, Sarah, Alex"
                className="w-full bg-rave-surface border border-rave-border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rave-purple focus:ring-1 focus:ring-rave-purple transition"
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Select Your Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition border ${
                      selectedAvatar === av
                        ? 'bg-rave-purple/30 border-rave-purple shadow-sm scale-105'
                        : 'bg-rave-surface border-rave-border hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Room Specific Fields */}
            {mode === 'create' ? (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Room Name (Optional)
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Saturday Night Chill Beats"
                  className="w-full bg-rave-surface border border-rave-border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rave-purple focus:ring-1 focus:ring-rave-purple transition"
                />
              </div>
            ) : (
              /* Join Room Specific Fields */
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  6-Digit Room Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RAVE89"
                  className="w-full bg-rave-surface border border-rave-border rounded-xl px-4 py-3 text-center tracking-widest font-mono text-base font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rave-purple focus:ring-1 focus:ring-rave-purple transition uppercase"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !userName.trim() || (mode === 'join' && !roomCode.trim())}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rave-purple via-rave-violet to-rave-pink text-white font-bold text-sm shadow-lg shadow-rave-purple/30 glow-purple hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'create' ? 'Launch Watch Party' : 'Enter Party Room'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature badges footer */}
        <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-slate-400">
          <div className="p-2.5 rounded-2xl bg-rave-card/60 border border-rave-border/60">
            <Radio size={16} className="mx-auto mb-1 text-rave-cyan" />
            <span className="font-medium">Speaker Sync</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-rave-card/60 border border-rave-border/60">
            <Music size={16} className="mx-auto mb-1 text-rave-purple" />
            <span className="font-medium">Audio-First</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-rave-card/60 border border-rave-border/60">
            <ShieldCheck size={16} className="mx-auto mb-1 text-emerald-400" />
            <span className="font-medium">Host Master</span>
          </div>
        </div>
      </div>
    </div>
  );
};
