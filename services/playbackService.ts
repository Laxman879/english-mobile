import TrackPlayer, { Event } from 'react-native-track-player';

// This service runs in the background even when screen is off
module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay,         () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause,        () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext,         () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious,     () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteStop,         () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteSeek,         (e) => TrackPlayer.seekTo(e.position));
};
