import ytSearch from 'yt-search';
import { Track } from '../types/index.js';

export class YouTubeService {
  /**
   * Clean and normalize raw YouTube titles to extract readable Song Name & Artist
   */
  public static cleanMetadata(title: string, authorName: string = ''): { cleanTitle: string; cleanArtist: string } {
    let clean = title
      // Remove tags like (Official Video), [4K], (Lyric Video), (Audio), etc.
      .replace(/\s*[\[\(](official\s*(music\s*video|video|audio|lyric\s*video|hd|4k|remastered)?|lyrics?|audio|visualizer|full\s*song)[\]\)]/gi, '')
      .replace(/\|.*$/g, '') // remove trailing channel watermarks e.g. "| T-Series"
      .replace(/\b(4k|hd|remastered|full\s*hd|video|audio)\b/gi, '')
      .trim();

    let cleanArtist = authorName.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim() || 'Unknown Artist';
    let cleanTitle = clean;

    // Detect "Artist - Title" format in video title
    if (clean.includes(' - ')) {
      const parts = clean.split(' - ');
      if (parts.length >= 2) {
        cleanArtist = parts[0].trim();
        cleanTitle = parts.slice(1).join(' - ').trim();
      }
    }

    return { cleanTitle, cleanArtist };
  }

  /**
   * Resolve high-speed direct audio stream URL with public mirror fallback
   */
  public static async getDirectAudioUrl(videoId: string): Promise<string | null> {
    const endpoints = [
      `https://pipedapi.kavin.rocks/streams/${videoId}`,
      `https://api.piped.privacydev.net/streams/${videoId}`,
      `https://inv.nadeko.net/api/v1/videos/${videoId}`,
    ];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(ep, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data: any = await res.json();
          if (data.audioStreams && data.audioStreams[0]?.url) {
            return data.audioStreams[0].url;
          }
          if (data.adaptiveFormats) {
            const aud = data.adaptiveFormats.find((f: any) => f.type?.startsWith('audio/'));
            if (aud?.url) return aud.url;
          }
        }
      } catch (_) {}
    }
    return null;
  }

  /**
   * Search YouTube for songs/videos
   */
  public static async search(query: string, limit = 15): Promise<Track[]> {
    try {
      const searchResults = await ytSearch(`${query} song`);
      const videos = (searchResults.videos || []).filter((v) => v.seconds > 60 && v.seconds < 900); // 1 min to 15 min

      return videos.slice(0, limit).map((v) => {
        const { cleanTitle, cleanArtist } = this.cleanMetadata(v.title, v.author?.name);
        return {
          id: v.videoId,
          title: cleanTitle || v.title,
          artist: cleanArtist || v.author?.name || 'Unknown Artist',
          duration: v.seconds || 0,
          thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          url: v.url,
          addedAt: Date.now(),
        };
      });
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

      const { cleanTitle, cleanArtist } = this.cleanMetadata(result.title, result.author?.name);
      return {
        id: result.videoId,
        title: cleanTitle || result.title,
        artist: cleanArtist || result.author?.name || 'Unknown Artist',
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
   * Smart, High-Relevance Auto-Queue Music Recommendation Algorithm
   * Intelligently discovers hit tracks by the same artist & similar genre tracks
   */
  public static async getRecommendations(currentTrack: Track, playedHistoryIds: string[] = []): Promise<Track[]> {
    try {
      const { cleanTitle, cleanArtist } = this.cleanMetadata(currentTrack.title, currentTrack.artist);
      const historySet = new Set(playedHistoryIds);
      historySet.add(currentTrack.id);

      // Perform parallel high-relevance searches:
      // 1. Same artist top hits
      // 2. Similar songs / playlist radio mix
      const [artistHitsRes, relatedMixRes] = await Promise.allSettled([
        ytSearch(`${cleanArtist} top hit songs audio`),
        ytSearch(`${cleanArtist} ${cleanTitle} radio playlist songs`),
      ]);

      const candidates: Track[] = [];
      const seenIds = new Set<string>();

      const processVideos = (videos: any[]) => {
        for (const v of videos) {
          if (!v || !v.videoId || historySet.has(v.videoId) || seenIds.has(v.videoId)) continue;
          // Filter out full albums (> 10 mins) and micro teasers (< 60 secs)
          if (v.seconds < 75 || v.seconds > 600) continue;

          seenIds.add(v.videoId);
          const meta = this.cleanMetadata(v.title, v.author?.name);

          candidates.push({
            id: v.videoId,
            title: meta.cleanTitle || v.title,
            artist: meta.cleanArtist || v.author?.name || cleanArtist,
            duration: v.seconds || 0,
            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            url: v.url,
            addedAt: Date.now(),
          });
        }
      };

      if (artistHitsRes.status === 'fulfilled' && artistHitsRes.value.videos) {
        processVideos(artistHitsRes.value.videos.slice(0, 10));
      }

      if (relatedMixRes.status === 'fulfilled' && relatedMixRes.value.videos) {
        processVideos(relatedMixRes.value.videos.slice(0, 10));
      }

      // If candidates are sparse, fallback to broad search
      if (candidates.length < 5) {
        const broadRes = await ytSearch(`${cleanTitle} song`);
        if (broadRes && broadRes.videos) {
          processVideos(broadRes.videos.slice(0, 8));
        }
      }

      return candidates.slice(0, 10);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
}
