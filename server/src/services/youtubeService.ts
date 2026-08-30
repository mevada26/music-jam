import ytSearch from 'yt-search';
import { Track } from '../types/index.js';

export class YouTubeService {
  /**
   * Search YouTube for songs/videos
   */
  public static async search(query: string, limit = 15): Promise<Track[]> {
    try {
      const searchResults = await ytSearch(query);
      const videos = searchResults.videos.slice(0, limit);

      return videos.map((v) => ({
        id: v.videoId,
        title: v.title,
        artist: v.author?.name || 'Unknown Artist',
        duration: v.seconds || 0,
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        url: v.url,
        addedAt: Date.now(),
      }));
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  /**
   * Get track metadata by videoId
   */
  public static async getTrackDetails(videoId: string): Promise<Track | null> {
    try {
      const result = await ytSearch({ videoId });
      if (!result) return null;

      return {
        id: result.videoId,
        title: result.title,
        artist: result.author?.name || 'Unknown Artist',
        duration: result.seconds || 0,
        thumbnail: result.thumbnail || `https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`,
        url: result.url,
        addedAt: Date.now(),
      };
    } catch (error) {
      console.error('Error fetching track details for', videoId, error);
      return null;
    }
  }

  /**
   * Resolve high-speed direct audio stream URL with Piped & Invidious multi-cluster
   */
  public static async getDirectAudioUrl(videoId: string): Promise<string | null> {
    // 1. Try High-Speed Piped APIs (Direct audioStreams extraction)
    const pipedEndpoints = [
      `https://pipedapi.kavin.rocks/streams/${videoId}`,
      `https://api.piped.privacydev.net/streams/${videoId}`,
      `https://pipedapi.tokhmi.xyz/streams/${videoId}`,
      `https://piped-api.garudalinux.org/streams/${videoId}`,
    ];

    for (const endpoint of pipedEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(endpoint, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data: any = await res.json();
          if (data.audioStreams && data.audioStreams.length > 0) {
            // Sort by bitrate descending
            data.audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
            const bestStream = data.audioStreams[0]?.url;
            if (bestStream) return bestStream;
          }
        }
      } catch (_) {
        // Try next endpoint
      }
    }

    // 2. Try High-Uptime Invidious Mirrors
    const invidiousEndpoints = [
      `https://inv.nadeko.net/api/v1/videos/${videoId}`,
      `https://yewtu.be/api/v1/videos/${videoId}`,
      `https://invidious.nerdvpn.de/api/v1/videos/${videoId}`,
      `https://invidious.jing.rocks/api/v1/videos/${videoId}`,
      `https://vid.puffyan.us/api/v1/videos/${videoId}`,
    ];

    for (const endpoint of invidiousEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(endpoint, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data: any = await res.json();
          const audioFormats = data.adaptiveFormats?.filter(
            (f: any) =>
              f.type?.startsWith('audio/') ||
              f.container === 'm4a' ||
              f.container === 'webm' ||
              f.container === 'mp4'
          );

          if (audioFormats && audioFormats.length > 0) {
            audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
            const bestAudio = audioFormats[0].url;
            if (bestAudio) return bestAudio;
          }
        }
      } catch (_) {
        // Try next mirror
      }
    }

    return null;
  }

  /**
   * Smart Auto-Queue Recommendation Algorithm (like YouTube's algorithm)
   */
  public static async getRecommendations(currentTrack: Track, playedHistoryIds: string[] = []): Promise<Track[]> {
    try {
      const cleanedTitle = currentTrack.title
        .replace(/\b(official\s*(video|audio|music\s*video|lyric\s*video)?|4k|hd|remastered|lyrics?|full\s*song)\b/gi, '')
        .replace(/[\[\(\{\]\)\}]/g, ' ')
        .trim();

      const searchQuery = `${currentTrack.artist} ${cleanedTitle} similar songs`;
      const searchResults = await ytSearch(searchQuery);

      const historySet = new Set(playedHistoryIds);
      historySet.add(currentTrack.id);

      const candidates = searchResults.videos
        .filter((v) => !historySet.has(v.videoId) && v.seconds > 60 && v.seconds < 900)
        .map((v) => ({
          id: v.videoId,
          title: v.title,
          artist: v.author?.name || 'Unknown Artist',
          duration: v.seconds || 0,
          thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          url: v.url,
          addedAt: Date.now(),
        }));

      return candidates.slice(0, 10);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
}
