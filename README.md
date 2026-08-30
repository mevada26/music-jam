# 🎵 Rave Music – Synchronized Watch Party & Music Streaming

A full-featured, **100% free**, real-time synchronized music and watch-party application inspired by **Rave**.

Includes both a **Native React Native Mobile App** (`mobile/`) and a **Web Client** (`client/`) powered by a unified **Realtime Backend** (`server/`).

---

## 🌟 Key Features

1. **🎧 Audio-First Playback + Native Background Mode:**
   - Plays audio streams with high-resolution YouTube artwork and animated equalizer visualizer.
   - Built with native background audio (`expo-av` / `MediaSession`) for lock-screen and screen-off playback.
2. **👁️ "Watch Video" Seamless Toggle:**
   - 1-tap button to watch the YouTube video at the exact current millisecond without desyncing or restarting.
3. **👑 Host Master Authority:**
   - Host has master control: Play, Pause, Seek, Skip, and Queue management.
   - Prevents guests from accidentally skipping or pausing the music.
4. **💬 Interactive Live Chat & Song Suggestions:**
   - Real-time text messaging with user avatars and emojis.
   - Listeners can search and suggest YouTube songs directly into chat.
   - Suggestions appear as **rich interactive cards** with thumbnails and live **`👍 Upvote`** counters.
   - Host gets 1-tap **`➕ Add to Queue`** and **`▶ Play Next`** buttons on cards.
5. **🔊 Speaker Sync (Sub-Millisecond Multi-Device Audio Sync):**
   - High-precision **NTP (Cristian's algorithm)** calculates clock drift and round-trip latency.
   - Micro-rate adjustments ($\pm 1\%$) seamlessly align multiple phones/devices into a unified loudspeaker system without stutter.
6. **🤖 Smart Auto-Queue (YouTube Algorithm):**
   - When the queue runs empty, an intelligent recommendation engine queries related songs based on artist/genres and keeps the music playing forever.
7. **💰 100% Free Stack:**
   - Zero paid API keys, zero third-party subscription costs.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Install all dependencies (Server + Mobile + Web)
npm run install:all
```

### 2. Start Backend Server
```bash
npm run dev:server
```
* Backend starts at `http://localhost:3001` with WebSockets and YouTube search API.

### 3. Run the Mobile App (React Native)
```bash
npm run dev:mobile
```
* Opens the Expo Developer CLI. Scan the QR code with **Expo Go** on your Android or iPhone!
* Or run directly on an emulator:
  * Android: `npm run dev:android`
  * iOS: `npm run dev:ios`

### 4. Run the Web App (Optional for browser testing)
```bash
npm run dev:client
```
* Opens the web app at `http://localhost:3000`.
