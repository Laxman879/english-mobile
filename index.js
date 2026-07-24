// Custom entry: boot Expo Router, then register the Track Player background
// playback service so lock-screen / notification controls work.
import 'expo-router/entry';
import TrackPlayer from 'react-native-track-player';
import playbackService from './service';

TrackPlayer.registerPlaybackService(() => playbackService);
