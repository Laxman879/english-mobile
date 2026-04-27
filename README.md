# English Learning Mobile App

## Setup

```bash
cd mobile
npm install
```

## Important — set your backend IP
Edit `lib/api.ts` and replace the IP:
```ts
const BASE_URL = 'http://YOUR_PC_IP:5000/api';
```
Find your IP: run `ipconfig` on Windows → look for IPv4 Address

## Run on Android
```bash
# Make sure your phone is connected via USB with USB debugging ON
npm run android

# Or start Expo and scan QR with Expo Go app
npm start
```

## Background Audio — How it works

### Playlist Player (usePlaylistPlayer hook)
- Uses `react-native-tts` which hooks into Android's native TTS engine
- Runs as a foreground service → keeps playing with screen off ✅
- Three loop modes (tap the loop button to cycle):
  - **No Loop** → plays all words once then stops
  - **Loop All** → loops entire playlist continuously  
  - **Loop One** → repeats current word forever (great for memorizing)

### Story Player
- Same TTS engine
- Loop toggle → replays the same story on loop
- Screen off safe ✅

## Loop Modes Summary
| Mode     | Icon Color | Behavior                        |
|----------|------------|---------------------------------|
| No Loop  | Grey       | Play through once, then stop    |
| Loop All | Green      | Loop entire playlist forever    |
| Loop One | Orange     | Repeat current word forever     |

## Build APK (free)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
