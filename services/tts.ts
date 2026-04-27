import * as Speech from 'expo-speech';

export function speakWord(word: string, meaning: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.stop();
    Speech.speak(`${word}. ${meaning}`, {
      language: 'en-US',
      rate: 0.8,
      onDone: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function speakStory(text: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking() {
  Speech.stop();
}

export function initTts() {
  // expo-speech needs no initialization
}
