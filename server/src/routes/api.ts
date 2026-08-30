import { Router, Request, Response } from 'express';
import { YouTubeService } from '../services/youtubeService.js';
import { RoomManager } from '../services/roomManager.js';

export const apiRouter = Router();

/**
 * Health check & server time
 */
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    serverTime: Date.now(),
    service: 'Rave Sync Server',
  });
});

/**
 * Search YouTube
 */
apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query "q" is required' });
    }

    const limit = parseInt(req.query.limit as string) || 15;
    const tracks = await YouTubeService.search(query, limit);
    return res.json({ tracks });
  } catch (error) {
    console.error('API search error:', error);
    return res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

/**
 * Direct Audio Stream Endpoint (For true Background/Lock-Screen playback)
 */
apiRouter.get('/stream/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Video ID required' });
    }

    const audioUrl = await YouTubeService.getDirectAudioUrl(id);
    if (audioUrl) {
      // Redirect directly to high-speed CDN audio stream with native range support
      return res.redirect(audioUrl);
    }

    return res.status(404).json({ error: 'Playable audio format not found' });
  } catch (error) {
    console.error('Stream endpoint error:', error);
    return res.status(500).json({ error: 'Failed to stream audio' });
  }
});

/**
 * Get Track Details
 */
apiRouter.get('/track/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const track = await YouTubeService.getTrackDetails(id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    return res.json({ track });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch track details' });
  }
});

/**
 * Get Recommendations for a Track (Auto-Queue preview)
 */
apiRouter.get('/recommendations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const track = await YouTubeService.getTrackDetails(id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const recommendations = await YouTubeService.getRecommendations(track);
    return res.json({ recommendations });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * Get Room Info
 */
apiRouter.get('/room/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const room = RoomManager.getRoom(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  return res.json({
    code: room.code,
    name: room.name,
    participantCount: Object.keys(room.participants).length,
    currentTrack: room.playbackState.currentTrack,
    status: room.playbackState.status,
  });
});
