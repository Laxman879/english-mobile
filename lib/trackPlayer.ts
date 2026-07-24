import TrackPlayer, {
  Capability,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';

let ready = false;

// Initialise the player once. Safe to call repeatedly.
export async function setupPlayer(): Promise<void> {
  if (ready) return;
  try {
    await TrackPlayer.setupPlayer();
  } catch {
    // Already initialised in a previous mount — ignore.
  }
  await TrackPlayer.updateOptions({
    android: {
      // Keep playing (and keep the notification) even if the app is swiped away.
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
  });
  ready = true;
}

// Google Translate's free TTS endpoint (<=200 chars per request).
export function ttsUrl(text: string, lang: string): string {
  const q = encodeURIComponent(text.slice(0, 200));
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
    lang,
  )}&q=${q}`;
}
