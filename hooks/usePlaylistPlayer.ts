import { useState, useEffect, useRef, useCallback } from 'react';
import * as Speech from 'expo-speech';

export interface PlaylistWord {
  id: string;
  word: string;
  meaning: string;
  telugu?: string;
  artwork?: string;
}

export interface PlaylistStory {
  id: string;
  storyText: string;
}

export type PlayItem =
  | { kind: 'word'; data: PlaylistWord }
  | { kind: 'story'; data: PlaylistStory };

export type LoopMode = 'none' | 'one' | 'all';

export function usePlaylistPlayer(items: PlayItem[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [loopMode, setLoopMode]         = useState<LoopMode>('none');

  const isPlayingRef = useRef(false);
  const loopModeRef  = useRef<LoopMode>('none');
  const indexRef     = useRef(0);
  const itemsRef     = useRef<PlayItem[]>([]);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const speakAt = useCallback((index: number) => {
    const list = itemsRef.current;
    if (!list.length) return;
    const item = list[index];
    if (!item) return;

    setCurrentIndex(index);
    Speech.stop();

    const onFinished = () => {
      if (!isPlayingRef.current) return;
      const mode  = loopModeRef.current;
      const total = itemsRef.current.length;
      const cur   = indexRef.current;
      if (mode === 'one') speakAt(cur);
      else if (mode === 'all') speakAt((cur + 1) % total);
      else { if (cur + 1 < total) speakAt(cur + 1); else setIsPlaying(false); }
    };

    if (item.kind === 'story') {
      Speech.speak(item.data.storyText, {
        language: 'en-US', rate: 0.85,
        onDone: onFinished, onError: onFinished,
      });
    } else {
      const telugu = item.data.telugu?.trim();
      if (telugu) {
        Speech.speak(item.data.word, {
          language: 'en-US', rate: 0.8,
          onDone: () => {
            if (!isPlayingRef.current) return;
            Speech.speak(telugu, { language: 'te-IN', rate: 0.75, onDone: onFinished, onError: onFinished });
          },
          onError: onFinished,
        });
      } else {
        Speech.speak(item.data.word, { language: 'en-US', rate: 0.8, onDone: onFinished, onError: onFinished });
      }
    }
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true); isPlayingRef.current = true;
    speakAt(indexRef.current);
  }, [speakAt]);

  const pause = useCallback(() => {
    setIsPlaying(false); isPlayingRef.current = false;
    Speech.stop();
  }, []);

  const next = useCallback(() => {
    const total = itemsRef.current.length;
    const n = (indexRef.current + 1) % total;
    if (isPlayingRef.current) speakAt(n); else setCurrentIndex(n);
  }, [speakAt]);

  const prev = useCallback(() => {
    const total = itemsRef.current.length;
    const p = (indexRef.current - 1 + total) % total;
    if (isPlayingRef.current) speakAt(p); else setCurrentIndex(p);
  }, [speakAt]);

  const skipTo = useCallback((index: number) => {
    if (isPlayingRef.current) speakAt(index); else setCurrentIndex(index);
  }, [speakAt]);

  const cycleLoopMode = useCallback(() => {
    setLoopMode(prev => {
      const next: LoopMode = prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none';
      loopModeRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => { return () => { Speech.stop(); }; }, []);

  const currentItem = items[currentIndex] ?? null;
  // Keep backward-compat: expose currentWord for word items
  const currentWord = currentItem?.kind === 'word' ? currentItem.data : null;

  return { currentIndex, currentItem, currentWord, isPlaying, loopMode, play, pause, next, prev, skipTo, cycleLoopMode };
}
