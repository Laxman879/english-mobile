import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  State,
  Event,
  useTrackPlayerEvents,
  usePlaybackState,
  useProgress,
  useActiveTrack,
} from 'react-native-track-player';

export type LoopMode = 'none' | 'one' | 'all';

// ─── Setup (call once at app start) ────────────────────────────────────────
export async function setupPlayer() {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 5,
    });
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
      ],
    });
  } catch (e) {
    // Player already set up
  }
}

// ─── Load a playlist of words into the queue ───────────────────────────────
export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  // For TTS-based tracks we store the text to speak
  ttsText: string;
  artwork?: string;
}

export async function loadPlaylist(tracks: AudioTrack[]) {
  await TrackPlayer.reset();
  // react-native-track-player needs a url — we use a silent placeholder
  // Actual audio is driven by TTS service triggered on track change
  const formattedTracks = tracks.map(t => ({
    id: t.id,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // silent fallback
    title: t.title,
    artist: t.artist,
    artwork: t.artwork,
    // Store ttsText as description so we can read it back
    description: t.ttsText,
  }));
  await TrackPlayer.add(formattedTracks);
}

// ─── Loop mode helpers ─────────────────────────────────────────────────────
export async function setLoopMode(mode: LoopMode) {
  switch (mode) {
    case 'one':
      await TrackPlayer.setRepeatMode(RepeatMode.Track);
      break;
    case 'all':
      await TrackPlayer.setRepeatMode(RepeatMode.Queue);
      break;
    default:
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
  }
}

export async function getLoopMode(): Promise<LoopMode> {
  const mode = await TrackPlayer.getRepeatMode();
  if (mode === RepeatMode.Track) return 'one';
  if (mode === RepeatMode.Queue) return 'all';
  return 'none';
}

// ─── Playback controls ─────────────────────────────────────────────────────
export const play    = () => TrackPlayer.play();
export const pause   = () => TrackPlayer.pause();
export const next    = () => TrackPlayer.skipToNext();
export const prev    = () => TrackPlayer.skipToPrevious();
export const seekTo  = (pos: number) => TrackPlayer.seekTo(pos);
export const skipTo  = (index: number) => TrackPlayer.skip(index);
export const stop    = async () => { await TrackPlayer.stop(); await TrackPlayer.reset(); };

// ─── Re-export hooks for use in components ─────────────────────────────────
export {
  usePlaybackState,
  useProgress,
  useActiveTrack,
  useTrackPlayerEvents,
  State,
  Event,
  RepeatMode,
};
