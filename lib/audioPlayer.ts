import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

// A single background-capable queue player built on expo-av.
// Audio keeps playing while the app is backgrounded / screen locked because
// the audio mode sets staysActiveInBackground + the app declares background audio.
// Each queue entry is one short utterance; `displayIdx` maps it back to the
// playlist item it belongs to (a word may have 2 entries: English + Telugu).

export type QueueItem = { text: string; lang: string; displayIdx: number };

// Google Translate's free TTS endpoint. `client=tw-ob` + <=200 chars per call.
function ttsUrl(text: string, lang: string) {
  const q = encodeURIComponent(text.slice(0, 200));
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${q}`;
}

let sound: Audio.Sound | null = null;
let queue: QueueItem[] = [];
let qi = 0;
let stopped = true;
let onDisplay: ((di: number) => void) | null = null;
let onFinish: (() => void) | null = null;

async function configureAudioMode() {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  });
}

async function unload() {
  if (sound) {
    try { await sound.unloadAsync(); } catch {}
    sound = null;
  }
}

async function playCurrent() {
  if (stopped) return;
  if (qi >= queue.length) { stopped = true; onFinish?.(); return; }

  const entry = queue[qi];
  onDisplay?.(entry.displayIdx);
  await unload();

  try {
    const created = await Audio.Sound.createAsync(
      { uri: ttsUrl(entry.text, entry.lang), headers: { 'User-Agent': 'Mozilla/5.0' } },
      { shouldPlay: true },
    );
    sound = created.sound;
    sound.setOnPlaybackStatusUpdate((st) => {
      if (!st.isLoaded) {
        if ((st as { error?: string }).error) advance();
        return;
      }
      if (st.didJustFinish) advance();
    });
  } catch {
    advance();
  }
}

function advance() {
  if (stopped) return;
  qi += 1;
  playCurrent();
}

export const audioPlayer = {
  /** Start playing the whole queue from the beginning. */
  async start(items: QueueItem[], cbDisplay: (di: number) => void, cbFinish: () => void) {
    stopped = false;
    queue = items;
    qi = 0;
    onDisplay = cbDisplay;
    onFinish = cbFinish;
    await configureAudioMode();
    await playCurrent();
  },

  /** Stop and release everything. */
  async stop() {
    stopped = true;
    await unload();
  },

  /** Jump to the first queue entry belonging to a given playlist item index. */
  async skipToDisplay(di: number) {
    const target = queue.findIndex((e) => e.displayIdx === di);
    if (target < 0) return;
    stopped = false;
    qi = target;
    await playCurrent();
  },
};
